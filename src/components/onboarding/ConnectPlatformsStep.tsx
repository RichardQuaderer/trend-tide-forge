import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Youtube, Instagram, Play, ExternalLink } from "lucide-react";
import { useYouTubeConnection } from "@/hooks/useYouTubeConnection";
import { UserProfile } from "@/lib/api";

interface Platform {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface ConnectPlatformsStepProps {
  platforms: Platform[];
  profile: Partial<UserProfile>;
  handlePlatformToggle: (platformId: string) => void;
}

export function ConnectPlatformsStep({ platforms, profile, handlePlatformToggle }: ConnectPlatformsStepProps) {
  const { connection, loading, connectYouTube, disconnectYouTube, testConnection } = useYouTubeConnection();

  const handleYouTubeAction = async (platformId: string) => {
    if (connection) {
      await disconnectYouTube();
      handlePlatformToggle(platformId); // Remove from selected platforms
    } else {
      await connectYouTube();
      if (!profile.platforms?.includes(platformId)) {
        handlePlatformToggle(platformId); // Add to selected platforms
      }
    }
  };

  const renderPlatformCard = (platform: Platform) => {
    const isYouTube = platform.id === 'youtube';
    const isConnected = isYouTube ? !!connection : profile.platforms?.includes(platform.id);
    const isSelected = profile.platforms?.includes(platform.id);

    return (
      <Card 
        key={platform.id} 
        className={`cursor-pointer transition-all duration-200 hover:shadow-runway card-runway ${
          isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
        }`}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <platform.icon className={`w-8 h-8 ${platform.color}`} />
            <div>
              <h3 className="font-semibold">{platform.label}</h3>
              <p className="text-sm text-muted-foreground">
                {isYouTube && connection ? (
                  `Connected: ${connection.channel_name || 'YouTube Channel'}`
                ) : isYouTube ? (
                  'Connect your YouTube account'
                ) : isConnected ? (
                  'Connected'
                ) : (
                  'Click to connect'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isYouTube ? (
              <>
                <Button 
                  variant={connection ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleYouTubeAction(platform.id)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : connection ? 'Disconnect' : 'Connect'}
                </Button>
                {connection && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={testConnection}
                    title="Test connection"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant={isConnected ? "default" : "outline"} 
                size="sm"
                onClick={() => handlePlatformToggle(platform.id)}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Connect Your Social Platforms</h3>
        <p className="text-muted-foreground mb-6">
          Connect your social accounts to enable direct publishing and content optimization
        </p>
      </div>

      <div className="space-y-3">
        {platforms.map(renderPlatformCard)}
      </div>

      <div className="text-center">
        <Badge variant="secondary" className="px-4 py-2">
          You can connect more platforms later in settings
        </Badge>
      </div>
    </div>
  );
}