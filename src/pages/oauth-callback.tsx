import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        if (window.opener) {
          window.opener.postMessage({ type: 'YOUTUBE_OAUTH_ERROR', error }, window.location.origin);
        }
        window.close();
        return;
      }

      if (code && state) {
        try {
          // First try: call local dev middleware to finish OAuth
          const resp = await fetch('/api/youtube/oauth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state })
          });
          const data = await resp.json();
          if (data?.success) {
            if (window.opener) {
              window.opener.postMessage({ type: 'YOUTUBE_OAUTH_SUCCESS', channelName: data.channelName }, window.location.origin);
            }
          } else {
            // Fallback: pass raw code/state back to opener if needed
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_CODE', code, state }, window.location.origin);
            }
          }
        } catch (e) {
          if (window.opener) {
            window.opener.postMessage({ type: 'YOUTUBE_OAUTH_ERROR', error: 'OAuth callback error' }, window.location.origin);
          }
        }
      }

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