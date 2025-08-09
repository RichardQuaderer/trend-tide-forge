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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  Calendar as CalendarIcon, 
  Clock, 
  Send,
  Check,
  Copy,
  Zap,
  Hash,
  Play,
  FlaskConical,
  Target,
  BarChart3,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const platforms = [
  { 
    id: "tiktok", 
    label: "TikTok", 
    icon: Play, 
    color: "text-black",
    connected: true,
    maxLength: 2200 
  },
  { 
    id: "youtube", 
    label: "YouTube Shorts", 
    icon: Play, 
    color: "text-red-500",
    connected: true,
    maxLength: 500 
  },
  { 
    id: "instagram", 
    label: "Instagram Reels", 
    icon: Play, 
    color: "text-pink-500",
    connected: false,
    maxLength: 2200 
  },
];

const trendingHashtags = [
  "#viral", "#fyp", "#trending", "#2024", "#productivity", 
  "#lifehack", "#motivation", "#tutorial", "#tips", "#hack"
];

export default function Publish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        description: "Your video is now live across selected platforms",
      });
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    },
  });

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
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
        variant: "destructive",
      });
      return;
    }

    if (isABTesting) {
      const hasValidDistribution = Object.values(abTestPlatforms).some(platforms => platforms.length > 0);
      if (!hasValidDistribution) {
        toast({
          title: "Configure A/B test",
          description: "Please assign platforms to your video variations",
          variant: "destructive",
        });
        return;
      }
    }

    setIsPublishing(true);
    
    const platformsToPublish = isABTesting 
      ? Object.values(abTestPlatforms).flat()
      : selectedPlatforms;
    
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
            return { ...prev, [platform]: Math.min(current + Math.random() * 20, 100) };
          });
        }, 200);
      }, index * 500);
    });

    const metadata = {
      title,
      description: description + " " + hashtags.join(" "),
      hashtags,
      scheduledFor: publishNow ? null : (useAIScheduling ? "AI_OPTIMAL" : scheduleDate),
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
      metadata,
    });
  };

  const generateVariant = () => {
    toast({
      title: "Discovering trends for variant...",
      description: "Analyzing viral patterns to create an optimized version",
    });
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient">
          {isABTesting ? "Configure A/B Test & Publish" : "Publish Your Video"}
        </h1>
        <p className="text-muted-foreground">
          {isABTesting 
            ? `Set up your A/B test with ${abTestVideos.length} video variations` 
            : "Share your content across platforms"}
        </p>
      </div>

      {isABTesting ? (
        /* A/B Testing Configuration */
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Test Setup</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <Card className="shadow-creator">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  <span>A/B Test Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    <Select value={abTestDuration.toString()} onValueChange={(value) => setAbTestDuration(Number(value))}>
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

                  {abTestStrategy === "content" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Traffic Split (%)</label>
                      <Input
                        type="number"
                        min="10"
                        max="90"
                        value={abTestTrafficSplit}
                        onChange={(e) => setAbTestTrafficSplit(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {/* Video Platform Assignment */}
                <div className="space-y-4">
                  <h4 className="font-medium">Platform Assignment</h4>
                  {abTestVideos.map((videoId, index) => (
                    <Card key={videoId} className="p-4">
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
                          {platforms.map((platform) => (
                            <label key={platform.id} className="flex items-center space-x-2 text-sm">
                              <Checkbox
                                checked={(abTestPlatforms[videoId] || []).includes(platform.id)}
                                onCheckedChange={(checked) => {
                                  const current = abTestPlatforms[videoId] || [];
                                  const updated = checked 
                                    ? [...current, platform.id]
                                    : current.filter(p => p !== platform.id);
                                  updateABTestPlatforms(videoId, updated);
                                }}
                                disabled={!platform.connected}
                              />
                              <span className={platform.connected ? "" : "opacity-50"}>
                                {platform.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Standard content configuration */}
            <Card className="shadow-creator">
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your video..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hashtags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {hashtags.map((hashtag) => (
                      <Badge
                        key={hashtag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeHashtag(hashtag)}
                      >
                        {hashtag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingHashtags
                      .filter(tag => !hashtags.includes(tag))
                      .map((hashtag) => (
                        <Badge
                          key={hashtag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => addHashtag(hashtag)}
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {hashtag.substring(1)}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <Checkbox
                        checked={publishNow}
                        onCheckedChange={(checked) => setPublishNow(Boolean(checked))}
                      />
                      <label className="font-medium">Start test now</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={!publishNow}
                        onCheckedChange={(checked) => setPublishNow(!Boolean(checked))}
                      />
                      <label className="font-medium">Schedule test</label>
                    </div>
                  </div>

                  {!publishNow && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={useAIScheduling}
                            onCheckedChange={(checked) => {
                              setUseAIScheduling(Boolean(checked));
                              if (checked) setScheduleDate(undefined);
                            }}
                          />
                          <label className="font-medium text-sm">Let AI choose the ideal time to post</label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={!useAIScheduling}
                            onCheckedChange={(checked) => {
                              setUseAIScheduling(!Boolean(checked));
                            }}
                          />
                          <label className="font-medium text-sm">Pick specific date & time</label>
                        </div>
                      </div>

                      {useAIScheduling ? (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">AI Optimal Scheduling</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Our AI will analyze your audience activity patterns, platform algorithms, and content type to determine the best posting time for maximum engagement.
                          </p>
                        </div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={setScheduleDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Summary */}
              <Card className="shadow-creator">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>Test Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="font-medium">Videos:</span> {abTestVideos.length} variations
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Strategy:</span> {abTestStrategy}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Duration:</span> {abTestDuration}h
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Platforms:</span> {Object.values(abTestPlatforms).flat().length} total
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Publish Button */}
            <Card className="shadow-creator">
              <CardContent className="p-6">
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || publishMutation.isPending}
                  className="w-full gradient-primary text-white font-bold py-3 shadow-creator-lg"
                >
                  {isPublishing ? (
                    <>
                      <Send className="w-4 h-4 mr-2 animate-pulse" />
                      Starting A/B Test...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      {publishNow ? 'Start A/B Test' : 'Schedule A/B Test'}
                    </>
                  )}
                </Button>

                {/* Publishing Progress */}
                {isPublishing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 mt-6"
                  >
                    <p className="text-sm font-medium">Publishing A/B test variations:</p>
                    {Object.values(abTestPlatforms).flat().map((platformId) => {
                      const platform = platforms.find(p => p.id === platformId);
                      const progress = publishProgress[platformId] || 0;
                      return (
                        <div key={platformId} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{platform?.label}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Standard Publishing Interface */

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Platform Selection & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform Selection */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-primary" />
                <span>Select Platforms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground'
                  } ${!platform.connected ? 'opacity-50' : ''}`}
                  onClick={() => platform.connected && togglePlatform(platform.id)}
                >
                  <div className="flex items-center space-x-3">
                    <platform.icon className={`w-6 h-6 ${platform.color}`} />
                    <div>
                      <h3 className="font-medium">{platform.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {platform.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!platform.connected && (
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    )}
                    {platform.connected && (
                      <Checkbox
                        checked={selectedPlatforms.includes(platform.id)}
                        disabled={!platform.connected}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/100 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your video..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/2200 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hashtags</label>
                
                {/* Current hashtags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {hashtags.map((hashtag) => (
                    <Badge
                      key={hashtag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeHashtag(hashtag)}
                    >
                      {hashtag} ×
                    </Badge>
                  ))}
                </div>

                {/* Suggested hashtags */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Trending suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {trendingHashtags
                      .filter(tag => !hashtags.includes(tag))
                      .map((hashtag) => (
                        <Badge
                          key={hashtag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => addHashtag(hashtag)}
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {hashtag.substring(1)}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Schedule & Actions */}
        <div className="space-y-6">
          {/* Video Preview */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center mb-3">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Duration: 30s • Vertical
              </p>
            </CardContent>
          </Card>

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
                      <Checkbox
                        checked={publishNow}
                        onCheckedChange={(checked) => setPublishNow(Boolean(checked))}
                      />
                      <label className="font-medium">Publish now</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={!publishNow}
                        onCheckedChange={(checked) => setPublishNow(!Boolean(checked))}
                      />
                      <label className="font-medium">Schedule for later</label>
                    </div>
                  </div>

                  {!publishNow && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={useAIScheduling}
                            onCheckedChange={(checked) => {
                              setUseAIScheduling(Boolean(checked));
                              if (checked) setScheduleDate(undefined);
                            }}
                          />
                          <label className="font-medium text-sm">Let AI choose the ideal time to post</label>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={!useAIScheduling}
                            onCheckedChange={(checked) => {
                              setUseAIScheduling(!Boolean(checked));
                            }}
                          />
                          <label className="font-medium text-sm">Pick specific date & time</label>
                        </div>
                      </div>

                      {useAIScheduling ? (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">AI Optimal Scheduling</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Our AI will analyze your audience activity patterns, platform algorithms, and content type to determine the best posting time for maximum engagement.
                          </p>
                        </div>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={setScheduleDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )}
            </CardContent>
          </Card>

          {/* Publish Actions */}
          <Card className="shadow-creator">
            <CardContent className="p-6 space-y-4">
              <Button
                onClick={handlePublish}
                disabled={isPublishing || publishMutation.isPending}
                className="w-full gradient-primary text-white font-bold py-3 shadow-creator-lg"
              >
                {isPublishing ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {publishNow ? 'Post Now' : 'Schedule Post'}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={generateVariant}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                A/B Test Variant
              </Button>

              {/* Publishing Progress */}
              {isPublishing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-6"
                >
                  <p className="text-sm font-medium">Publishing to platforms:</p>
                  {selectedPlatforms.map((platformId) => {
                    const platform = platforms.find(p => p.id === platformId);
                    const progress = publishProgress[platformId] || 0;
                    return (
                      <div key={platformId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{platform?.label}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="text-sm">💡 Publishing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Best times: 6-10am, 7-9pm</p>
              <p>• Use 3-5 relevant hashtags</p>
              <p>• Ask questions to boost engagement</p>
              <p>• Respond to comments quickly</p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}