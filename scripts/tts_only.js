#!/usr/bin/env node
import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';

if (!ELEVEN_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in environment');
  process.exit(1);
}

function stripLabel(s) {
  return String(s || '').replace(/^\s*(Hook:|CTA:)/i, '').trim();
}

async function flattenScript(text) {
  // Prefer JSON: only Hook and CTA
  try {
    const obj = JSON.parse(text);
    const hook = stripLabel(obj.Hook || obj.hook || '');
    const cta = stripLabel(obj.CTA || obj.cta || '');
    const parts = [];
    if (hook) parts.push(hook);
    if (cta) parts.push(cta);
    return parts.join('. ');
  } catch {}

  // Plaintext: extract labeled Hook/CTA if present
  const hookMatch = /(^|\n)\s*Hook:\s*([^\n]+)/i.exec(text);
  const ctaMatch = /(^|\n)\s*CTA:\s*([^\n]+)/i.exec(text);
  if (hookMatch || ctaMatch) {
    const parts = [];
    if (hookMatch?.[2]) parts.push(stripLabel(hookMatch[2]));
    if (ctaMatch?.[2]) parts.push(stripLabel(ctaMatch[2]));
    if (parts.length) return parts.join('. ');
  }

  // Heuristic fallback: pick first and last non-bullet, non-title lines; ignore points
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^Points:?/i.test(l))
    .filter(l => !/^-\s|^•\s/.test(l));
  let hook = '';
  let cta = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) { hook = lines[i]; break; }
  }
  for (let j = lines.length - 1; j >= 0; j--) {
    if (lines[j]) { cta = lines[j]; break; }
  }
  const parts = [];
  if (hook) parts.push(stripLabel(hook));
  if (cta && cta !== hook) parts.push(stripLabel(cta));
  return parts.join('. ');
}

async function main() {
  const ciDir = path.resolve('.ci');
  await fs.mkdir(ciDir, { recursive: true });
  const scriptPath = path.join(ciDir, 'video_script.txt');
  let text = '';
  try {
    text = await fs.readFile(scriptPath, 'utf8');
  } catch {
    console.error('No .ci/video_script.txt found');
    process.exit(1);
  }
  text = (await flattenScript(text)).trim();
  if (!text) {
    console.error('Script is empty');
    process.exit(1);
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'accept': 'audio/mpeg',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.7,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });

  if (!resp.ok || !resp.body) {
    const t = await resp.text().catch(() => '');
    console.error('TTS failed:', t);
    process.exit(1);
  }

  const ts = Date.now();
  const outName = `voice_${ts}.mp3`;
  const outPath = path.join(ciDir, outName);
  const arrayBuffer = await resp.arrayBuffer();
  await fs.writeFile(outPath, Buffer.from(arrayBuffer));
  console.log(outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 