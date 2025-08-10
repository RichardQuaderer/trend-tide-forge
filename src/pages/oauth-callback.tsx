import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'YOUTUBE_OAUTH_ERROR',
            error: error
          }, window.location.origin);
        }
        window.close();
        return;
      }

      if (code && state) {
        try {
          // Call the callback function
          const { data, error: callbackError } = await supabase.functions.invoke(
            'youtube-oauth-callback',
            {
              body: { code, state }
            }
          );

          if (callbackError || !data?.success) {
            throw new Error(callbackError?.message || 'OAuth callback failed');
          }

          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'YOUTUBE_OAUTH_SUCCESS',
              channelName: data.channelName
            }, window.location.origin);
          }
          
        } catch (error) {
          console.error('OAuth callback error:', error);
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'YOUTUBE_OAUTH_ERROR',
              error: error instanceof Error ? error.message : 'Unknown error'
            }, window.location.origin);
          }
        }
      }

      // Close the popup window
      window.close();
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing authorization...</h2>
        <p className="text-muted-foreground">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}