import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Play,
  Edit,
  Copy,
  Trash2
} from "lucide-react";
import { Video } from "@/lib/api";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function VideoCard({ video, onEdit, onDuplicate, onDelete }: VideoCardProps) {
  const statusColors = {
    Draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Generated: "bg-blue-100 text-blue-800 border-blue-200", 
    Published: "bg-green-100 text-green-800 border-green-200",
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="group overflow-hidden hover:shadow-creator-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <div className="aspect-[9/16] bg-muted relative overflow-hidden">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="lg" className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30">
              <Play className="w-6 h-6 text-white" />
            </Button>
          </div>

          {/* Status badge */}
          <Badge 
            className={cn(
              "absolute top-3 left-3 border font-medium",
              statusColors[video.status]
            )}
          >
            {video.status}
          </Badge>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-3 right-3 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 text-white border border-white/20"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(video.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(video.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(video.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{video.title}</h3>
        
        {video.status === 'Published' && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(video.views)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(video.likes)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="w-3 h-3" />
                <span>{formatNumber(video.shares)}</span>
              </div>
            </div>
          </div>
        )}

        {video.platforms.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {video.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}