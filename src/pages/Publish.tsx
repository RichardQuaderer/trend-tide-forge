import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Share2, Calendar as CalendarIcon, Clock, Send, Check, Copy, Zap, Hash, Play, FlaskConical, Target, BarChart3, Settings, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
const platforms = [{
  id: "tiktok",
  label: "TikTok",
  icon: Play,
  color: "text-black",
  connected: true,
  maxLength: 2200
}, {
  id: "youtube",
  label: "YouTube Shorts",
  icon: Play,
  color: "text-red-500",
  connected: true,
  maxLength: 500
}, {
  id: "instagram",
  label: "Instagram Reels",
  icon: Play,
  color: "text-pink-500",
  connected: false,
  maxLength: 2200
}];
const trendingHashtags = ["#viral", "#fyp", "#trending", "#2024", "#productivity", "#lifehack", "#motivation", "#tutorial", "#tips", "#hack"];
export default function Publish() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [searchParams] = useSearchParams();

  // Check if this is A/B testing mode
  const abTestParam = searchParams.get('abtest');
  const abTestVideos = abTestParam ? abTestParam.split(',').map(Number) : [];
  const isABTesting = abTestVideos.length > 1;
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "youtube"]);
  const [title, setTitle] = useState("How to be productive in 2024 - the ultimate guide");
  const [description, setDescription] = useState("This productivity hack will change your life! Try it and thank me later ✨ #productivity #lifehack #viral");
  const [hashtags, setHashtags] = useState<string[]>(["#productivity", "#lifehack", "#viral"]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [publishNow, setPublishNow] = useState(true);
  const [useAIScheduling, setUseAIScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<Record<string, number>>({});

  // A/B Testing specific state
  const [abTestStrategy, setAbTestStrategy] = useState<"platform" | "time" | "content">("platform");
  const [abTestPlatforms, setABTestPlatforms] = useState<Record<number, string[]>>({});
  const [abTestDuration, setAbTestDuration] = useState(24); // hours
  const [abTestTrafficSplit, setAbTestTrafficSplit] = useState(50); // percentage
  const [abTestExpanded, setAbTestExpanded] = useState(false);

  // Initialize A/B test platform distribution
  useEffect(() => {
    if (isABTesting && abTestVideos.length > 0) {
      const initialDistribution: Record<number, string[]> = {};
      abTestVideos.forEach((videoId, index) => {
        if (index === 0) {
          initialDistribution[videoId] = ["tiktok"];
        } else if (index === 1) {
          initialDistribution[videoId] = ["youtube"];
        } else {
          initialDistribution[videoId] = ["instagram"];
        }
      });
      setABTestPlatforms(initialDistribution);
    }
  }, [isABTesting, abTestVideos]);
  const publishMutation = useMutation({
    mutationFn: (data: any) => api.publishVideo(data.videoId, data.platforms, data.metadata),
    onSuccess: () => {
      toast({
        title: "Published successfully! 🎉",
        description: "Your video is now live across selected platforms"
      });
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    }
  });
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]);
  };
  const addHashtag = (hashtag: string) => {
    if (!hashtags.includes(hashtag)) {
      setHashtags([...hashtags, hashtag]);
    }
  };
  const removeHashtag = (hashtag: string) => {
    setHashtags(hashtags.filter(h => h !== hashtag));
  };
  const updateABTestPlatforms = (videoId: number, platforms: string[]) => {
    setABTestPlatforms(prev => ({
      ...prev,
      [videoId]: platforms
    }));
  };
  const handlePublish = () => {
    if (!isABTesting && selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to publish to",
        variant: "destructive"
      });
      return;
    }
    if (isABTesting) {
      const hasValidDistribution = Object.values(abTestPlatforms).some(platforms => platforms.length > 0);
      if (!hasValidDistribution) {
        toast({
          title: "Configure A/B test",
          description: "Please assign platforms to your video variations",
          variant: "destructive"
        });
        return;
      }
    }
    setIsPublishing(true);
    const platformsToPublish = isABTesting ? Object.values(abTestPlatforms).flat() : selectedPlatforms;

    // Simulate platform-specific publishing progress
    platformsToPublish.forEach((platform, index) => {
      setTimeout(() => {
        const interval = setInterval(() => {
          setPublishProgress(prev => {
            const current = prev[platform] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return prev;
            }
            return {
              ...prev,
              [platform]: Math.min(current + Math.random() * 20, 100)
            };
          });
        }, 200);
      }, index * 500);
    });
    const metadata = {
      title,
      description: description + " " + hashtags.join(" "),
      hashtags,
      scheduledFor: publishNow ? null : useAIScheduling ? "AI_OPTIMAL" : scheduleDate,
      useAIScheduling,
      isABTest: isABTesting,
      abTestConfig: isABTesting ? {
        strategy: abTestStrategy,
        platforms: abTestPlatforms,
        duration: abTestDuration,
        trafficSplit: abTestTrafficSplit,
        videos: abTestVideos
      } : undefined
    };
    publishMutation.mutate({
      videoId: id,
      platforms: platformsToPublish,
      metadata
    });
  };
  const generateVariant = () => {
    toast({
      title: "Discovering trends for variant...",
      description: "Analyzing viral patterns to create an optimized version"
    });
  };
  return <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient">
          Publish
        </h1>
        <p className="text-muted-foreground">
          {isABTesting ? `Set up your A/B test with ${abTestVideos.length} video variations` : "Share your content across platforms"}
        </p>
      </div>

      {/* Video Preview */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle>Video Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[9/16] max-w-xs mx-auto bg-muted rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-16 h-16 text-muted-foreground" />
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded p-2 text-white text-xs">
                <p className="font-medium">{title}</p>
                <p className="text-white/80 mt-1 line-clamp-2">{description}</p>
              </div>
            </div>
          </div>
          {isABTesting && <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Testing {abTestVideos.length} video variations
              </p>
              <div className="flex justify-center gap-2 mt-2">
                {abTestVideos.map((videoId, index) => <Badge key={videoId} variant="outline" className="text-xs">
                    V{index + 1}
                  </Badge>)}
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Standard content configuration */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your video..." className="min-h-[100px]" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Hashtags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map(hashtag => <Badge key={hashtag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeHashtag(hashtag)}>
                  {hashtag} ×
                </Badge>)}
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingHashtags.filter(tag => !hashtags.includes(tag)).map(hashtag => <Badge key={hashtag} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => addHashtag(hashtag)}>
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag.substring(1)}
                </Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platforms */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span>Platforms</span>
          </CardTitle>
        </CardHeader>
        
      </Card>

      {/* A/B Testing Configuration - Collapsible */}
      {isABTesting && <Collapsible open={abTestExpanded} onOpenChange={setAbTestExpanded}>
          <Card className="shadow-creator">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FlaskConical className="w-5 h-5 text-primary" />
                    <span>A/B Test Configuration</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${abTestExpanded ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                <div>
                  <label className="text-sm font-medium mb-2 block">Test Strategy</label>
                  <Select value={abTestStrategy} onValueChange={(value: "platform" | "time" | "content") => setAbTestStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Different Platforms</SelectItem>
                      <SelectItem value="time">Different Times</SelectItem>
                      <SelectItem value="content">Same Platform Split</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {abTestStrategy === "platform" && "Post each video variation to different platforms"}
                    {abTestStrategy === "time" && "Post variations at different times on same platforms"}
                    {abTestStrategy === "content" && "Split traffic between variations on same platforms"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Duration</label>
                    <Select value={abTestDuration.toString()} onValueChange={value => setAbTestDuration(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                        <SelectItem value="72">72 hours</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {abTestStrategy === "content" && <div>
                      <label className="text-sm font-medium mb-2 block">Traffic Split (%)</label>
                      <Input type="number" min="10" max="90" value={abTestTrafficSplit} onChange={e => setAbTestTrafficSplit(Number(e.target.value))} />
                    </div>}
                </div>

                {/* Video Platform Assignment */}
                <div className="space-y-4">
                  <h4 className="font-medium">Platform Assignment</h4>
                  {abTestVideos.map((videoId, index) => <Card key={videoId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium">Video Variation {index + 1}</h5>
                          <p className="text-sm text-muted-foreground">
                            Style: {videoId === 1 ? "Hook-First" : videoId === 2 ? "Educational" : videoId === 3 ? "Story-Driven" : "Quick & Punchy"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Assigned Platforms:</p>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map(platform => <label key={platform.id} className="flex items-center space-x-2 text-sm">
                              <Checkbox checked={(abTestPlatforms[videoId] || []).includes(platform.id)} onCheckedChange={checked => {
                        const current = abTestPlatforms[videoId] || [];
                        const updated = checked ? [...current, platform.id] : current.filter(p => p !== platform.id);
                        updateABTestPlatforms(videoId, updated);
                      }} disabled={!platform.connected} />
                              <span className={platform.connected ? "" : "opacity-50"}>
                                {platform.label}
                              </span>
                            </label>)}
                        </div>
                      </div>
                    </Card>)}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>}

      {/* Schedule */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox checked={publishNow} onCheckedChange={checked => setPublishNow(Boolean(checked))} />
              <label className="font-medium">{isABTesting ? "Start test now" : "Publish now"}</label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox checked={!publishNow} onCheckedChange={checked => setPublishNow(!Boolean(checked))} />
              <label className="font-medium">Schedule for later</label>
            </div>
          </div>

          {!publishNow && <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox checked={useAIScheduling} onCheckedChange={checked => {
                setUseAIScheduling(Boolean(checked));
                if (checked) setScheduleDate(undefined);
              }} />
                  <label className="font-medium text-sm">Let AI choose the ideal time to post</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Checkbox checked={!useAIScheduling} onCheckedChange={checked => {
                setUseAIScheduling(!Boolean(checked));
              }} />
                  <label className="font-medium text-sm">Pick specific date & time</label>
                </div>
              </div>

              {useAIScheduling ? <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Optimal Scheduling</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Our AI will analyze your audience activity patterns, platform algorithms, and content type to determine the best posting time for maximum engagement.
                  </p>
                </div> : <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} initialFocus />
                  </PopoverContent>
                </Popover>}
            </div>}
        </CardContent>
      </Card>

      {/* Publishing Progress */}
      {isPublishing && <Card className="shadow-creator">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Publishing Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(isABTesting ? Object.values(abTestPlatforms).flat() : selectedPlatforms).map(platformId => {
            const platform = platforms.find(p => p.id === platformId);
            const progress = publishProgress[platformId] || 0;
            return <div key={platformId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {platform && <platform.icon className={`w-4 h-4 ${platform.color}`} />}
                        <span className="text-sm font-medium">{platform?.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>;
          })}
            </div>
          </CardContent>
        </Card>}

      {/* Publish Button */}
      <div className="flex justify-center pt-6">
        <Button size="lg" onClick={handlePublish} disabled={isPublishing} className="px-8">
          <Send className="w-4 h-4 mr-2" />
          {isPublishing ? "Publishing..." : isABTesting ? "Start A/B Test" : "Publish Video"}
        </Button>
      </div>
    </div>;
}