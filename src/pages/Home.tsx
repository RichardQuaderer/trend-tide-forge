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

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  
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
                <span>Trending from Similar Companies</span>
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    id: 1,
                    title: "Morning Routine that Changed Everything",
                    company: "ProductivityCo",
                    views: 2400000,
                    engagement: "12.3%",
                    thumbnail: "/api/placeholder/60/80",
                    platform: "TikTok"
                  },
                  {
                    id: 2,
                    title: "5 Apps I Use Every Day",
                    company: "TechStartup",
                    views: 1800000,
                    engagement: "9.7%",
                    thumbnail: "/api/placeholder/60/80",
                    platform: "Instagram"
                  },
                  {
                    id: 3,
                    title: "Behind the Scenes: Building Our Product",
                    company: "InnovateNow",
                    views: 950000,
                    engagement: "15.2%",
                    thumbnail: "/api/placeholder/60/80",
                    platform: "YouTube"
                  },
                  {
                    id: 4,
                    title: "Common Mistakes Everyone Makes",
                    company: "ExpertCorp",
                    views: 750000,
                    engagement: "8.9%",
                    thumbnail: "/api/placeholder/60/80",
                    platform: "TikTok"
                  }
                ].map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-16 bg-muted rounded-lg overflow-hidden relative flex-shrink-0">
                      <img
                        src={campaign.thumbnail}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{campaign.title}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{campaign.company}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {campaign.platform}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(campaign.views / 1000000).toFixed(1)}M views
                        </span>
                        <span className="text-xs text-green-600">
                          {campaign.engagement} eng.
                        </span>
                      </div>
                    </div>
                  </div>
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