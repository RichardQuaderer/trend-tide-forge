import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface YouTubeConnection {
  id: string;
  platform: string;
  channel_id: string | null;
  channel_name: string | null;
  connected_at: string;
}

export function useYouTubeConnection() {
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform', 'youtube')
        .maybeSingle();

      if (error) {
        console.error('Error fetching YouTube connection:', error);
        return;
      }

      setConnection(data);
    } catch (error) {
      console.error('Error fetching YouTube connection:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  const connectYouTube = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('youtube-oauth-start');
      
      if (error) {
        console.error('Error starting OAuth:', error);
        toast({
          title: "Connection failed",
          description: "Failed to start YouTube connection process",
          variant: "destructive",
        });
        return;
      }

      if (data?.authUrl) {
        // Open popup window for OAuth
        const popup = window.open(
          data.authUrl,
          'youtube-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup close or message
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Refresh connection status after popup closes
            setTimeout(fetchConnection, 1000);
          }
        }, 1000);

        // Listen for messages from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'YOUTUBE_OAUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup?.close();
            window.removeEventListener('message', messageListener);
            
            toast({
              title: "YouTube Connected!",
              description: `Connected to ${event.data.channelName || 'YouTube'}`,
            });
            
            fetchConnection();
          } else if (event.data.type === 'YOUTUBE_OAUTH_ERROR') {
            clearInterval(checkClosed);
            popup?.close();
            window.removeEventListener('message', messageListener);
            
            toast({
              title: "Connection failed",
              description: event.data.error || "Failed to connect to YouTube",
              variant: "destructive",
            });
          }
        };

        window.addEventListener('message', messageListener);
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to generate authorization URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      toast({
        title: "Connection failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.functions.invoke('youtube-oauth-disconnect', {
        method: 'POST'
      });
      
      if (error) {
        console.error('Error disconnecting YouTube:', error);
        toast({
          title: "Disconnect failed",
          description: "Failed to disconnect YouTube",
          variant: "destructive",
        });
        return;
      }

      setConnection(null);
      toast({
        title: "YouTube Disconnected",
        description: "Successfully disconnected from YouTube",
      });
      
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      toast({
        title: "Disconnect failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-api-test');
      
      if (error) {
        console.error('Error testing YouTube connection:', error);
        toast({
          title: "Test failed",
          description: "Failed to test YouTube connection",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Connection works!",
          description: `Successfully connected to ${data.channel?.title || 'YouTube'}`,
        });
      }
    } catch (error) {
      console.error('Error testing YouTube connection:', error);
      toast({
        title: "Test failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    connection,
    loading,
    connectYouTube,
    disconnectYouTube,
    testConnection,
    refetch: fetchConnection,
  };
}