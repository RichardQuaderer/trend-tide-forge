import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrendTicker } from "@/components/shared/trend-ticker";
import { VideoCard } from "@/components/shared/video-card";
import { ImportVideoDialog } from "@/components/dialogs/ImportVideoDialog";
import { TemplatesDialog } from "@/components/dialogs/TemplatesDialog";
import { api } from "@/lib/api";
import { 
  Sparkles, 
  TrendingUp, 
  Upload, 
  Layers,
  Plus,
  Wand2,
  Clock,
  Play
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { useNavigate } from "react-router-dom";

function RenderScript({ script, onChange }: { script: string; onChange?: (s: string) => void }) {
  // Try to parse JSON with Hook/Points/CTA; fallback to markdown
  let initialObj: any = null;
  try {
    const obj = JSON.parse(script);
    const hook = obj.Hook || obj.hook;
    const points: string[] = obj.Points || obj.points || [];
    const cta = obj.CTA || obj.cta;
    const isStructured = hook || (points && Array.isArray(points)) || cta;
    if (isStructured) {
      initialObj = { hook: hook || "", points: Array.isArray(points) ? points : [], cta: cta || "" };
    }
  } catch {}

  if (initialObj) {
    return <EditableStructuredScript initial={initialObj} onChange={onChange} />;
  }

  return (
    <EditableMarkdownScript script={script} onChange={onChange} />
  );
}

function EditableMarkdownScript({ script, onChange }: { script: string; onChange?: (s: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(script);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="font-bold uppercase tracking-wide text-sm">Script</h5>
        {onChange && (
          <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setIsEditing(v => !v)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      {isEditing && onChange ? (
        <div className="space-y-2">
          <textarea className="w-full min-h-[140px] text-sm rounded-md border p-2" value={value} onChange={e => setValue(e.target.value)} />
          <div className="flex justify-end">
            <button className="px-3 py-1 text-sm rounded-md bg-primary text-white" onClick={() => { onChange?.(value); setIsEditing(false); }}>Save</button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{script}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function EditableStructuredScript({ initial, onChange }: { initial: { hook: string; points: string[]; cta: string }, onChange?: (s: string) => void }) {
  const [hook, setHook] = useState(initial.hook);
  const [points, setPoints] = useState<string[]>(initial.points);
  const [cta, setCta] = useState(initial.cta);
  const [editHook, setEditHook] = useState(false);
  const [editPoints, setEditPoints] = useState(false);
  const [editCta, setEditCta] = useState(false);

  const saveAll = () => {
    const payload = { Hook: hook, Points: points, CTA: cta };
    onChange?.(JSON.stringify(payload));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 relative">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold uppercase tracking-wide text-primary text-base md:text-lg flex items-center gap-2">🔥 Hook</h5>
          {onChange && (
            <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setEditHook(v => !v)}>{editHook ? 'Cancel' : 'Edit'}</button>
          )}
        </div>
        {editHook ? (
          <textarea className="w-full min-h-[60px] text-sm rounded-md border p-2" value={hook} onChange={e => setHook(e.target.value)} />
        ) : (
          <p className="text-sm leading-relaxed">{hook}</p>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 relative">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold uppercase tracking-wide text-blue-800 text-base md:text-lg flex items-center gap-2">📌 Points</h5>
          {onChange && (
            <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setEditPoints(v => !v)}>{editPoints ? 'Cancel' : 'Edit'}</button>
          )}
        </div>
        {editPoints ? (
          <div className="space-y-2">
            {points.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 rounded-md border p-2 text-sm" value={p} onChange={e => setPoints(prev => prev.map((pp, idx) => idx === i ? e.target.value : pp))} />
                <button className="text-xs px-2 rounded-md border hover:bg-muted" onClick={() => setPoints(prev => prev.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            <button className="text-xs px-2 rounded-md border hover:bg-muted" onClick={() => setPoints(prev => [...prev, ""]) }>Add point</button>
          </div>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-blue-900">
            {points.map((p, i) => (<li key={i} className="text-sm leading-relaxed">{p}</li>))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-3 relative">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold uppercase tracking-wide text-green-800 text-base md:text-lg flex items-center gap-2">🚀 CTA</h5>
          {onChange && (
            <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setEditCta(v => !v)}>{editCta ? 'Cancel' : 'Edit'}</button>
          )}
        </div>
        {editCta ? (
          <textarea className="w-full min-h-[60px] text-sm rounded-md border p-2" value={cta} onChange={e => setCta(e.target.value)} />
        ) : (
          <p className="text-sm leading-relaxed">{cta}</p>
        )}
      </div>

      {onChange && (editHook || editPoints || editCta) && (
        <div className="flex justify-end">
          <button className="px-3 py-1 text-sm rounded-md bg-primary text-white" onClick={() => { saveAll(); setEditHook(false); setEditPoints(false); setEditCta(false); }}>Save changes</button>
        </div>
      )}
    </div>
  );
}

function cls(...xs: Array<string | false | null | undefined>) { return xs.filter(Boolean).join(' '); }
function hookColor(score?: number) {
  if (score === undefined || score === null) return 'bg-gray-100 text-gray-800 border-gray-200';
  if (score >= 0.7) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 0.4) return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}
function viralityColor(score?: number) {
  if (score === undefined || score === null) return 'bg-gray-100 text-gray-800 border-gray-200';
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 40) return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}
function brandColor(safe?: boolean) {
  if (safe) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-red-100 text-red-800 border-red-200';
}
function toneColor() { return 'bg-blue-100 text-blue-900 border-blue-200'; }

function ScoreChip({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <span className={cls('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold', colorClass)}>
      <span className="opacity-80 font-medium">{label}:</span>
      <span className="text-base leading-none">{value}</span>
    </span>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [alternatives, setAlternatives] = useState<Array<{ script: string; scores: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: api.getVideos,
  });

  const recentVideos = videos.slice(0, 6);

  const quickActions = [
    {
      title: "Use Trending Hook",
      description: "Start with a viral opener",
      icon: TrendingUp,
      color: "from-creator-purple to-creator-blue",
      action: () => setPrompt("Wait for it... this will blow your mind 🤯"),
    },
    {
      title: "Import Long Video",
      description: "Convert to short form",
      icon: Upload,
      color: "from-creator-pink to-creator-orange",
      action: () => setImportDialogOpen(true),
    },
    {
      title: "Browse Templates",
      description: "Pre-built viral formats",
      icon: Layers,
      color: "from-creator-blue to-creator-purple",
      action: () => setTemplatesDialogOpen(true),
    },
  ];

  const suggestedPrompts = [
    "How to be productive in 2024",
    "Secret morning routine of successful people",
    "AI tools that will change your life",
    "Quick recipe for busy professionals",
    "Fashion trends everyone's talking about",
  ];

  const handleGenerateScript = async () => {
    try {
      setLoading(true);
      setAlternatives([]);
      setGeneratedScript("");
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: prompt })
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Generation failed');
      if (Array.isArray(data.results) && data.results.length) {
        setAlternatives(data.results);
      } else {
        setGeneratedScript(data.script || "");
      }
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (script: string) => {
    // Normalize to plain text for Generate page
    let plain = script;
    try {
      const obj = JSON.parse(script);
      const hook = obj.Hook || obj.hook;
      const points: string[] = obj.Points || obj.points || [];
      const cta = obj.CTA || obj.cta;
      if (hook || points?.length || cta) {
        const parts: string[] = [];
        if (hook) parts.push(`Hook: ${hook}`);
        if (points?.length) parts.push('Points:\n' + points.map((p: string) => `- ${p}`).join('\n'));
        if (cta) parts.push(`CTA: ${cta}`);
        plain = parts.join('\n\n');
      }
    } catch {}

    try { await fetch('/api/save-script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: plain }) }); } catch {}
    sessionStorage.setItem('generated_script', plain);
    navigate('/generate');
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gradient"
        >
          Ready to create something viral? ✨
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Turn your ideas into engaging short-form videos that capture attention and drive results.
        </motion.p>
      </div>

      {/* Trends Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TrendTicker />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Prompt & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Idea Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-creator-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <span>What's your video idea?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your video idea... (e.g., 'How to be more productive in 2024')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none text-base"
                />

                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    className="flex-1 gradient-primary text-white font-semibold shadow-creator"
                    disabled={!prompt.trim() || loading}
                    onClick={handleGenerateScript}
                  >
                    {loading ? (
                      <>
                        <span className="mr-2 inline-block animate-spin">⏳</span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Script
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                {generatedScript && (
                  <div className="border rounded-lg p-4 bg-muted/40">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Generated Script</h4>
                      <button className="px-3 py-1 text-sm rounded-md bg-primary text-white" onClick={() => handleGenerateVideo(generatedScript)}>
                        Generate Video
                      </button>
                    </div>
                    <RenderScript script={generatedScript} onChange={(s) => setGeneratedScript(s)} />
                  </div>
                )}

                {alternatives.length > 0 && (
                  <div className="space-y-4">
                    {alternatives.map((alt, idx) => (
                      <Card key={idx} className="border">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">Alternative {idx + 1}</h4>
                            <div className="flex flex-wrap gap-2">
                              <ScoreChip label="Hook" value={(alt.scores?.hook?.score ?? 0).toFixed(2)} colorClass={hookColor(alt.scores?.hook?.score)} />
                              <ScoreChip label="Brand" value={alt.scores?.brand_safety?.safe ? 'Safe' : 'Issues'} colorClass={brandColor(alt.scores?.brand_safety?.safe)} />
                              <ScoreChip label="Tone" value={(alt.scores?.tone?.label ?? 'neutral')} colorClass={toneColor()} />
                              <ScoreChip label="Virality" value={alt.scores?.virality?.score ?? 0} colorClass={viralityColor(alt.scores?.virality?.score)} />
                            </div>
                          </div>
                          <RenderScript script={alt.script} onChange={(s) => setAlternatives(prev => prev.map((a, i) => i === idx ? { ...a, script: s } : a))} />
                          <div className="flex justify-end">
                            <button className="px-3 py-1 text-sm rounded-md bg-primary text-white" onClick={() => handleGenerateVideo(alt.script)}>
                              Generate Video
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Suggested prompts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Try these popular ideas:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/20 transition-colors"
                        onClick={() => setPrompt(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-creator">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <Card
                      key={action.title}
                      className="cursor-pointer hover:shadow-creator transition-all duration-200 hover:-translate-y-1 group"
                      onClick={action.action}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Inspiring Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <Card className="shadow-creator">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Trending from Users</span>
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[
                  { id: 1, title: 'Morning Routine that Changed Everything', url: 'https://tiktok.com/@user/video/123' },
                  { id: 2, title: '5 Apps I Use Every Day', url: 'https://www.instagram.com/p/abc123/' },
                  { id: 3, title: 'Behind the Scenes: Building Our Product', url: 'https://youtube.com/watch?v=def456' },
                  { id: 4, title: 'Common Mistakes Everyone Makes', url: 'https://tiktok.com/@user/video/789' },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-primary truncate"
                    title={item.title}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
              
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Based on your industry and target audience
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialogs */}
      <ImportVideoDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
      />
      <TemplatesDialog 
        open={templatesDialogOpen} 
        onOpenChange={setTemplatesDialogOpen}
        onSelectTemplate={(template) => setPrompt(template.structure)}
      />
    </div>
  );
}