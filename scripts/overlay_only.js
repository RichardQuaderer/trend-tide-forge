#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  (ffmpeg).setFfmpegPath(ffmpegStatic);
}

async function findLatest(ciDir, prefix, ext) {
  const entries = await fs.readdir(ciDir).catch(() => []);
  const items = entries.filter(n => n.startsWith(prefix) && n.endsWith(ext));
  if (!items.length) return null;
  items.sort((a,b) => b.localeCompare(a));
  return items[0];
}

async function main() {
  const ciDir = path.resolve('.ci');
  const latestVideo = await findLatest(ciDir, 'generated_', '.mp4');
  if (!latestVideo) {
    console.error('No generated video found in .ci');
    process.exit(1);
  }
  const latestVoice = await findLatest(ciDir, 'voice_', '.mp3');
  if (!latestVoice) {
    console.error('No voice_*.mp3 found in .ci. Run scripts/tts_only.js first.');
    process.exit(1);
  }

  const videoPath = path.join(ciDir, latestVideo);
  const audioPath = path.join(ciDir, latestVoice);
  const base = latestVideo.replace(/\.mp4$/i, '');
  const outPath = path.join(ciDir, `${base}_voiced.mp4`);

  const DURATION = 9; // seconds

  await new Promise((resolve, reject) => {
    const cmd = ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .complexFilter([
        { filter: 'tpad', options: { stop_mode: 'clone', stop_duration: DURATION }, inputs: '0:v', outputs: 'v' },
        { filter: 'atrim', options: `0:${DURATION}`, inputs: '1:a', outputs: 'a1' },
        { filter: 'asetpts', options: 'N/SR/TB', inputs: 'a1', outputs: 'a' }
      ])
      .outputOptions([
        '-map [v]',
        '-map [a]',
        '-c:v libx264',
        '-c:a aac',
        `-t ${DURATION}`,
        '-movflags +faststart'
      ])
      .output(outPath)
      .on('end', resolve)
      .on('error', reject);
    cmd.run();
  });

  console.log(outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 