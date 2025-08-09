import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/shared/video-card";
import { api } from "@/lib/api";
import { Search, Filter, Grid, List, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: api.getVideos,
  });

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || video.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const videosByStatus = {
    all: filteredVideos,
    published: filteredVideos.filter(v => v.status === 'Published'),
    generated: filteredVideos.filter(v => v.status === 'Generated'),
    draft: filteredVideos.filter(v => v.status === 'Draft'),
  };

  const handleVideoAction = (action: string, videoId: string) => {
    console.log(`${action} video:`, videoId);
    // Implement actions like edit, duplicate, delete
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Video Library</h1>
          <p className="text-muted-foreground mt-1">Manage all your viral content</p>
        </div>
        <Link to="/generate">
          <Button className="gradient-primary text-white shadow-creator">
            <Plus className="w-4 h-4 mr-2" />
            Create New Video
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">
            All ({videosByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({videosByStatus.published.length})
          </TabsTrigger>
          <TabsTrigger value="generated">
            Generated ({videosByStatus.generated.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({videosByStatus.draft.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(videosByStatus).map(([status, videos]) => (
          <TabsContent key={status} value={status} className="space-y-6">
            {videos.length > 0 ? (
              viewMode === "grid" ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <VideoCard
                        video={video}
                        onEdit={(id) => handleVideoAction('edit', id)}
                        onDuplicate={(id) => handleVideoAction('duplicate', id)}
                        onDelete={(id) => handleVideoAction('delete', id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {videos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-semibold truncate">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                        
                        {video.status === 'Published' && (
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{(video.views / 1000).toFixed(1)}K views</span>
                            <span>{(video.likes / 1000).toFixed(1)}K likes</span>
                            <span>{video.shares} shares</span>
                          </div>
                        )}
                        
                        {video.platforms.length > 0 && (
                          <div className="flex gap-1">
                            {video.platforms.map((platform) => (
                              <span
                                key={platform}
                                className="px-2 py-1 bg-muted rounded text-xs"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            video.status === 'Published'
                              ? 'bg-green-100 text-green-700'
                              : video.status === 'Generated'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {video.status}
                        </span>
                        
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Filter className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {status === 'all' ? 'No videos yet' : `No ${status} videos`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {status === 'all' 
                    ? "Create your first viral video to get started! ✨"
                    : `No videos with ${status} status found.`
                  }
                </p>
                {status === 'all' && (
                  <Link to="/generate">
                    <Button className="gradient-primary text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Video
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}