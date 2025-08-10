import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user's YouTube connection
    const { data: connection, error: connectionError } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .single()

    if (connectionError || !connection) {
      console.error('No YouTube connection found:', connectionError)
      return new Response(
        JSON.stringify({ error: 'YouTube not connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token needs refresh
    let accessToken = connection.access_token
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at)
      const now = new Date()
      
      if (now >= expiresAt && connection.refresh_token) {
        console.log('Token expired, attempting refresh')
        
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
        
        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: 'OAuth configuration missing for token refresh' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }).toString(),
        })

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json()
          accessToken = newTokens.access_token
          
          const newExpiresAt = newTokens.expires_in 
            ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
            : null

          // Update stored tokens
          await supabase
            .from('platform_connections')
            .update({
              access_token: accessToken,
              token_expires_at: newExpiresAt,
            })
            .eq('id', connection.id)
          
          console.log('Token refreshed successfully')
        } else {
          console.error('Token refresh failed')
          return new Response(
            JSON.stringify({ error: 'Token refresh failed' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Make a test API call to get channel info and recent uploads
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text()
      console.error('YouTube API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch YouTube data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const channelData = await channelResponse.json()
    
    if (!channelData.items || channelData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No YouTube channel found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const channel = channelData.items[0]
    console.log('YouTube API test successful for channel:', channel.snippet.title)

    // Get recent uploads (optional)
    let recentVideos = []
    try {
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads
      if (uploadsPlaylistId) {
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=5`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )
        
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          recentVideos = videosData.items?.map((item: any) => ({
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            videoId: item.snippet.resourceId.videoId,
          })) || []
        }
      }
    } catch (error) {
      console.error('Error fetching recent videos:', error)
      // Don't fail the whole request for this
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          subscriberCount: channel.statistics?.subscriberCount,
          videoCount: channel.statistics?.videoCount,
          viewCount: channel.statistics?.viewCount,
        },
        recentVideos,
        message: 'YouTube API connection working!'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in YouTube API test:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})