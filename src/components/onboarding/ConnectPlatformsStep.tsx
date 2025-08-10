import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Youtube, Instagram, Play, ExternalLink } from "lucide-react";
import { useYouTubeConnection } from "@/hooks/useYouTubeConnection";
import { UserProfile } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    if (connection.connected) {
      await disconnectYouTube();
      handlePlatformToggle(platformId); // Remove from selected platforms
    } else {
      await connectYouTube();
      if (!profile.platforms?.includes(platformId)) {
        handlePlatformToggle(platformId); // Add to selected platforms
      }
    }
  };

  const isDisabledPlatform = (platformId: string) => platformId === 'tiktok' || platformId === 'instagram';

  const renderPlatformCard = (platform: Platform) => {
    const isYouTube = platform.id === 'youtube';
    const isDisabled = isDisabledPlatform(platform.id);
    const isConnected = isYouTube ? !!connection.connected : profile.platforms?.includes(platform.id);
    const isSelected = profile.platforms?.includes(platform.id);

    const cardInner = (
      <Card 
        key={platform.id} 
        className={`transition-all duration-200 card-runway ${
          isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-runway'}`}
        onClick={() => {
          if (isDisabled) return;
        }}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <platform.icon className={`w-8 h-8 ${platform.color}`} />
            <div>
              <h3 className="font-semibold">{platform.label}</h3>
              <p className="text-sm text-muted-foreground">
                {isDisabled ? (
                  'Coming soon'
                ) : isYouTube && connection.connected ? (
                  `Connected: ${connection.channelName || 'YouTube Channel'}`
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
                  variant={connection.connected ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleYouTubeAction(platform.id)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : connection.connected ? 'Disconnect' : 'Connect'}
                </Button>
                {connection.connected && (
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
                onClick={() => { if (!isDisabled) handlePlatformToggle(platform.id); }}
                disabled={isDisabled}
              >
                {isDisabled ? 'Soon' : isConnected ? 'Connected' : 'Connect'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );

    return isDisabled ? (
      <Tooltip key={platform.id}>
        <TooltipTrigger asChild>
          <div>{cardInner}</div>
        </TooltipTrigger>
        <TooltipContent>
          These features are being worked on and will be available soon.
        </TooltipContent>
      </Tooltip>
    ) : (
      cardInner
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