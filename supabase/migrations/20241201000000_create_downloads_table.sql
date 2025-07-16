-- Create downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'mac', 'linux')),
  version TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_platform ON downloads(platform);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);

-- Enable RLS
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own downloads
CREATE POLICY "Users can view own downloads" ON downloads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert own downloads" ON downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for analytics)
CREATE POLICY "Service role full access" ON downloads
  FOR ALL USING (auth.role() = 'service_role'); 