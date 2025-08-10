# InfluenZer (trend-tide-forge)

InfluenZer helps you generate, render, voice, and publish short-form videos (TikTok/Reels/Shorts) from an idea to a ready-to-post video. It integrates AI for scriptwriting and video generation, runs local model inference for sentiment and virality, and provides a streamlined publishing flow with YouTube upload.

## Highlights
- End‑to‑end flow: Idea → Script (3 alternatives + scores) → Style/Audio → Video (Sora) → Voiceover (ElevenLabs) → Prepare Post → Upload to YouTube
- Onboarding data capture (website/logo/target audience)
- YouTube OAuth (PKCE) with account/channel detection and direct upload
- Sora video generation (Azure OpenAI)
- ElevenLabs voice overlay (Hook + CTA only, 9s)
- Local model inference for sentiment analysis and virality forecasting
- Post preparation with AI‑recommended caption and hashtags (with emojis)
- Job & poll pattern for long‑running tasks
- Dev backend built into Vite via custom middleware (no separate server needed during development)
- Supabase used for customer data, analytics, trends, and post metrics

## Project Structure
- `src/` React + TypeScript frontend (Shadcn UI)
- `vite.config.ts` Vite config with custom server middleware (dev‑only backend)
- `.ci/` Local workspace for inputs/outputs (scripts, styles, OAuth tokens, generated media, jobs)
- `scripts/` Python + Node utilities (Sora CLI fallback, TTS/overlay, YouTube upload)
- `models/` Local model artifacts for sentiment and virality

## Prerequisites
- Node.js 18+
- Python 3.9+
- npm

Optional (but recommended for publishing):
- Google OAuth client credentials (see below)

## Environment Variables
Create a `.env` in the project root with:

```
# OpenAI (script generation)
OPENAI_API_KEY=...
OPENAI_API_VERSION=2024-06-01

# Azure OpenAI (Sora)
AZURE_OPENAI_ENDPOINT=https://<your-endpoint>
AZURE_OPENAI_API_KEY=...

# ElevenLabs (voice overlay)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Google OAuth (YouTube)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth-callback
# Alternatively, set GOOGLE_CLIENT_SECRETS_PATH to a client_secret.json path

# Supabase (data, analytics, trends)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

## Google OAuth Setup (YouTube)
- In Google Cloud Console > Credentials:
  - Create OAuth 2.0 Client ID (Web application)
  - Authorized redirect URI: `http://localhost:8080/oauth-callback`
- Provide credentials by either:
  - `.env` variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, or
  - Put `client_secret.json` in the project root, `.ci/`, or `man/` (the loader checks these), or
  - Set `GOOGLE_CLIENT_SECRETS_PATH` to your JSON file path

## Install & Run
```
npm install
npm run dev
```
Visit `http://localhost:8080`.

## Data & Artifacts
`.ci/` is the working directory (git‑ignored) where the app stores:
- Onboarding inputs: `website.txt`, `logo.*`, `target-audience.txt`
- Current script: `video_script.txt`
- Styles: `video_style.txt`
- Generated media: `generated_*.mp4` (+ `_voiced.mp4` if voice overlay)
- Voice audio: `voice_*.mp3` or per‑job mp3
- OAuth tokens: `youtube.json`
- Job descriptors: `.ci/jobs/*.json`

## Core Workflows

### 1) Onboarding
- Endpoint: `POST /api/save-onboarding`
- Persists: company URL, logo, target audience to `.ci/`

### 2) Script Generation
- Endpoint: `POST /api/generate-script`
- Model: `gpt-4o` forced JSON output
- Returns 3 alternatives + scores:
  - Hook, Brand Safety, Tone, Virality
- Rendering: Structured renderer highlights Hook/Points/CTA; inline editing per alternative

### 3) Style & Audio
- Save style: `POST /api/save-style` → `.ci/video_style.txt`
- Audio options: No audio or AI Voiceover

### 4) Video Generation (Sora)
- Endpoint: `POST /api/render-video` → returns `jobId`
- Poll: `GET /api/render-status?jobId=...`
- Backed by Azure OpenAI Video (Sora) at 1280×720 for 10 seconds
- Prompt combines script + target audience + style
- Output: `.ci/generated_<jobId>.mp4` and served via `/api/video/...`

### 5) Voice Overlay (ElevenLabs)
- Endpoint: `POST /api/voice-overlay`
- Extracts Hook + CTA (labels removed), synthesizes ~9 seconds
- Pads video to 9 seconds and overlays audio with ffmpeg
- Output: `<video>_voiced.mp4` and served via `/api/video/...`, audio via `/api/audio/...`

### 6) Prepare Post
- Endpoint: `POST /api/generate-caption` → caption + hashtags with emojis
- Page shows video preview, editable caption + hashtags, trending tags and regional stats
- Continue:
  - Attempts upload to YouTube
  - If auth needed, opens OAuth popup and retries
  - Success redirects to the success page with a copyable YouTube link

### 7) Upload to YouTube
- Endpoint: `POST /api/youtube/upload`
- Uses Google OAuth tokens to upload the currently previewed video with your caption and hashtags
- If browser tokens require re‑auth, triggers OAuth; if needed, falls back to the Python uploader
- Supports `client_secret.json` in root, `.ci/`, `man/`, or via `GOOGLE_CLIENT_SECRETS_PATH`

## Local Model Inference
Model files live in `models/`:
- `pytorch_model_sentiment_analysis.bin` (sentiment)
- `tf_model_variality_forecasting.h5` (virality)

Endpoints:
- `POST /api/model/sentiment` with `{ text }`
  - Returns `{ task: 'sentiment', label: 'positive|neutral|negative', confidence }`
- `POST /api/model/virality` with `{ text }`
  - Returns `{ task: 'virality', score: 0..100, signals: {...} }`

## Supabase
Supabase stores customer data, analytics, and trend measurements:
- Profiles, OAuth connections, video metadata
- Engagement metrics & regional hashtag stats
- Daily trending hashtag snapshots

Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.

## Dev Server Endpoints (selected)
- Onboarding: `POST /api/save-onboarding`
- Save Script: `POST /api/save-script`
- Generate Script: `POST /api/generate-script`
- Save Style: `POST /api/save-style`
- Render Video: `POST /api/render-video`, `GET /api/render-status`
- Voice Overlay: `POST /api/voice-overlay`
- Caption/Hashtags: `POST /api/generate-caption`
- Serve Media: `GET /api/video/<name>`, `GET /api/audio/<name>`
- YouTube OAuth: `POST /api/youtube/oauth/start`, `POST /api/youtube/oauth/callback`, `GET /api/youtube/status`, `POST /api/youtube/disconnect`, `GET /api/youtube/test`
- YouTube Upload: `POST /api/youtube/upload`
- Local Models: `POST /api/model/sentiment`, `POST /api/model/virality`

## Troubleshooting
- Node not found in PATH: restart shell or add `C:\Program Files\nodejs` to PATH
- OpenAI 400 errors: ensure `OPENAI_API_KEY` and the model access
- Google OAuth 401: ensure redirect URI is `http://localhost:8080/oauth-callback`
- Upload auth loops: delete `.ci/youtube.json` and re‑auth
- Voiceover too short: overlay pads to 9 seconds; ensure latest overlay code

## Scripts
- `scripts/tts_only.js`: Generate voice MP3 from `.ci/video_script.txt` (Hook + CTA)
- `scripts/overlay_only.js`: Overlay latest `voice_*.mp3` onto latest `generated_*.mp4`
- `scripts/generate_video_cli.py`: Sora CLI fallback
- `scripts/youtube_upload_cli.py`: YouTube upload via InstalledAppFlow

## License
Proprietary – for internal development and evaluation.
