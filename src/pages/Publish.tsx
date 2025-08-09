import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Share2, 
  Calendar as CalendarIcon, 
  Clock, 
  Send,
  Check,
  Copy,
  Zap,
  Hash,
  Play
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
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "youtube"]);
  const [title, setTitle] = useState("How to be productive in 2024 - the ultimate guide");
  const [description, setDescription] = useState("This productivity hack will change your life! Try it and thank me later ✨ #productivity #lifehack #viral");
  const [hashtags, setHashtags] = useState<string[]>(["#productivity", "#lifehack", "#viral"]);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [publishNow, setPublishNow] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<Record<string, number>>({});

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

  const handlePublish = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to publish to",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    // Simulate platform-specific publishing progress
    selectedPlatforms.forEach((platform, index) => {
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
      scheduledFor: publishNow ? null : scheduleDate,
    };

    publishMutation.mutate({
      videoId: id,
      platforms: selectedPlatforms,
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
        <h1 className="text-3xl font-bold text-gradient">Publish Your Video</h1>
        <p className="text-muted-foreground">Share your content across platforms</p>
      </div>

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
    </div>
  );
}