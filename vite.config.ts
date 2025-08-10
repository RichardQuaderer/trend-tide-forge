import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { promises as fsp } from "node:fs";
import type { Plugin, ViteDevServer, PluginOption } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const saveOnboardingPlugin: Plugin = {
    name: 'save-onboarding-middleware',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // In-memory store for OAuth state -> PKCE verifier
      const oauthStore = new Map<string, { codeVerifier: string; createdAt: number }>();

      async function readGoogleCreds(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
        const envClientId = process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
        const envClientSecret = process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;
        const envRedirectUri = process.env.GOOGLE_REDIRECT_URI || env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/oauth-callback';
        const envSecretsPath = process.env.GOOGLE_CLIENT_SECRETS_PATH || env.GOOGLE_CLIENT_SECRETS_PATH;
        if (envClientId && envClientSecret) {
          return { clientId: envClientId, clientSecret: envClientSecret, redirectUri: envRedirectUri };
        }
        // Try client_secret.json in project root or .ci
        const candidates = [
          envSecretsPath && path.resolve(process.cwd(), envSecretsPath),
          path.resolve(process.cwd(), 'client_secret.json'),
          path.resolve(process.cwd(), '.ci', 'client_secret.json'),
          path.resolve(process.cwd(), 'man', 'client_secret.json'),
        ].filter(Boolean) as string[];
        for (const file of candidates) {
          try {
            const raw = await fsp.readFile(file, 'utf8');
            const json = JSON.parse(raw);
            const web = json.web || json.installed || json;
            if (web.client_id && web.client_secret) {
              const redirect = envRedirectUri || (web.redirect_uris?.[0] ?? 'http://localhost:8080/oauth-callback');
              return { clientId: web.client_id, clientSecret: web.client_secret, redirectUri: redirect };
            }
          } catch {}
        }
        throw new Error('Google OAuth credentials not found. Set env GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or add client_secret.json');
      }

      function generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        server.ws; // keep reference to avoid tree-shake in TS
        crypto.getRandomValues(array);
        return Buffer.from(array).toString('base64url');
      }
      async function generateCodeChallenge(verifier: string): Promise<string> {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
        return Buffer.from(new Uint8Array(digest)).toString('base64url');
      }
      function generateState(length = 32): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const arr = new Uint8Array(length);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => chars[b % chars.length]).join('');
      }

      async function saveYouTubeTokens(payload: any) {
        const ciDir = path.resolve(process.cwd(), '.ci');
        await fsp.mkdir(ciDir, { recursive: true });
        await fsp.writeFile(path.join(ciDir, 'youtube.json'), JSON.stringify(payload, null, 2), 'utf8');
      }
      async function loadYouTubeTokens(): Promise<any | null> {
        try {
          const raw = await fsp.readFile(path.join(process.cwd(), '.ci', 'youtube.json'), 'utf8');
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }

      // Azure OpenAI (Sora) helpers
      const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || env.AZURE_OPENAI_ENDPOINT;
      const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY;
      const AZURE_API_VERSION = process.env.OPENAI_API_VERSION || env.OPENAI_API_VERSION || 'preview';
      const canUseAzure = !!(AZURE_ENDPOINT && AZURE_API_KEY);

      const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
      const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

      async function ttsToFile(text: string, outPath: string): Promise<void> {
        if (!ELEVEN_KEY) throw new Error('Missing ELEVENLABS_API_KEY');
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_KEY,
            'accept': 'audio/mpeg',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
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
          throw new Error(`TTS failed: ${t}`);
        }
        await fsp.mkdir(path.dirname(outPath), { recursive: true });
        const fs = await import('node:fs');
        const stream = fs.createWriteStream(outPath);
        // Convert web stream to Node stream if needed
        const { Readable } = await import('node:stream');
        const nodeStream = (resp.body as any).pipe ? resp.body as any : Readable.fromWeb(resp.body as any);
        await new Promise<void>((resolve, reject) => {
          nodeStream.pipe(stream);
          stream.on('finish', () => resolve());
          stream.on('error', reject);
          nodeStream.on('error', reject);
        });
      }

      async function azureCreateVideoJob(prompt: string, width: number, height: number): Promise<string> {
        const url = `${AZURE_ENDPOINT}/openai/v1/video/generations/jobs?api-version=${AZURE_API_VERSION}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'api-key': AZURE_API_KEY as string, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'sora', prompt, n_seconds: 10, width, height })
        });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Azure create failed: ${t}`);
        }
        const data: any = await resp.json();
        const id: string | undefined = data?.id;
        if (!id) throw new Error('Azure create missing id');
        return id;
      }
      async function azurePollJob(jobId: string): Promise<any> {
        const url = `${AZURE_ENDPOINT}/openai/v1/video/generations/jobs/${jobId}?api-version=${AZURE_API_VERSION}`;
        const resp = await fetch(url, { headers: { 'api-key': AZURE_API_KEY as string } });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Azure status failed: ${t}`);
        }
        return resp.json();
      }
      async function azureDownloadVideo(generationId: string, outPath: string): Promise<void> {
        const url = `${AZURE_ENDPOINT}/openai/v1/video/generations/${generationId}/content/video?api-version=${AZURE_API_VERSION}`;
        const resp = await fetch(url, { headers: { 'api-key': AZURE_API_KEY as string } });
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Azure download failed: ${t}`);
        }
        const arrayBuffer = await resp.arrayBuffer();
        await fsp.writeFile(outPath, Buffer.from(arrayBuffer));
      }

      server.middlewares.use('/api/save-onboarding', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Uint8Array);
          }
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const { companyUrl, logoBase64, logoFilename, targetAudience } = body as {
            companyUrl?: string;
            logoBase64?: string;
            logoFilename?: string;
            targetAudience?: string;
          };

          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });

          if (companyUrl && typeof companyUrl === 'string') {
            await fsp.writeFile(path.join(ciDir, 'website.txt'), companyUrl, 'utf8');
          }

          if (targetAudience && typeof targetAudience === 'string') {
            await fsp.writeFile(path.join(ciDir, 'target-audience.txt'), targetAudience, 'utf8');
          }

          if (logoBase64 && typeof logoBase64 === 'string') {
            // Allow either a data URL or a bare base64 string
            let base64Data = logoBase64;
            const dataUrlMatch = /^data:(.+);base64,(.*)$/.exec(logoBase64);
            if (dataUrlMatch) {
              base64Data = dataUrlMatch[2];
            }
            let ext = 'png';
            if (logoFilename && logoFilename.includes('.')) {
              const maybeExt = logoFilename.split('.').pop()?.toLowerCase();
              if (maybeExt) ext = maybeExt;
            }
            const buffer = Buffer.from(base64Data, 'base64');
            await fsp.writeFile(path.join(ciDir, `logo.${ext}`), buffer);
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Start OAuth: returns authUrl
      server.middlewares.use('/api/youtube/oauth/start', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const { clientId, redirectUri } = await readGoogleCreds();
          const state = generateState();
          const codeVerifier = generateCodeVerifier();
          const codeChallenge = await generateCodeChallenge(codeVerifier);
          oauthStore.set(state, { codeVerifier, createdAt: Date.now() });

          const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
          authUrl.searchParams.set('client_id', clientId);
          authUrl.searchParams.set('redirect_uri', redirectUri);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
          authUrl.searchParams.set('access_type', 'offline');
          authUrl.searchParams.set('include_granted_scopes', 'true');
          authUrl.searchParams.set('state', state);
          authUrl.searchParams.set('code_challenge', codeChallenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');
          authUrl.searchParams.set('prompt', 'consent');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ authUrl: authUrl.toString() }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // OAuth callback: exchanges code, saves tokens, fetches channel info
      server.middlewares.use('/api/youtube/oauth/callback', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const { code, state } = body as { code?: string; state?: string };
          if (!code || !state) throw new Error('Missing code or state');
          const stored = oauthStore.get(state);
          if (!stored) throw new Error('Invalid or expired state');

          const { clientId, clientSecret, redirectUri } = await readGoogleCreds();

          const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri,
              code_verifier: stored.codeVerifier,
            }).toString(),
          });
          if (!tokenResp.ok) {
            const errText = await tokenResp.text();
            throw new Error(`Token exchange failed: ${errText}`);
          }
          const tokensRespJson = await tokenResp.json();
          const tokens = tokensRespJson as { access_token: string; refresh_token?: string; expires_in?: number };

          // Fetch channel info
          let channelName: string | undefined;
          let channelId: string | undefined;
          const chResp = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (chResp.ok) {
            const chData = (await chResp.json()) as any;
            if (chData.items?.length) {
              channelId = chData.items[0].id as string | undefined;
              channelName = chData.items[0].snippet?.title as string | undefined;
            }
          }

          await saveYouTubeTokens({
            obtainedAt: new Date().toISOString(),
            channelId,
            channelName,
            tokens,
          });

          oauthStore.delete(state);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, channelName }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Connection status
      server.middlewares.use('/api/youtube/status', async (_req: IncomingMessage, res: ServerResponse) => {
        try {
          const saved = await loadYouTubeTokens();
          res.setHeader('Content-Type', 'application/json');
          if (!saved) {
            res.end(JSON.stringify({ connected: false }));
            return;
          }
          res.end(JSON.stringify({ connected: true, channelName: saved.channelName }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ connected: false }));
        }
      });

      // Disconnect
      server.middlewares.use('/api/youtube/disconnect', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const file = path.join(process.cwd(), '.ci', 'youtube.json');
          await fsp.unlink(file).catch(() => {});
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false }));
        }
      });

      // Test connection: fetch channel stats
      server.middlewares.use('/api/youtube/test', async (_req: IncomingMessage, res: ServerResponse) => {
        try {
          const saved = await loadYouTubeTokens();
          if (!saved?.tokens?.access_token) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not connected' }));
            return;
          }
          // Try channel info
          const chResp = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
            headers: { Authorization: `Bearer ${saved.tokens.access_token}` },
          });
          if (!chResp.ok) {
            const text = await chResp.text();
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'YouTube API error', details: text }));
            return;
          }
          const chData2 = (await chResp.json()) as any;
          const channel = chData2.items?.[0];
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, channel }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal error' }));
        }
      });

      // Save chosen script text to .ci/video_script.txt
      server.middlewares.use('/api/save-script', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const scriptText = (body?.script || '').toString();

          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });
          await fsp.writeFile(path.join(ciDir, 'video_script.txt'), scriptText, 'utf8');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Save selected style to .ci/video_style.txt
      server.middlewares.use('/api/save-style', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const styleId = (body?.styleId || '').toString();
          const customStyle = (body?.customStyle || '').toString();
          const content = customStyle ? `style: ${styleId}\ncustom: ${customStyle}` : `style: ${styleId}`;

          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });
          await fsp.writeFile(path.join(ciDir, 'video_style.txt'), content, 'utf8');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Render video via Azure OpenAI (Sora) or Python fallback (job + poll)
      server.middlewares.use('/api/render-video', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};

          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });
          const jobsDir = path.join(ciDir, 'jobs');
          await fsp.mkdir(jobsDir, { recursive: true });

          // Load inputs
          const script = body.script || await fsp.readFile(path.join(ciDir, 'video_script.txt'), 'utf8').catch(() => '');
          const audience = await fsp.readFile(path.join(ciDir, 'target-audience.txt'), 'utf8').catch(() => 'general audience');
          let styleInfo = await fsp.readFile(path.join(ciDir, 'video_style.txt'), 'utf8').catch(() => '');
          const styleMatch = /style:\s*(.*)/.exec(styleInfo);
          const customMatch = /custom:\s*(.*)/s.exec(styleInfo);
          const styleId = body.styleId || (styleMatch ? styleMatch[1] : 'cinematic');
          const customStyle = body.customStyle || (customMatch ? customMatch[1] : '');
          const styleText = customStyle ? `${styleId} (${customStyle})` : styleId;
          const prompt = `Create a ${styleText} short video (10s) for ${audience}. Script guidelines:\n${script}`;

          // Create job
          const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const outName = `generated_${jobId}.mp4`;
          const outPath = path.join(ciDir, outName);
          const jobPath = path.join(jobsDir, `${jobId}.json`);
          const used = { styleId, audience, script };
          await fsp.writeFile(jobPath, JSON.stringify({ status: 'pending', url: null, used }, null, 2), 'utf8');

          if (canUseAzure) {
            // Azure direct flow
            (async () => {
              try {
                await fsp.writeFile(jobPath, JSON.stringify({ status: 'running', url: null, used }, null, 2));
                // Use a supported resolution (16:9 1280x720)
                const azJobId = await azureCreateVideoJob(prompt, 1280, 720);
                // Poll Azure
                const interval = setInterval(async () => {
                  try {
                    const st = await azurePollJob(azJobId);
                    const status = (st?.status || '').toLowerCase();
                    if (status === 'succeeded') {
                      clearInterval(interval);
                      const generationId = st?.generations?.[0]?.id;
                      if (!generationId) throw new Error('No generation id');
                      await azureDownloadVideo(generationId, outPath);
                      await fsp.writeFile(jobPath, JSON.stringify({ status: 'succeeded', url: `/api/video/${outName}`, used }, null, 2));
                    } else if (['failed','cancelled'].includes(status)) {
                      clearInterval(interval);
                      await fsp.writeFile(jobPath, JSON.stringify({ status: 'failed', error: status, url: null, used }, null, 2));
                    }
                  } catch (e:any) {
                    clearInterval(interval);
                    await fsp.writeFile(jobPath, JSON.stringify({ status: 'failed', error: String(e), url: null, used }, null, 2));
                  }
                }, 5000);
              } catch (e:any) {
                await fsp.writeFile(jobPath, JSON.stringify({ status: 'failed', error: String(e), url: null, used }, null, 2));
              }
            })();
          } else {
            // Python fallback
            const { spawn } = await import('node:child_process');
            const py = spawn('python', ['scripts/generate_video_cli.py', '--prompt', prompt, '--out', outPath, '--duration', '10'], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
            py.stderr.on('data', async (d) => {
              try { await fsp.writeFile(jobPath, JSON.stringify({ status: 'running', url: null, used }, null, 2)); } catch {}
            });
            py.on('error', async (e) => {
              try { await fsp.writeFile(jobPath, JSON.stringify({ status: 'failed', error: String(e), url: null, used }, null, 2)); } catch {}
            });
            py.on('close', async (code) => {
              try {
                if (code === 0) {
                  await fsp.writeFile(jobPath, JSON.stringify({ status: 'succeeded', url: `/api/video/${outName}`, used }, null, 2));
                } else {
                  await fsp.writeFile(jobPath, JSON.stringify({ status: 'failed', error: `exit ${code}`, url: null, used }, null, 2));
                }
              } catch {}
            });
            py.unref();
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, jobId }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Poll job status
      server.middlewares.use('/api/render-status', async (req: IncomingMessage & { url?: string }, res: ServerResponse) => {
        try {
          const url = new URL(req.url || '', 'http://localhost');
          const jobId = url.searchParams.get('jobId');
          if (!jobId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'jobId is required' }));
            return;
          }
          const jobPath = path.join(process.cwd(), '.ci', 'jobs', `${jobId}.json`);
          const raw = await fsp.readFile(jobPath, 'utf8').catch(() => null);
          if (!raw) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'job not found' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(raw);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'status check failed' }));
        }
      });

      // Serve generated videos and audio from .ci
      server.middlewares.use(async (req: IncomingMessage & { url?: string }, res: ServerResponse, next) => {
        try {
          if (!req.url) return next();
          if (req.url.startsWith('/api/video/')) {
            const name = decodeURIComponent(req.url.replace('/api/video/', ''));
            const filePath = path.join(process.cwd(), '.ci', name);
            try {
              const stat = await fsp.stat(filePath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'video/mp4');
              res.setHeader('Content-Length', String(stat.size));
              const fs = await import('node:fs');
              fs.createReadStream(filePath).pipe(res);
              return;
            } catch (e) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Not found' }));
              return;
            }
          }
          if (req.url.startsWith('/api/audio/')) {
            const name = decodeURIComponent(req.url.replace('/api/audio/', ''));
            const filePath = path.join(process.cwd(), '.ci', name);
            try {
              const stat = await fsp.stat(filePath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', String(stat.size));
              const fs = await import('node:fs');
              fs.createReadStream(filePath).pipe(res);
              return;
            } catch (e) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Not found' }));
              return;
            }
          }
          next();
        } catch (e) {
          next();
        }
      });

      // Voice overlay: synthesize 9s voice and mux on top of a video
      server.middlewares.use('/api/voice-overlay', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });

          // Determine video name
          let videoName: string | undefined = body?.videoName;
          if (!videoName) {
            const entries = await fsp.readdir(ciDir);
            const vids = entries.filter(n => n.endsWith('.mp4') && n.startsWith('generated_'));
            if (!vids.length) throw new Error('No generated video found');
            // pick latest by name timestamp
            vids.sort((a,b) => b.localeCompare(a));
            videoName = vids[0];
          }
          const videoPath = path.join(ciDir, videoName);
          const base = videoName.replace(/\.mp4$/i, '');

          // Load script and normalize to only Hook + CTA (no titles/points)
          let rawText = await fsp.readFile(path.join(ciDir, 'video_script.txt'), 'utf8').catch(() => '');
          const stripLabel = (s: string) => String(s || '').replace(/^\s*(Hook:|CTA:)/i, '').trim();
          async function flattenScript(text: string): Promise<string> {
            try {
              const obj = JSON.parse(text);
              const hook = stripLabel((obj as any).Hook || (obj as any).hook || '');
              const cta = stripLabel((obj as any).CTA || (obj as any).cta || '');
              const parts: string[] = [];
              if (hook) parts.push(hook);
              if (cta) parts.push(cta);
              return parts.join('. ');
            } catch {}
            const hookMatch = /(^|\n)\s*Hook:\s*([^\n]+)/i.exec(text);
            const ctaMatch = /(^|\n)\s*CTA:\s*([^\n]+)/i.exec(text);
            if (hookMatch || ctaMatch) {
              const parts: string[] = [];
              if (hookMatch?.[2]) parts.push(stripLabel(hookMatch[2]));
              if (ctaMatch?.[2]) parts.push(stripLabel(ctaMatch[2]));
              if (parts.length) return parts.join('. ');
            }
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
            const parts: string[] = [];
            if (hook) parts.push(stripLabel(hook));
            if (cta && cta !== hook) parts.push(stripLabel(cta));
            return parts.join('. ');
          }
          const text = (await flattenScript(rawText)).trim();
          if (!text) throw new Error('Script is empty');

          // Synthesize voice mp3 to .ci
          const mp3Name = `${base}.mp3`;
          const mp3Path = path.join(ciDir, mp3Name);
          await ttsToFile(text, mp3Path);

          // Use ffmpeg to overlay: pad video to 9s and trim audio to 9s
          const ffmpegStatic = (await import('ffmpeg-static')).default as string;
          const ffmpeg = (await import('fluent-ffmpeg')).default;
          if (ffmpegStatic) {
            (ffmpeg as any).setFfmpegPath(ffmpegStatic);
          }
          const voicedName = `${base}_voiced.mp4`;
          const voicedPath = path.join(ciDir, voicedName);

          const DURATION = 9; // seconds

          await new Promise<void>((resolve, reject) => {
            const cmd = ffmpeg()
              .input(videoPath)
              .input(mp3Path)
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
              .output(voicedPath)
              .on('end', () => resolve())
              .on('error', (e: any) => reject(e));
            cmd.run();
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, audioUrl: `/api/audio/${mp3Name}`, url: `/api/video/${voicedName}` }));
        } catch (e:any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: String(e) }));
        }
      });

      // Generate script with ChatGPT using idea + target audience from .ci
      server.middlewares.use('/api/generate-script', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const idea = (body?.idea || '').toString();

          const taPath = path.join(process.cwd(), '.ci', 'target-audience.txt');
          let targetAudience = '';
          try { targetAudience = await fsp.readFile(taPath, 'utf8'); } catch {}

          const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not set' }));
            return;
          }

          const systemPrompt = 'You are an expert short-form video scriptwriter. Return STRICT JSON only. Generate three distinct short scripts (60-120 seconds) optimized for TikTok/YouTube Shorts with a strong hook, tight pacing, and a clear CTA. Each script must be markdown with clear sections: Hook, Points (bulleted), CTA.';
          const userPrompt = {
            instructions: 'Return JSON with {"scripts":["...","...","..."]}. No extra text.',
            idea,
            target_audience: targetAudience || 'general audience',
            format_requirements: [
              'Each script under 100 words',
              'Sections: Hook, Points (bulleted), CTA',
              'Vary tone/style across the three alternatives'
            ]
          };

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userPrompt) },
              ],
              temperature: 0.9,
              max_tokens: 900,
              response_format: { type: 'json_object' },
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            console.error('OpenAI error response:', errText);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'OpenAI error', details: errText }));
            return;
          }
          const data = await resp.json() as any;
          const content = data?.choices?.[0]?.message?.content?.trim() || '';

          // Try to parse JSON; fallback to split by \n---\n
          let scripts: string[] = [];
          try {
            const parsed = JSON.parse(content);
            const arr = parsed?.scripts;
            if (Array.isArray(arr)) scripts = arr.map((s: any) => {
              if (typeof s === 'string') return s;
              if (s && typeof s === 'object') {
                const candidate = (s.markdown ?? s.content ?? s.script ?? s.text ?? '').toString();
                return candidate || JSON.stringify(s);
              }
              return '';
            });
          } catch {}
          if (scripts.length === 0) {
            scripts = content.split(/\n-{3,}\n/).map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
          }

          // Scoring logic (ported from script_verifiers.py subset)
          const POWER_HOOKS = new Set(['what if','did you know','here\'s why','stop','warning','the secret','nobody tells you','don\'t make this mistake','3 things','top 5','you won\'t believe','the truth']);
          const PROFANITY = new Set(['fuck','shit','bitch','asshole','bastard','dick','cunt']);
          const POSITIVE_WORDS = new Set(['amazing','great','awesome','love','win','success','powerful','easy','simple','best','boost','growth','viral','smart']);
          const NEGATIVE_WORDS = new Set(['bad','worst','hate','fail','hard','problem','risk','danger','scam','loss','decline']);

          function lowerWords(text: string): string[] {
            return (text || '').toLowerCase().match(/[a-z0-9']+/g) || [];
          }
          function sentences(text: string): string[] {
            return (text || '').split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
          }
          function measureHookStrength(script: string) {
            const first = (sentences(script)[0] || '').toLowerCase();
            let powerHits = 0; POWER_HOOKS.forEach(ph => { if (first.includes(ph)) powerHits++; });
            const lengthWords = lowerWords(first).length;
            const lengthScore = (lengthWords >= 4 && lengthWords <= 16) ? 1.0 : (lengthWords <= 24 ? 0.5 : 0.2);
            const score = Math.max(0, Math.min(1, 0.6 * lengthScore + 0.4 * (powerHits ? 1 : 0)));
            return { score: Number(score.toFixed(3)), first_sentence: first, power_hits: powerHits };
          }
          function brandSafety(script: string) {
            const text = (script || '').toLowerCase();
            const hits: string[] = [];
            PROFANITY.forEach(p => { if (text.includes(p)) hits.push(p); });
            const safe = hits.length === 0;
            return { safe, hits: hits.sort() };
          }
          function toneClassification(script: string) {
            const text = (script || '').toLowerCase();
            const labels: [string, boolean][] = [
              ['persuasive', ['you','now','today','must','need to','cta'].some(x => text.includes(x))],
              ['informative', ['how to','steps','tip','learn','guide','why'].some(x => text.includes(x))],
              ['entertaining', ['funny','joke','crazy','wild','insane','wow'].some(x => text.includes(x))],
              ['story', ['story','once','i was','we were','learned'].some(x => text.includes(x))],
            ];
            const active = labels.filter(([,f]) => f).map(([l]) => l);
            const label = active[0] || 'neutral';
            return { label, candidates: active };
          }
          function analyzeToxicity(script: string) {
            const words = lowerWords(script);
            const toxicHits = words.filter(w => PROFANITY.has(w));
            const score = Math.min(1, toxicHits.length / 3.0);
            return { score: Number(score.toFixed(3)) };
          }
          function analyzeSentiment(script: string) {
            const words = lowerWords(script);
            let pos = 0, neg = 0; words.forEach(w => { if (POSITIVE_WORDS.has(w)) pos++; if (NEGATIVE_WORDS.has(w)) neg++; });
            const total = Math.max(1, pos + neg);
            const sentiment = (pos - neg) / total;
            return { score: Number(sentiment.toFixed(3)) };
          }
          function detectCta(script: string) {
            const text = (script || '').toLowerCase();
            const phrases = ['subscribe','follow','like this','comment','share','click the link','link in bio','check the description','try this','save this','watch till the end'];
            const present = phrases.some(p => text.includes(p));
            return { present };
          }
          function readability(script: string) {
            const words = lowerWords(script);
            const sent = sentences(script);
            const numWords = Math.max(1, words.length);
            const numSentences = Math.max(1, sent.length);
            const avgWps = numWords / numSentences;
            const avgCpw = words.reduce((a,w)=>a+w.length,0) / numWords;
            const ease = Math.max(0, Math.min(1, 1.2 - (avgWps / 25.0) - (avgCpw / 8.0)));
            return { ease };
          }
          function vocabularyDiversity(script: string) {
            const words = lowerWords(script).filter(w => /^[a-z]+$/.test(w));
            const unique = new Set(words).size;
            const total = Math.max(1, words.length);
            const diversity = unique / total;
            return { diversity };
          }
          function viralityScore(script: string) {
            const tox = analyzeToxicity(script).score;
            const sent = analyzeSentiment(script).score; // -1..1
            const hook = measureHookStrength(script).score;
            const cta = detectCta(script).present ? 1.0 : 0.0;
            const read = readability(script).ease;
            const vocab = vocabularyDiversity(script).diversity;
            const base = 0.25*hook + 0.2*(0.5 + 0.5*sent) + 0.15*cta + 0.2*read + 0.15*vocab + 0.05*(1.0 - tox);
            const score = Math.round(Math.max(0, Math.min(1, base)) * 100);
            return { score };
          }

          const results = scripts.map((s: string) => ({
            script: s,
            scores: {
              hook: measureHookStrength(s),
              brand_safety: brandSafety(s),
              tone: toneClassification(s),
              virality: viralityScore(s),
            },
          }));

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, results }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Generate caption + hashtags for post preparation
      server.middlewares.use('/api/generate-caption', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};

          const ciDir = path.resolve(process.cwd(), '.ci');
          const script: string = (body?.script || '').toString() || await fsp.readFile(path.join(ciDir, 'video_script.txt'), 'utf8').catch(() => '');
          const audience = await fsp.readFile(path.join(ciDir, 'target-audience.txt'), 'utf8').catch(() => 'general audience');

          const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not set' }));
            return;
          }

          const systemPrompt = 'You are a social media copywriter for short-form video (TikTok, Reels, Shorts). Return STRICT JSON only.';
          const userPrompt = {
            instructions: 'Produce JSON {"caption":"...","hashtags":["#tag1","#tag2",...]} only.',
            constraints: [
              'Caption: 1-2 sentences, under 200 characters, engaging but brand-safe; include 1-3 relevant emojis',
              'Hashtags: 10-15 items, all lowercase, include # prefix, no spaces inside a tag; allow emojis; include 2-3 hashtags that incorporate emojis',
              'Blend broad reach tags with 3-5 niche tags relevant to topic',
            ],
            target_audience: String(audience || 'general audience'),
            script: String(script || '')
          };

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userPrompt) },
              ],
              temperature: 0.7,
              max_tokens: 400,
              response_format: { type: 'json_object' },
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            console.error('OpenAI caption error:', errText);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'OpenAI error', details: errText }));
            return;
          }
          const data = await resp.json() as any;
          const content = data?.choices?.[0]?.message?.content?.trim() || '';
          let caption = '';
          let hashtags: string[] = [];
          try {
            const parsed = JSON.parse(content);
            caption = (parsed.caption || '').toString();
            hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: any) => String(h)) : [];
          } catch {
            caption = 'Ready to share!';
            hashtags = ['#fyp', '#viral'];
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, caption, hashtags }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }));
        }
      });

      // Upload to YouTube using saved OAuth tokens
      server.middlewares.use('/api/youtube/upload', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        try {
          const chunks: Uint8Array[] = [];
          for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const ciDir = path.resolve(process.cwd(), '.ci');
          await fsp.mkdir(ciDir, { recursive: true });

          const saved = await loadYouTubeTokens();
          if (!saved?.tokens?.access_token) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ requireAuth: true }));
            return;
          }

          const { videoUrl, title, description, tags } = body as { videoUrl?: string; title?: string; description?: string; tags?: string[] };
          if (!videoUrl) throw new Error('videoUrl is required');

          // Resolve local path from served URL
          let filePath = '';
          if (typeof videoUrl === 'string' && videoUrl.startsWith('/api/video/')) {
            const name = decodeURIComponent(videoUrl.replace('/api/video/', ''));
            filePath = path.join(ciDir, name);
          } else if (typeof videoUrl === 'string' && /^https?:\/\//i.test(videoUrl)) {
            // Remote URL: download to temp
            const resp = await fetch(videoUrl);
            if (!resp.ok) throw new Error('Failed to fetch video content');
            const buf = Buffer.from(await resp.arrayBuffer());
            const tmp = path.join(ciDir, `upload_${Date.now()}.mp4`);
            await fsp.writeFile(tmp, buf);
            filePath = tmp;
          } else {
            // Assume local relative path
            filePath = path.isAbsolute(videoUrl) ? videoUrl : path.join(ciDir, videoUrl);
          }

          const stat = await fsp.stat(filePath).catch(() => null);
          if (!stat) throw new Error('Video file not found');

          // Use googleapis
          const { google } = await import('googleapis');
          const { clientId, clientSecret, redirectUri } = await readGoogleCreds();
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
          oauth2Client.setCredentials(saved.tokens);
          const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

          const requestBody: any = {
            snippet: {
              title: title || 'Generated Video',
              description: description || '',
              tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
            },
            status: { privacyStatus: 'public' },
          };

          const fs = await import('node:fs');
          const media = { body: fs.createReadStream(filePath) } as any;

          let resp;
          try {
            resp = await youtube.videos.insert({
              part: ['snippet', 'status'],
              requestBody,
              media,
            } as any);
          } catch (e: any) {
            const msg = String(e?.message || '');
            const needsAuth = msg.includes('invalid_grant') || msg.includes('insufficientPermissions') || msg.includes('Login Required') || msg.includes('unauthorized');
            if (needsAuth) {
              // Fall back to Python CLI, which runs InstalledAppFlow 
              const { spawn } = await import('node:child_process');
              const args: string[] = [
                'scripts/youtube_upload_cli.py',
                '--file', filePath,
                '--title', requestBody.snippet.title,
                '--description', requestBody.snippet.description,
                '--tags', (requestBody.snippet.tags || []).join(',')
              ];
              const py = spawn('python', args, { stdio: ['ignore', 'pipe', 'pipe'] });
              let stdout = '';
              let stderr = '';
              py.stdout.on('data', (d) => { stdout += d.toString(); });
              py.stderr.on('data', (d) => { stderr += d.toString(); });
              py.on('close', (code) => {
                res.setHeader('Content-Type', 'application/json');
                if (code === 0) {
                  try {
                    const out = JSON.parse(stdout || '{}');
                    if (out?.videoId) {
                      res.end(JSON.stringify({ success: true, videoId: out.videoId, url: `https://youtu.be/${out.videoId}` }));
                      return;
                    }
                  } catch {}
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Upload failed' }));
                } else {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: stderr || 'Upload failed' }));
                }
              });
              return;
            }
            throw e;
          }

          const videoId = resp?.data?.id as string | undefined;
          if (!videoId) throw new Error('Upload did not return a video id');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, videoId, url: `https://youtu.be/${videoId}` }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Upload failed' }));
        }
      });

      // Model endpoints (local models)
      server.middlewares.use('/api/model/sentiment', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return; }
        try {
          const chunks: Uint8Array[] = []; for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const text = (body?.text || '').toString();
          if (!text) { res.statusCode = 400; res.end(JSON.stringify({ error: 'text is required' })); return; }
          const { spawn } = await import('node:child_process');
          const py = spawn('python', ['scripts/predict_models.py', '--task', 'sentiment', '--text', text], { stdio: ['ignore','pipe','pipe'] });
          let out = ''; let err = '';
          py.stdout.on('data', d => out += d.toString());
          py.stderr.on('data', d => err += d.toString());
          py.on('close', (code) => {
            res.setHeader('Content-Type', 'application/json');
            if (code === 0) { try { res.end(out); } catch { res.end(JSON.stringify({ error: 'bad output' })); } }
            else { res.statusCode = 500; res.end(JSON.stringify({ error: err || 'failed' })); }
          });
        } catch (e:any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: String(e) }));
        }
      });
      server.middlewares.use('/api/model/virality', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return; }
        try {
          const chunks: Uint8Array[] = []; for await (const c of req) chunks.push(c as Uint8Array);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          const text = (body?.text || '').toString();
          if (!text) { res.statusCode = 400; res.end(JSON.stringify({ error: 'text is required' })); return; }
          const { spawn } = await import('node:child_process');
          const py = spawn('python', ['scripts/predict_models.py', '--task', 'virality', '--text', text], { stdio: ['ignore','pipe','pipe'] });
          let out = ''; let err = '';
          py.stdout.on('data', d => out += d.toString());
          py.stderr.on('data', d => err += d.toString());
          py.on('close', (code) => {
            res.setHeader('Content-Type', 'application/json');
            if (code === 0) { try { res.end(out); } catch { res.end(JSON.stringify({ error: 'bad output' })); } }
            else { res.statusCode = 500; res.end(JSON.stringify({ error: err || 'failed' })); }
          });
        } catch (e:any) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: String(e) }));
        }
      });
    }
  };

  const plugins: PluginOption[] = [
    react(),
    ...(mode === 'development' ? [componentTagger()] : []),
    saveOnboardingPlugin,
  ];

  return {
  server: {
    host: "::",
    port: 8080,
  },
    plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
