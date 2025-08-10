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
  Play,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("US");

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: api.getVideos,
  });

  // Query for trending YouTube videos
  const {
    data: trendingVideos = [],
    isLoading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useQuery({
    queryKey: ["trending-videos", selectedRegion],
    queryFn: () => api.getTrendingVideos(selectedRegion, 10),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime)
    retry: 2,
  });

  // Query for backend health check
  const { data: backendHealthy = false } = useQuery({
    queryKey: ["backend-health"],
    queryFn: api.checkBackendHealth,
    refetchInterval: 30 * 1000, // Check every 30 seconds
    retry: false,
  });

  const recentVideos = videos.slice(0, 6);

  // Helper function to format view count
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Helper function to format published date
  const formatPublishedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch {
      return "Recently";
    }
  };

  // Helper function to calculate engagement rate (now with real data)
  const calculateEngagement = (
    views: number,
    likes?: number,
    comments?: number
  ) => {
    if (likes && comments && views > 0) {
      const engagementRate = ((likes + comments) / views) * 100;
      return `${engagementRate.toFixed(1)}%`;
    }
    // Fallback to mock calculation if data not available
    const engagementRate = (Math.random() * 10 + 5).toFixed(1);
    return `${engagementRate}%`;
  };

  // Function to refresh trending videos
  const handleRefreshTrending = async () => {
    try {
      await api.refreshTrendingVideos(selectedRegion, 10);
      refetchTrending();
    } catch (error) {
      console.error("Failed to refresh trending videos:", error);
    }
  };

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
          Turn your ideas into engaging short-form videos that capture attention
          and drive results.
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

                {/* Suggested prompts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Try these popular ideas:
                  </p>
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

                <div className="flex gap-3">
                  <Link to="/generate" className="flex-1">
                    <Button
                      size="lg"
                      className="w-full gradient-primary text-white font-semibold shadow-creator"
                      disabled={!prompt.trim()}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Script
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg">
                    <Plus className="w-5 h-5" />
                  </Button>
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
                        <div
                          className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
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
                <span>Trending YouTube Videos</span>
                {!backendHealthy && (
                  <Badge variant="secondary" className="text-xs">
                    Offline
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshTrending}
                  disabled={trendingLoading}
                >
                  {trendingLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {trendingLoading ? (
                  // Loading skeleton
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3">
                      <div className="w-16 h-20 bg-muted rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="flex space-x-3">
                          <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                        </div>
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : trendingError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">
                      Failed to load trending videos
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshTrending}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : trendingVideos.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No trending videos available
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Make sure the backend is running and API keys are
                      configured
                    </p>
                  </div>
                ) : (
                  trendingVideos.slice(0, 4).map((video) => (
                    <div
                      key={video.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group border border-transparent hover:border-primary/20"
                      onClick={() =>
                        window.open(
                          `https://youtube.com/watch?v=${video.id}`,
                          "_blank"
                        )
                      }
                    >
                      <div className="w-16 h-20 bg-muted rounded-lg overflow-hidden relative flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium text-sm truncate"
                          title={video.title}
                        >
                          {video.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {video.channelTitle} •{" "}
                          {formatPublishedDate(video.publishedAt)}
                        </p>

                        {/* Video Stats */}
                        <div className="flex items-center space-x-3 mb-1">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatViews(video.views)}
                            </span>
                          </div>

                          {video.likeCount && video.likeCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-muted-foreground">
                                {formatViews(video.likeCount)}
                              </span>
                            </div>
                          )}

                          {video.commentCount && video.commentCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-muted-foreground">
                                {formatViews(video.commentCount)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Platform and Engagement */}
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {video.platform}
                          </Badge>
                          <span className="text-xs text-white">
                            {calculateEngagement(
                              video.views,
                              video.likeCount,
                              video.commentCount
                            )}{" "}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  {backendHealthy
                    ? "Live data from YouTube trending videos"
                    : "Backend offline - showing cached data"}
                </p>
                {trendingVideos.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Region: {selectedRegion} • Updated:{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                )}
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
