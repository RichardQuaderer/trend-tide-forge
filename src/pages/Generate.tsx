import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wand2, 
  Sparkles, 
  Film, 
  Music, 
  Settings, 
  Upload,
  Play,
  Volume2,
  Captions,
  ArrowRight,
  Shield,
  ShieldCheck
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

const videoStyles = [
  { id: "cinematic", label: "Cinematic", desc: "High-quality, dramatic visuals", emoji: "🎬", color: "border-purple-200 bg-purple-50" },
  { id: "animated", label: "Animated", desc: "Motion graphics and animations", emoji: "🎨", color: "border-blue-200 bg-blue-50" },
  { id: "meme", label: "Meme", desc: "Funny, viral-worthy content", emoji: "😂", color: "border-orange-200 bg-orange-50" },
  { id: "vlog", label: "Vlog", desc: "Personal, authentic style", emoji: "🎥", color: "border-green-200 bg-green-50" },
  { id: "documentary", label: "Documentary", desc: "Narrative, interview-driven", emoji: "🎙", color: "border-slate-200 bg-slate-50" },
  { id: "tutorial", label: "Tutorial", desc: "Step-by-step explainer", emoji: "📚", color: "border-amber-200 bg-amber-50" },
];

function RenderScriptBlock({ script }: { script: string }) {
  try {
    const obj = JSON.parse(script);
    const hook = obj.Hook || obj.hook;
    const points: string[] = obj.Points || obj.points || [];
    const cta = obj.CTA || obj.cta;
    const isStructured = hook || (points && Array.isArray(points)) || cta;
    if (isStructured) {
      return (
        <div className="space-y-4">
          {hook && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <h5 className="font-bold uppercase tracking-wide text-primary text-base md:text-lg flex items-center gap-2">🔥 Hook</h5>
              <p className="text-sm leading-relaxed">{hook}</p>
            </div>
          )}
          {Array.isArray(points) && points.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h5 className="font-bold uppercase tracking-wide text-blue-800 text-base md:text-lg flex items-center gap-2">📌 Points</h5>
              <ul className="list-disc pl-5 space-y-1 text-blue-900">
                {points.map((p, i) => (
                  <li key={i} className="text-sm leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>
          )}
          {cta && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <h5 className="font-bold uppercase tracking-wide text-green-800 text-base md:text-lg flex items-center gap-2">🚀 CTA</h5>
              <p className="text-sm leading-relaxed">{cta}</p>
            </div>
          )}
        </div>
      );
    }
  } catch {}
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{script}</ReactMarkdown>
    </div>
  );
}

const aiModels = [
  { id: "pika", label: "Pika Labs", status: "available", speed: "Fast", quality: "Good" },
  { id: "runway", label: "Runway ML", status: "available", speed: "Medium", quality: "Great" },
  { id: "sora", label: "Sora*", status: "mock", speed: "Slow", quality: "Amazing" },
  { id: "voice", label: "Voice AI*", status: "mock", speed: "Fast", quality: "Natural" },
];

export default function Generate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [script, setScript] = useState("How to be productive in 2024 - the ultimate guide that will change your life");
  useEffect(() => {
    const pre = sessionStorage.getItem('generated_script');
    if (pre) {
      setScript(pre);
      sessionStorage.removeItem('generated_script');
    }
  }, []);
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [selectedSound, setSelectedSound] = useState("none");
  const [selectedModel, setSelectedModel] = useState("pika");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [rendering, setRendering] = useState(false);
  const [lastUsed, setLastUsed] = useState<{ styleId?: string; audience?: string; script?: string }>({});
  const [brandConsistencyEnabled, setBrandConsistencyEnabled] = useState(false);

  const improveScriptMutation = useMutation({
    mutationFn: (script: string) => api.improveScript(script),
    onSuccess: (data) => {
      setScript(data.improvedScript);
      toast({
        title: "Script improved! ✨",
        description: "Added viral hooks and optimizations",
      });
    },
  });
  const handleImproveScript = () => improveScriptMutation.mutate(script);

  const generateVideoMutation = useMutation({
    mutationFn: (data: any) => api.generateVideo(data.script, data.settings),
    onSuccess: (_data) => {
      // No done notification; preview/regeneration handled below
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  const handleGenerate = () => {
    // Reuse Sora job flow
    handleRender();
  };

  const handleSaveStyle = async () => {
    try {
      const res = await fetch('/api/save-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: selectedStyle, customStyle: customStylePrompt })
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to save style');
      toast({ title: 'Style saved', description: 'Your preferred style was saved.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handleRender = async () => {
    try {
      setRendering(true);
      setVideoUrl("");
      // Create job
      const startRes = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: selectedStyle })
      });
      const startData = await startRes.json();
      if (!startData?.success || !startData?.jobId) throw new Error(startData?.error || 'Failed to start render');
      const jobId = startData.jobId as string;

      // Poll status
      const poll = async (): Promise<void> => {
        const s = await fetch(`/api/render-status?jobId=${encodeURIComponent(jobId)}`);
        if (!s.ok) throw new Error('Status check failed');
        const st = await s.json();
        if (st.status === 'succeeded' && st.url) {
          setLastUsed(st.used || {});
          let finalUrl: string = st.url as string;
          if (selectedSound === 'ai-voice') {
            try {
              const vidName = (st.url as string).split('/api/video/')[1];
              if (vidName) {
                setRendering(true);
                const ovRes = await fetch('/api/voice-overlay', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ videoName: vidName })
                });
                const ov = await ovRes.json();
                if (ov?.success && ov?.url) {
                  finalUrl = ov.url;
                } else {
                  finalUrl = st.url as string;
                }
              }
            } catch (e) {
              toast({ title: 'Voice overlay failed', description: 'Showing video without narration.', variant: 'destructive' });
              finalUrl = st.url as string;
            }
          }
          setVideoUrl(finalUrl);
          setRendering(false);
          return;
        }
        if (st.status === 'failed') {
          throw new Error(st.error || 'Render failed');
        }
        setTimeout(poll, 3000);
      };
      await poll();
    } catch (e: any) {
      setRendering(false);
      toast({ title: 'Render failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient">Configure Your Video</h1>
        <p className="text-muted-foreground">Choose your style, audio, and model</p>
      </div>

        <div className="space-y-6">
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>Script Editor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Write your video script here..."
                className="min-h-[200px] text-base"
              />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{script.length} characters</span>
                <span>~{Math.ceil(script.length / 150)} seconds</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleImproveScript}
                  disabled={improveScriptMutation.isPending}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {improveScriptMutation.isPending ? "Improving..." : "AI Improve"}
                </Button>
                <Button variant="outline">
                  Insert Hook
                </Button>
              </div>
              
              <Button 
                variant={brandConsistencyEnabled ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                  setBrandConsistencyEnabled(!brandConsistencyEnabled);
                  toast({
                    title: brandConsistencyEnabled ? "Brand consistency disabled" : "Brand consistency enabled! ✨",
                    description: brandConsistencyEnabled ? "Script will use standard optimization" : "Script optimized for your brand guidelines",
                  });
                }}
              >
                {brandConsistencyEnabled ? (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                {brandConsistencyEnabled ? "Brand Consistency ON" : "Enable Brand Consistency"}
              </Button>
            </CardContent>
          </Card>

          {/* Script Preview */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-primary" />
                <span>Video Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Video Structure:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span><strong>Hook (0-3s):</strong> {script.split('.')[0] || "Opening line to grab attention"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>Content (3-45s):</strong> Main message and value delivery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>CTA (45-60s):</strong> Call to action and engagement prompt</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">AI Recommendations:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Add visual text overlay for key points</li>
                  <li>• Use trending audio for background music</li>
                  <li>• Include captions for accessibility</li>
                  <li>• Optimize for {selectedStyle} style</li>
                </ul>
              </div>

              <Textarea
                placeholder="Want to modify the script? Describe your changes here..."
                className="min-h-[80px]"
              />
              
              <Button variant="outline" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Video Style */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Film className="w-5 h-5 text-primary" />
                <span>Video Style</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {videoStyles.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedStyle === style.id 
                        ? `ring-2 ring-primary ${style.color}` 
                        : 'hover:shadow-creator'
                    }`}
                    onClick={() => setSelectedStyle(style.id)}
                  >
                  <CardContent className="p-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-white/70 border">
                        <span aria-hidden>{style.emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{style.label}</h3>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{style.desc}</p>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-3 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Want to describe your own style?</p>
                <Textarea
                  value={customStylePrompt}
                  onChange={(e) => setCustomStylePrompt(e.target.value)}
                  placeholder="Describe your ideal video style... (e.g., dark and mysterious, bright and energetic, minimalist with clean graphics)"
                  className="min-h-[80px] text-sm"
                />
              <Button variant="outline" className="w-full" onClick={handleSaveStyle}>
                  <Wand2 className="w-4 h-4 mr-2" />
                Save Style
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Music className="w-5 h-5 text-primary" />
                <span>Sound</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedSound} onValueChange={setSelectedSound}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-voice">🤖 AI Voiceover</SelectItem>
                  <SelectItem value="none">🔇 No Audio</SelectItem>
                <SelectItem value="trending" disabled>
                  <div className="flex items-center justify-between w-full opacity-50">
                    <span>🔥 Trending Audio</span>
                    <Badge variant="outline" className="text-xs opacity-70">Coming Soon</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="upload" disabled>
                  <div className="flex items-center justify-between w-full opacity-50">
                    <span>📁 Upload Audio</span>
                    <Badge variant="outline" className="text-xs opacity-70">Coming Soon</Badge>
                  </div>
                </SelectItem>
                </SelectContent>
              </Select>

              {selectedSound === "upload" && (
                <div className="border border-dashed border-muted-foreground rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop audio file here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>AI Model</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center justify-between w-full">
                      <span>{aiModels.find(m => m.id === selectedModel)?.label}</span>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>Speed: {aiModels.find(m => m.id === selectedModel)?.speed}</span>
                        <span>Quality: {aiModels.find(m => m.id === selectedModel)?.quality}</span>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                    disabled={model.id !== 'sora'}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                        <span className={model.id !== 'sora' ? 'opacity-50' : ''}>{model.label}</span>
                        {model.id !== 'sora' && (
                          <Badge variant="outline" className="text-xs opacity-50">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      <div className={"flex items-center space-x-4 text-xs text-muted-foreground ml-4 " + (model.id !== 'sora' ? 'opacity-50' : '')}>
                          <span>Speed: {model.speed}</span>
                          <span>Quality: {model.quality}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Selected:</strong> {aiModels.find(m => m.id === selectedModel)?.label}</p>
                <p>Speed: {aiModels.find(m => m.id === selectedModel)?.speed} • Quality: {aiModels.find(m => m.id === selectedModel)?.quality}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Captions className="w-5 h-5 text-primary" />
                <span>Captions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-generate captions</p>
                  <p className="text-sm text-muted-foreground">Improve accessibility and engagement</p>
                </div>
              <Switch checked={captionsEnabled} onCheckedChange={setCaptionsEnabled} />
              </div>

              {captionsEnabled && (
                <Select value={captionStyle} onValueChange={setCaptionStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern (Bold & Clean)</SelectItem>
                    <SelectItem value="minimal">Minimal (Simple)</SelectItem>
                    <SelectItem value="neon">Neon (Glowing)</SelectItem>
                    <SelectItem value="handwritten">Handwritten</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
      </div>

      <div className="text-center space-y-6">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={rendering}
          className="gradient-primary text-white font-bold px-12 py-4 text-lg shadow-creator-lg"
        >
          {rendering ? (
            <>
              <Settings className="w-5 h-5 mr-2 animate-spin" />
              Generating your video...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Video
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Video Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">Note: video generation can take up to 10 minutes. Please don’t close the page.</div>
          {rendering && (
            <div className="p-6 border rounded-lg bg-muted/40 text-sm text-muted-foreground">
              Your video is being generated. This can take up to 10 minutes. Please don’t close the page.
            </div>
          )}
          {videoUrl && (
            <div className="space-y-4">
              <video controls className="w-full rounded-lg border">
                <source src={videoUrl} type="video/mp4" />
              </video>
              <div className="text-sm text-muted-foreground">
                <div>Style: <strong>{lastUsed.styleId || selectedStyle}</strong></div>
                <div>Audience: <strong>{(lastUsed.audience || '').trim() || 'general audience'}</strong></div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Full Script</h4>
                <RenderScriptBlock script={lastUsed.script || script} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRender} disabled={rendering}>Regenerate</Button>
                <Button onClick={() => navigate('/prepare', { state: { videoUrl, used: lastUsed } })} disabled={!videoUrl || rendering}>
                  Prepare Post
                </Button>
              </div>
      </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}