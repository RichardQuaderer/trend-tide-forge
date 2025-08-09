import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Pause, RotateCcw, Scissors, Type, Sticker, Download, ArrowRight, Save, Smartphone, Monitor, TrendingUp, Shield, Info, CheckSquare, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
export default function Editor() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("preview"); // "preview" or "edit"
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [currentEditingVideoIndex, setCurrentEditingVideoIndex] = useState(0);
  const [editedVideos, setEditedVideos] = useState<Record<number, any>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(30); // 30 seconds
  const [editPrompt, setEditPrompt] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [selectedFormat, setSelectedFormat] = useState("tiktok");
  const [captions, setCaptions] = useState([{
    id: 1,
    start: 0,
    end: 3,
    text: "Wait for it...",
    style: "modern"
  }, {
    id: 2,
    start: 3,
    end: 7,
    text: "This will blow your mind 🤯",
    style: "modern"
  }, {
    id: 3,
    start: 7,
    end: 12,
    text: "Here's the secret productivity hack",
    style: "modern"
  }, {
    id: 4,
    start: 12,
    end: 18,
    text: "That changed my entire life",
    style: "modern"
  }, {
    id: 5,
    start: 18,
    end: 25,
    text: "And it only takes 5 minutes",
    style: "modern"
  }, {
    id: 6,
    start: 25,
    end: 30,
    text: "Try it and thank me later! ✨",
    style: "modern"
  }]);

  // Mock video variations
  const videoVariations = [{
    id: 1,
    title: "Hook-First Approach",
    tone: "Urgent & Curiosity-driven",
    viralityScore: 87,
    safetyScore: 92,
    description: "Starts with mystery hook, builds suspense",
    thumbnail: "gradient-to-br from-red-500 to-orange-500"
  }, {
    id: 2,
    title: "Educational Style",
    tone: "Informative & Professional",
    viralityScore: 73,
    safetyScore: 98,
    description: "Clear step-by-step explanation format",
    thumbnail: "gradient-to-br from-blue-500 to-cyan-500"
  }, {
    id: 3,
    title: "Story-Driven",
    tone: "Personal & Relatable",
    viralityScore: 91,
    safetyScore: 89,
    description: "Personal transformation narrative",
    thumbnail: "gradient-to-br from-purple-500 to-pink-500"
  }, {
    id: 4,
    title: "Quick & Punchy",
    tone: "Fast-paced & Energetic",
    viralityScore: 95,
    safetyScore: 85,
    description: "Rapid-fire tips with visual effects",
    thumbnail: "gradient-to-br from-green-500 to-teal-500"
  }];
  const formats = [{
    id: "tiktok",
    label: "TikTok",
    ratio: "9:16",
    width: 270,
    height: 480
  }, {
    id: "reels",
    label: "Instagram Reels",
    ratio: "9:16",
    width: 270,
    height: 480
  }, {
    id: "shorts",
    label: "YouTube Shorts",
    ratio: "9:16",
    width: 270,
    height: 480
  }];
  const captionStyles = ["modern", "minimal", "neon", "handwritten", "bold"];
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control video playback
  };
  const handleSave = () => {
    console.log("Saving draft...");
  };
  const handleContinue = () => {
    if (currentStep === "preview") {
      if (selectedVideos.length === 0) return;
      setCurrentStep("edit");
      setCurrentEditingVideoIndex(0);
    } else {
      // Save current video's edits before proceeding
      const currentVideoId = selectedVideos[currentEditingVideoIndex];
      setEditedVideos(prev => ({
        ...prev,
        [currentVideoId]: {
          captions,
          trimStart,
          trimEnd,
          selectedFormat
        }
      }));

      // Check if there are more videos to edit
      if (currentEditingVideoIndex < selectedVideos.length - 1) {
        const nextIndex = currentEditingVideoIndex + 1;
        setCurrentEditingVideoIndex(nextIndex);

        // Load next video's data (or defaults)
        const nextVideoId = selectedVideos[nextIndex];
        const nextVideoData = editedVideos[nextVideoId];
        if (nextVideoData) {
          setCaptions(nextVideoData.captions);
          setTrimStart(nextVideoData.trimStart);
          setTrimEnd(nextVideoData.trimEnd);
          setSelectedFormat(nextVideoData.selectedFormat);
        } else {
          // Reset to defaults for new video
          setCaptions([{
            id: 1,
            start: 0,
            end: 3,
            text: "Wait for it...",
            style: "modern"
          }, {
            id: 2,
            start: 3,
            end: 7,
            text: "This will blow your mind 🤯",
            style: "modern"
          }, {
            id: 3,
            start: 7,
            end: 12,
            text: "Here's the secret productivity hack",
            style: "modern"
          }, {
            id: 4,
            start: 12,
            end: 18,
            text: "That changed my entire life",
            style: "modern"
          }, {
            id: 5,
            start: 18,
            end: 25,
            text: "And it only takes 5 minutes",
            style: "modern"
          }, {
            id: 6,
            start: 25,
            end: 30,
            text: "Try it and thank me later! ✨",
            style: "modern"
          }]);
          setTrimStart(0);
          setTrimEnd(30);
          setSelectedFormat("tiktok");
        }
      } else {
        // All videos edited, proceed to publish
        navigate(`/publish/${id}?abtest=${selectedVideos.join(',')}`);
      }
    }
  };
  const goToPreviousVideo = () => {
    if (currentEditingVideoIndex > 0) {
      // Save current video's edits
      const currentVideoId = selectedVideos[currentEditingVideoIndex];
      setEditedVideos(prev => ({
        ...prev,
        [currentVideoId]: {
          captions,
          trimStart,
          trimEnd,
          selectedFormat
        }
      }));
      const prevIndex = currentEditingVideoIndex - 1;
      setCurrentEditingVideoIndex(prevIndex);

      // Load previous video's data
      const prevVideoId = selectedVideos[prevIndex];
      const prevVideoData = editedVideos[prevVideoId];
      if (prevVideoData) {
        setCaptions(prevVideoData.captions);
        setTrimStart(prevVideoData.trimStart);
        setTrimEnd(prevVideoData.trimEnd);
        setSelectedFormat(prevVideoData.selectedFormat);
      }
    }
  };
  const toggleVideoSelection = (videoId: number) => {
    setSelectedVideos(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
  };
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };
  const getScoreExplanation = (type: "virality" | "safety", score: number) => {
    if (type === "virality") {
      if (score >= 90) return "Excellent viral potential with strong hooks and engagement triggers";
      if (score >= 75) return "Good viral potential with solid content structure";
      if (score >= 60) return "Moderate viral potential, could benefit from stronger hooks";
      return "Low viral potential, needs more engaging elements";
    } else {
      if (score >= 90) return "Very safe content with no policy violations";
      if (score >= 75) return "Generally safe with minor considerations";
      if (score >= 60) return "Mostly safe but may need content review";
      return "Potential policy issues, needs content adjustment";
    }
  };
  const updateCaptionText = (captionId: number, newText: string) => {
    setCaptions(captions.map(caption => caption.id === captionId ? {
      ...caption,
      text: newText
    } : caption));
  };
  const updateCaptionStyle = (captionId: number, newStyle: string) => {
    setCaptions(captions.map(caption => caption.id === captionId ? {
      ...caption,
      style: newStyle
    } : caption));
  };
  return <TooltipProvider>
      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {currentStep === "preview" ? "Choose Your Video Style" : "Video Editor"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentStep === "preview" ? "Select video variations to A/B test and proceed to editing" : `Editing video ${currentEditingVideoIndex + 1} of ${selectedVideos.length} - ${videoVariations.find(v => v.id === selectedVideos[currentEditingVideoIndex])?.title}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {currentStep === "edit" && <>
                {currentEditingVideoIndex > 0 && <Button variant="outline" onClick={goToPreviousVideo}>
                    ← Previous Video
                  </Button>}
                <Button variant="outline" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </>}
            <Button onClick={handleContinue} className="gradient-primary text-white" disabled={currentStep === "preview" && selectedVideos.length === 0}>
              {currentStep === "preview" ? "Edit Selected" : currentEditingVideoIndex < selectedVideos.length - 1 ? "Next Video →" : "Continue to Publish"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {currentStep === "preview" ? (/* Video Preview Selection */
      <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">Select one or more video variations for further editing and A/B testing. Each video uses different tones and approaches.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoVariations.map(video => <motion.div key={video.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: video.id * 0.1
          }}>
                  <Card className={`cursor-pointer transition-all shadow-creator hover:shadow-creator-lg ${selectedVideos.includes(video.id) ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{video.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {video.tone}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        </div>
                        <Checkbox checked={selectedVideos.includes(video.id)} onCheckedChange={() => toggleVideoSelection(video.id)} className="ml-4" />
                      </div>
                      
                      {/* Video Preview */}
                      <div className="mb-4">
                        <div className={`aspect-[9/16] w-32 mx-auto rounded-lg ${video.thumbnail} flex items-center justify-center relative overflow-hidden`}>
                          <Play className="w-8 h-8 text-white opacity-75" />
                          <div className="absolute inset-0 bg-black/20" />
                        </div>
                      </div>
                      
                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Virality</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getScoreExplanation("virality", video.viralityScore)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(video.viralityScore)}`}>
                            {video.viralityScore}%
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Safety</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getScoreExplanation("safety", video.safetyScore)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(video.safetyScore)}`}>
                            {video.safetyScore}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>)}
            </div>
            
            {selectedVideos.length > 0 && <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span className="font-medium">A/B Testing:</span>
                    <span>{selectedVideos.length} variation{selectedVideos.length > 1 ? 's' : ''} selected</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These variations will be tested across your selected platforms to find the best performer.
                  </p>
                </CardContent>
              </Card>}
          </div>) : (/* Video Editing Interface */
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Video Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <Card className="shadow-creator-lg">
            <CardContent className="p-6">
              <div className="flex justify-center mb-6">
                {/* Format tabs */}
                <div className="flex space-x-2 p-1 bg-muted rounded-lg">
                  {formats.map(format => <Button key={format.id} variant={selectedFormat === format.id ? "default" : "ghost"} size="sm" onClick={() => setSelectedFormat(format.id)} className="text-sm">
                      {format.label}
                    </Button>)}
                </div>
              </div>

              {/* Video Preview Area */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Safe margins guide */}
                  <div className="bg-gray-900 rounded-lg relative overflow-hidden shadow-creator-lg" style={{
                    width: formats.find(f => f.id === selectedFormat)?.width,
                    height: formats.find(f => f.id === selectedFormat)?.height
                  }}>
                    {/* Video placeholder */}
                    <div className="w-full h-full bg-gradient-to-br from-creator-purple via-creator-blue to-creator-pink flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Video Preview</p>
                        <p className="text-sm opacity-75">Generated content will appear here</p>
                      </div>
                    </div>

                    {/* Safe area guidelines */}
                    <div className="absolute inset-4 border border-white/30 border-dashed rounded pointer-events-none" />
                    
                    {/* Current caption overlay */}
                    {captions.filter(caption => currentTime >= caption.start && currentTime <= caption.end).map(caption => <div key={caption.id} className="absolute bottom-16 left-4 right-4 text-center">
                          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="text-white font-bold text-sm">
                              {caption.text}
                            </p>
                          </div>
                        </div>)}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button size="lg" variant="ghost" onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white">
                        {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Timeline */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground w-12">
                    {Math.floor(currentTime)}s
                  </span>
                  <div className="flex-1">
                    <Slider value={[currentTime]} onValueChange={value => setCurrentTime(value[0])} max={duration} step={0.1} className="w-full" />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">
                    {duration}s
                  </span>
                </div>

                {/* Trim controls */}
                <div className="flex items-center space-x-4">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Trim:</span>
                  <div className="flex items-center space-x-2 text-sm">
                    <Input type="number" value={trimStart} onChange={e => setTrimStart(Number(e.target.value))} className="w-16 h-8 text-xs" min={0} max={duration} />
                    <span>to</span>
                    <Input type="number" value={trimEnd} onChange={e => setTrimEnd(Number(e.target.value))} className="w-16 h-8 text-xs" min={0} max={duration} />
                    <span>seconds</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editing Tools */}
        <div className="space-y-6">
          {/* Caption Editor */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Type className="w-5 h-5 text-primary" />
                <span>Captions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {captions.map(caption => <div key={caption.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{caption.start}s - {caption.end}s</span>
                      <Select value={caption.style} onValueChange={value => updateCaptionStyle(caption.id, value)}>
                        <SelectTrigger className="w-20 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {captionStyles.map(style => <SelectItem key={style} value={style} className="text-xs">
                              {style}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={caption.text} onChange={e => updateCaptionText(caption.id, e.target.value)} className="text-sm" placeholder="Caption text..." />
                  </div>)}
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <Type className="w-4 h-4 mr-2" />
                Add Caption
              </Button>
            </CardContent>
          </Card>

          {/* Text & Stickers */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sticker className="w-5 h-5 text-primary" />
                <span>Overlays</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Type className="w-4 h-4 mr-2" />
                Add Text
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Sticker className="w-4 h-4 mr-2" />
                Add Sticker
              </Button>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                <p>💡 Tip: Keep text within the safe area (dashed lines) for best visibility across platforms</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Video Editor */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>AI Edit Video</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe how you want to edit this video... (e.g., make it more dramatic, add quick cuts, change the music style)"
                className="min-h-[100px] text-sm"
              />
              
              <Button className="w-full gradient-primary text-white">
                <Wand2 className="w-4 h-4 mr-2" />
                Apply AI Edits
              </Button>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                <p>💡 Tip: Be specific about what you want to change for better results</p>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-primary" />
                <span>Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Monitor className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Export will be available after publishing setup
              </div>
            </CardContent>
          </Card>
        </div>
          </div>)}
      </div>
    </TooltipProvider>;
}