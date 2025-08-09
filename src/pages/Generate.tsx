import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const videoStyles = [
  { 
    id: "cinematic", 
    label: "Cinematic", 
    desc: "High-quality, dramatic visuals", 
    preview: "/api/placeholder/120/80",
    color: "border-purple-200 bg-purple-50"
  },
  { 
    id: "animated", 
    label: "Animated", 
    desc: "Motion graphics and animations", 
    preview: "/api/placeholder/120/80",
    color: "border-blue-200 bg-blue-50"
  },
  { 
    id: "meme", 
    label: "Meme", 
    desc: "Funny, viral-worthy content", 
    preview: "/api/placeholder/120/80",
    color: "border-orange-200 bg-orange-50"
  },
  { 
    id: "vlog", 
    label: "Vlog", 
    desc: "Personal, authentic style", 
    preview: "/api/placeholder/120/80",
    color: "border-green-200 bg-green-50"
  },
];

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
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [selectedSound, setSelectedSound] = useState("trending");
  const [selectedModel, setSelectedModel] = useState("pika");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [customStylePrompt, setCustomStylePrompt] = useState("");

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

  const generateVideoMutation = useMutation({
    mutationFn: (data: any) => api.generateVideo(data.script, data.settings),
    onSuccess: (data) => {
      toast({
        title: "Video generated successfully! 🎉",
        description: "Redirecting to editor...",
      });
      setTimeout(() => {
        navigate(`/editor/${data.videoId}`);
      }, 1000);
    },
  });

  const handleImproveScript = () => {
    improveScriptMutation.mutate(script);
  };

  const handleGenerate = () => {
    if (!script.trim()) {
      toast({
        title: "Script required",
        description: "Please enter a script before generating",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    const settings = {
      style: selectedStyle,
      sound: selectedSound,
      model: selectedModel,
      captions: captionsEnabled,
      captionStyle,
    };

    generateVideoMutation.mutate({ script, settings });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient">Generate Your Video</h1>
        <p className="text-muted-foreground">Transform your script into viral content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Script Editor & Preview */}
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
              <div className="grid grid-cols-2 gap-3">
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
                    <CardContent className="p-3">
                      <div className="aspect-video bg-muted rounded-lg mb-2 overflow-hidden">
                        <img 
                          src={style.preview} 
                          alt={style.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-semibold text-sm">{style.label}</h3>
                      <p className="text-xs text-muted-foreground">{style.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Custom Style Prompt */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Not happy with any of those? Describe what style you want:</p>
                <Textarea
                  value={customStylePrompt}
                  onChange={(e) => setCustomStylePrompt(e.target.value)}
                  placeholder="Describe your ideal video style... (e.g., dark and mysterious, bright and energetic, minimalist with clean graphics)"
                  className="min-h-[80px] text-sm"
                />
                <Button variant="outline" className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Custom Style
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
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
                  <SelectItem value="trending">🔥 Trending Audio</SelectItem>
                  <SelectItem value="ai-voice">🤖 AI Voiceover</SelectItem>
                  <SelectItem value="upload">📁 Upload Audio</SelectItem>
                  <SelectItem value="none">🔇 No Audio</SelectItem>
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

          {/* AI Model Selection */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>AI Model</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiModels.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedModel === model.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground'
                  } ${model.status === 'mock' ? 'opacity-60' : ''}`}
                  onClick={() => model.status === 'available' && setSelectedModel(model.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{model.label}</h3>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>Speed: {model.speed}</span>
                        <span>Quality: {model.quality}</span>
                      </div>
                    </div>
                    {model.status === 'mock' && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Captions */}
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
                <Switch
                  checked={captionsEnabled}
                  onCheckedChange={setCaptionsEnabled}
                />
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
      </div>

      {/* Generate Button */}
      <div className="text-center space-y-6">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || generateVideoMutation.isPending}
          className="gradient-primary text-white font-bold px-12 py-4 text-lg shadow-creator-lg"
        >
          {isGenerating ? (
            <>
              <Settings className="w-5 h-5 mr-2 animate-spin" />
              Discovering and applying viral trends...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Video
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {/* Progress */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto space-y-3"
          >
            <Progress value={generationProgress} className="h-2" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {generationProgress < 30 ? "🔍 Discovering trending elements..." :
                 generationProgress < 60 ? "🎨 Applying viral video patterns..." :
                 generationProgress < 90 ? "🚀 Optimizing for maximum engagement..." :
                 "✨ Finalizing your viral-ready video..."}
              </p>
              <p className="text-muted-foreground">
                This usually takes 30-60 seconds
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}