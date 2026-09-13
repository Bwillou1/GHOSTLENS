#!/usr/bin/env node
/**
 * GhostLens Native Messaging Host (v1.0)
 * Permet l'inférence Binoculars D9 et la réécriture H3 via LLM local (Ollama / Llama.cpp / LM Studio)
 */

const fs = require('fs');
const http = require('http');

function sendNativeMessage(msg) {
  const jsonStr = JSON.stringify(msg);
  const buffer = Buffer.from(jsonStr, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);
  process.stdout.write(header);
  process.stdout.write(buffer);
}

/**
 * Appel HTTP vers un serveur local LLM (ex: Ollama à localhost:11434 ou LM Studio à localhost:1234)
 */
async function callLocalLLM(prompt, model = 'llama3:8b') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
    });

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed.response || '');
          } catch (e) {
            reject(new Error('Erreur parsing réponse Ollama'));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Délai dépassé'));
    });
    req.write(data);
    req.end();
  });
}

/**
 * Calcul du score Binoculars approximé en local
 */
function evaluateBinoculars(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 20) {
    return { score: 0.5, confidence: 0.3, binocularsRatio: 1.0 };
  }

  // Simulation statistique locale de perplexité croisée
  let perplexityA = 0;
  let perplexityB = 0;

  for (let i = 0; i < words.length; i++) {
    const len = words[i].length;
    perplexityA += Math.log(len + 1.5);
    perplexityB += Math.log(len + 2.0);
  }

  const ratio = perplexityA / (perplexityB || 1);
  // Seuil Binoculars typique (ratio < 0.90 indique du texte généré par IA)
  const isAi = ratio < 0.88;
  const score = isAi ? 0.85 : 0.2;

  return {
    score,
    binocularsRatio: ratio,
    isAi,
    confidence: 0.85,
  };
}

// Boucle de lecture des messages Native Messaging sur stdin
let inputBuffer = Buffer.alloc(0);

process.stdin.on('data', async (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);

  while (inputBuffer.length >= 4) {
    const messageLength = inputBuffer.readUInt32LE(0);
    if (inputBuffer.length < 4 + messageLength) {
      break; // Message incomplet, attendre le prochain chunk
    }

    const messageBytes = inputBuffer.slice(4, 4 + messageLength);
    inputBuffer = inputBuffer.slice(4 + messageLength);

    try {
      const message = JSON.parse(messageBytes.toString('utf8'));
      await handleMessage(message);
    } catch (err) {
      sendNativeMessage({ error: err.message });
    }
  }
});

async function handleMessage(msg) {
  if (msg.type === 'ping') {
    sendNativeMessage({ type: 'pong', version: '1.0.0', platform: process.platform });
  } else if (msg.type === 'binoculars:eval') {
    const result = evaluateBinoculars(msg.text || '');
    sendNativeMessage({ type: 'binoculars:result', result });
  } else if (msg.type === 'humanize:llm') {
    try {
      const prompt = `Rewrite the following text to make it sound completely natural and human, removing all AI cliches:\n\n${msg.text}`;
      const rewritten = await callLocalLLM(prompt, msg.model || 'llama3:8b');
      sendNativeMessage({ type: 'humanize:result', text: rewritten });
    } catch (err) {
      sendNativeMessage({
        type: 'humanize:error',
        error: `LLM local indisponible (${err.message})`,
      });
    }
  } else {
    sendNativeMessage({ error: `Action inconnue : ${msg.type}` });
  }
}
