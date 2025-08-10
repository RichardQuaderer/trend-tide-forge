import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface YouTubeConnectionState {
  connected: boolean;
  channelName?: string;
}

export function useYouTubeConnection() {
  const [connection, setConnection] = useState<YouTubeConnectionState>({ connected: false });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnection = async () => {
    try {
      const res = await fetch('/api/youtube/status');
      const data = await res.json();
      setConnection({ connected: !!data.connected, channelName: data.channelName });
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
      const res = await fetch('/api/youtube/oauth/start', { method: 'POST' });
      const data = await res.json();
      if (!data?.authUrl) {
        toast({ title: 'Connection failed', description: 'Failed to generate authorization URL', variant: 'destructive' });
        return;
      }

      const popup = window.open(
        data.authUrl,
        'youtube-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setTimeout(fetchConnection, 800);
        }
      }, 800);

      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'YOUTUBE_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          toast({ title: 'YouTube Connected!', description: `Connected to ${event.data.channelName || 'YouTube'}` });
          fetchConnection();
        } else if (event.data.type === 'YOUTUBE_OAUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          toast({ title: 'Connection failed', description: event.data.error || 'Failed to connect to YouTube', variant: 'destructive' });
        } else if (event.data.type === 'OAUTH_CODE') {
          // Fallback: if /oauth-callback posts raw code/state
          try {
            const resp = await fetch('/api/youtube/oauth/callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: event.data.code, state: event.data.state })
            });
            const rj = await resp.json();
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup?.close();
            if (rj.success) {
              toast({ title: 'YouTube Connected!', description: `Connected to ${rj.channelName || 'YouTube'}` });
              fetchConnection();
            } else {
              toast({ title: 'Connection failed', description: rj.error || 'OAuth failed', variant: 'destructive' });
            }
          } catch (e) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            popup?.close();
            toast({ title: 'Connection failed', description: 'OAuth callback error', variant: 'destructive' });
          }
        }
      };

      window.addEventListener('message', messageListener);
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      toast({ title: 'Connection failed', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setLoading(true);
      await fetch('/api/youtube/disconnect', { method: 'POST' });
      setConnection({ connected: false });
      toast({ title: 'YouTube Disconnected', description: 'Successfully disconnected from YouTube' });
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      toast({ title: 'Disconnect failed', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const res = await fetch('/api/youtube/test');
      const data = await res.json();
      if (data?.success) {
        toast({ title: 'Connection works!', description: `Connected to ${data.channel?.snippet?.title || 'YouTube'}` });
      } else {
        toast({ title: 'Test failed', description: data?.error || 'Failed to test YouTube connection', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error testing YouTube connection:', error);
      toast({ title: 'Test failed', description: 'An unexpected error occurred', variant: 'destructive' });
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