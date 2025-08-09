import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Clock, 
  Share2, 
  MousePointer,
  TrendingUp,
  Play,
  Copy,
  Edit,
  MoreHorizontal,
  Calendar,
  Target,
  Trophy,
  BarChart3,
  Users
} from "lucide-react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: api.getVideos,
  });

  const publishedVideos = videos.filter(v => v.status === 'Published');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const kpiCards = [
    {
      title: "Total Views",
      value: analytics ? formatNumber(analytics.totalViews) : "0",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-blue-600",
    },
    {
      title: "Avg Watch %",
      value: analytics ? `${analytics.avgWatchPercent}%` : "0%",
      change: "+3.2%",
      trend: "up",
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Total Shares",
      value: analytics ? formatNumber(analytics.totalShares) : "0",
      change: "+8.7%",
      trend: "up",
      icon: Share2,
      color: "text-purple-600",
    },
    {
      title: "Hook CTR",
      value: analytics ? `${analytics.bestHookCTR}%` : "0%",
      change: "+1.3%",
      trend: "up",
      icon: MousePointer,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your viral video performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 days
          </Button>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-creator hover:shadow-creator-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          kpi.trend === 'up' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                        }`}
                      >
                        {kpi.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${kpi.color}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="views" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="views">Views</TabsTrigger>
                  <TabsTrigger value="likes">Likes</TabsTrigger>
                  <TabsTrigger value="shares">Shares</TabsTrigger>
                </TabsList>
                
                <TabsContent value="views" className="space-y-4">
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Chart visualization would go here</p>
                      <p className="text-sm text-muted-foreground">
                        Daily views: {analytics?.dailyStats.map(d => formatNumber(d.views)).join(', ')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="likes" className="space-y-4">
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Likes trend chart</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="shares" className="space-y-4">
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Shares growth chart</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Platform Breakdown */}
        <div className="space-y-6">
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle>Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics?.platformBreakdown.map((platform, index) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{platform.platform}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(platform.views)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${platform.percentage}%` }}
                      transition={{ delay: index * 0.2, duration: 0.8 }}
                      className="h-2 rounded-full gradient-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{platform.percentage}% of total views</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Best Hook Insight */}
          <Card className="shadow-creator">
            <CardHeader>
              <CardTitle className="text-sm">💡 Top Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium">Your best-performing opening:</p>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    "{analytics?.bestHook}"
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This hook achieved {analytics?.bestHookCTR}% click-through rate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Performance Table */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle>Video Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {publishedVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-16 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{video.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(video.views)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span>{formatNumber(video.likes)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{formatNumber(video.shares)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {video.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Improve
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign A/B Testing Deep Dive */}
      <Card className="shadow-creator">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Campaign A/B Test Results</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Deep dive into your past campaign performance and test outcomes
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics?.campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {campaign.testType} Test
                      </Badge>
                      <Badge 
                        variant={campaign.status === 'Completed' ? 'default' : campaign.status === 'Active' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {campaign.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {campaign.startDate} {campaign.endDate && `- ${campaign.endDate}`}
                      </span>
                    </div>
                  </div>
                  {campaign.winner && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">Winner: {campaign.variants.find(v => v.id === campaign.winner)?.name}</span>
                    </div>
                  )}
                </div>

                {/* Variants Comparison */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaign.variants.map((variant) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`border rounded-lg p-4 ${campaign.winner === variant.id ? 'border-green-500 bg-green-50/50' : 'border-border'}`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{variant.name}</h4>
                            {campaign.winner === variant.id && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Winner
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                            "{variant.hookText}"
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">Views</span>
                              </div>
                              <p className="font-medium">{formatNumber(variant.views)}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <MousePointer className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">CTR</span>
                              </div>
                              <p className="font-medium">{variant.ctr}%</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">Clicks</span>
                              </div>
                              <p className="font-medium">{formatNumber(variant.clicks)}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs text-muted-foreground">Conv Rate</span>
                              </div>
                              <p className="font-medium">{variant.conversionRate}%</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Performance Summary */}
                  {campaign.status === 'Completed' && campaign.winner && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h5 className="font-medium text-primary mb-2">Test Results Summary</h5>
                      <div className="text-sm space-y-1">
                        {(() => {
                          const winner = campaign.variants.find(v => v.id === campaign.winner);
                          const other = campaign.variants.find(v => v.id !== campaign.winner);
                          if (!winner || !other) return null;
                          
                          const ctrImprovement = ((winner.ctr - other.ctr) / other.ctr * 100).toFixed(1);
                          const convImprovement = ((winner.conversionRate - other.conversionRate) / other.conversionRate * 100).toFixed(1);
                          
                          return (
                            <>
                              <p>• <strong>{winner.name}</strong> outperformed by <strong>{ctrImprovement}%</strong> in CTR</p>
                              <p>• Conversion rate improvement: <strong>{convImprovement}%</strong></p>
                              <p>• Total additional conversions: <strong>{winner.conversions - other.conversions}</strong></p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}