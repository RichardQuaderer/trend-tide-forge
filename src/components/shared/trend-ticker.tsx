import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Music } from "lucide-react";
import { motion } from "framer-motion";

export function TrendTicker() {
  const { data: trends = [] } = useQuery({
    queryKey: ['trends'],
    queryFn: api.getTrends,
  });

  const hashtags = trends.filter(t => t.hashtag);
  const sounds = trends.filter(t => t.sound);

  return (
    <div className="bg-card border rounded-xl p-4 shadow-creator">
      <div className="flex items-center space-x-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Today's Trends</h3>
      </div>
      
      <div className="space-y-3">
        {/* Hashtag trends */}
        <div className="relative overflow-hidden">
          <motion.div 
            className="flex space-x-2"
            animate={{ x: [-100, -1000] }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            {[...hashtags, ...hashtags].map((trend, index) => (
              <Badge 
                key={`${trend.id}-${index}`}
                variant="secondary" 
                className="whitespace-nowrap flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-creator-purple/10 to-creator-blue/10 border-creator-purple/20"
              >
                <span className="text-creator-purple">#</span>
                <span>{trend.hashtag}</span>
                <span className="text-xs text-muted-foreground">
                  {(trend.usage / 1000000).toFixed(1)}M
                </span>
              </Badge>
            ))}
          </motion.div>
        </div>

        {/* Sound trends */}
        <div className="relative overflow-hidden">
          <motion.div 
            className="flex space-x-2"
            animate={{ x: [-100, -1200] }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear",
              delay: 1 
            }}
          >
            {[...sounds, ...sounds].map((trend, index) => (
              <Badge 
                key={`${trend.id}-${index}`}
                variant="outline" 
                className="whitespace-nowrap flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-creator-pink/10 to-creator-orange/10 border-creator-pink/20"
              >
                <Music className="w-3 h-3 text-creator-pink" />
                <span className="text-sm">{trend.sound}</span>
                <span className="text-xs text-muted-foreground">
                  {(trend.usage / 1000).toFixed(0)}K
                </span>
              </Badge>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}