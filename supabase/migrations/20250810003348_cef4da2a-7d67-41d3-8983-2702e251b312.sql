-- Create platform_connections table to store OAuth tokens securely
CREATE TABLE public.platform_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    channel_id TEXT,
    channel_name TEXT,
    connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Create oauth_states table for CSRF protection
CREATE TABLE public.oauth_states (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    state TEXT NOT NULL UNIQUE,
    nonce TEXT NOT NULL,
    platform TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_connections
CREATE POLICY "Users can view their own connections" 
ON public.platform_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" 
ON public.platform_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" 
ON public.platform_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" 
ON public.platform_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for oauth_states
CREATE POLICY "Users can view their own oauth states" 
ON public.oauth_states 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth states" 
ON public.oauth_states 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth states" 
ON public.oauth_states 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for platform_connections
CREATE TRIGGER update_platform_connections_updated_at
    BEFORE UPDATE ON public.platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired oauth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM public.oauth_states 
    WHERE created_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;