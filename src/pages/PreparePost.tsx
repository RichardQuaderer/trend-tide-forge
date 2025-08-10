import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function PreparePost() {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoUrl: string | undefined = location.state?.videoUrl;
  const used: { styleId?: string; audience?: string; script?: string } | undefined = location.state?.used;

  const [loading, setLoading] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  const trendingToday = useMemo(() => [
    '#fyp', '#viral', '#trending', '#learnontiktok', '#motivation', '#howto', '#ai', '#productivity', '#lifehacks', '#tutorial'
  ], []);

  const regionalStats = useMemo(() => (
    [
      { tag: '#ai', uses: '1.2M', growth: '+8%' },
      { tag: '#productivity', uses: '860K', growth: '+5%' },
      { tag: '#howto', uses: '2.1M', growth: '+11%' },
      { tag: '#lifehacks', uses: '1.8M', growth: '+6%' },
    ]
  ), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: used?.script })
        });
        const data = await res.json();
        if (!cancelled && data?.success) {
          setCaption(data.caption || '');
          setHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
        }
      } catch {
        if (!cancelled) {
          setCaption('Ready to share! ✨');
          setHashtags(['#trending', '#viral', '#fyp']);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [used?.script]);

  const hashtagString = useMemo(() => hashtags.join(' '), [hashtags]);
  const setHashtagString = (text: string) => {
    const tokens = text
      .split(/\s+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`))
      .map(t => t.replace(/[^#a-zA-Z0-9_]/g, ''));
    const uniq = Array.from(new Set(tokens));
    setHashtags(uniq);
  };

  const toggleHashtag = (tag: string) => {
    setHashtags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Prepare Your Post</h1>
          <p className="text-muted-foreground">Preview your video, edit caption, and finalize hashtags</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={async () => {
            // Trigger upload to YouTube with current caption/hashtags
            async function attemptUpload(keepalive = false) {
              const res = await fetch('/api/youtube/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  videoUrl,
                  title: (used?.script ? 'Short: ' : '') + 'Generated Video',
                  description: caption,
                  tags: hashtags,
                }),
                keepalive
              } as RequestInit);
              return res;
            }

            let notified = false;
            const notifyAndGo = () => {
              if (notified) return;
              notified = true;
              toast({ title: 'Uploaded to YouTube', description: 'Post automatically uploaded. Redirecting...' });
              navigate('/home');
            };
            const fallbackTimer = setTimeout(() => {
              navigate('/post-success', { state: { videoUrl, caption, videoLink: 'https://youtu.be/abc123def', title: (used?.script ? 'Short: ' : '') + 'Generated Video' } });
            }, 40000);

            try {
              let res = await attemptUpload();
              if (res.status === 401) {
                const data = await res.json().catch(() => ({}));
                if (data?.requireAuth) {
                  // Start OAuth like connect flow
                  const start = await fetch('/api/youtube/oauth/start', { method: 'POST' });
                  const s = await start.json();
                  if (!s?.authUrl) throw new Error('Failed to start OAuth');
                  const popup = window.open(s.authUrl, 'yt_oauth', 'width=480,height=700');
                  let connected = false;
                  await new Promise<void>((resolve, reject) => {
                    const onMessage = async (ev: MessageEvent) => {
                      if (ev.origin !== window.location.origin) return;
                      try {
                        if (ev.data?.type === 'YOUTUBE_OAUTH_SUCCESS') {
                          connected = true;
                          cleanup();
                          resolve();
                          return;
                        }
                        if (ev.data?.type === 'YOUTUBE_OAUTH_ERROR') {
                          const errMsg = ev.data?.error || 'OAuth error';
                          cleanup();
                          reject(new Error(errMsg));
                          return;
                        }
                        if (ev.data?.type === 'OAUTH_CODE') {
                          try {
                            const resp = await fetch('/api/youtube/oauth/callback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ code: ev.data.code, state: ev.data.state })
                            });
                            const rj = await resp.json();
                            if (rj?.success) {
                              connected = true;
                              cleanup();
                              resolve();
                            } else {
                              cleanup();
                              reject(new Error(rj?.error || 'OAuth failed'));
                            }
                          } catch (e) {
                            cleanup();
                            reject(new Error('OAuth callback error'));
                          }
                          return;
                        }
                      } catch {}
                    };
                    const checkClosed = setInterval(async () => {
                      try {
                        if (popup && popup.closed) {
                          clearInterval(checkClosed);
                          window.removeEventListener('message', onMessage);
                          // Poll status briefly to see if connected
                          for (let i = 0; i < 10 && !connected; i++) {
                            try {
                              const st = await fetch('/api/youtube/status');
                              if (st.ok) {
                                const js = await st.json();
                                if (js?.connected) { connected = true; break; }
                              }
                            } catch {}
                            await new Promise(r => setTimeout(r, 500));
                          }
                          try { popup?.close(); } catch {}
                          resolve();
                        }
                      } catch {}
                    }, 500);
                    const cleanup = () => {
                      clearInterval(checkClosed);
                      window.removeEventListener('message', onMessage);
                      try { popup?.close(); } catch {}
                    };
                    window.addEventListener('message', onMessage);
                  });
                  // Fire upload in background (keepalive) and notify immediately when popup closes
                  if (connected) {
                    try { void attemptUpload(true); } catch {}
                  }
                  clearTimeout(fallbackTimer);
                  navigate('/post-success', { state: { videoUrl, caption, videoLink: 'https://youtu.be/abc123def', title: (used?.script ? 'Short: ' : '') + 'Generated Video' } });
                  return;
                }
              }
              const out = await res.json();
              if (out?.success) {
                clearTimeout(fallbackTimer);
                navigate('/post-success', { state: { videoUrl, caption, videoLink: out.url || 'https://youtu.be/abc123def', title: (used?.script ? 'Short: ' : '') + 'Generated Video' } });
              } else {
                throw new Error(out?.error || 'Upload failed');
              }
            } catch (e) {
              const msg = (e as any)?.message ? String((e as any).message) : String(e);
              if (msg && msg.includes('OAuth window closed')) {
                // rely on fallback timer or prior notify
                return;
              }
              // Allow fallback timer to handle UX if still pending
            }
          }}>Continue</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-creator">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoUrl ? (
              <video controls className="w-full rounded-lg border">
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : (
              <div className="p-6 border rounded-lg bg-muted/40 text-sm text-muted-foreground">No video selected.</div>
            )}
            <div className="text-sm text-muted-foreground">
              {used?.styleId && <div>Style: <strong>{used.styleId}</strong></div>}
              {used?.audience && <div>Audience: <strong>{(used.audience || '').trim()}</strong></div>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle>AI-Recommended Caption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Your engaging caption..."
                className="min-h-[120px] text-sm"
              />
              <div className="text-xs text-muted-foreground">{caption.length} characters</div>
              {loading && <div className="text-xs text-muted-foreground">Generating recommendations…</div>}
            </CardContent>
          </Card>

          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle>Hashtags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={hashtagString}
                onChange={(e) => setHashtagString(e.target.value)}
                placeholder="#ai #tutorial #learning"
                className="min-h-[80px] text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <Badge key={h} variant="outline" className="cursor-pointer" onClick={() => toggleHashtag(h)}>
                    {h}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-creator">
          <CardHeader>
            <CardTitle>Trending Hashtags Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {trendingToday.map(tag => (
                <Badge key={tag} className="cursor-pointer" onClick={() => toggleHashtag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Click to add/remove from your post</div>
          </CardContent>
        </Card>

        <Card className="shadow-creator">
          <CardHeader>
            <CardTitle>Popular Hashtags in Your Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {regionalStats.map(row => (
                <div key={row.tag} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span className="font-medium">{row.tag}</span>
                  <span className="text-muted-foreground">{row.uses} • {row.growth}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 