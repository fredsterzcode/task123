-- Create user_devices table for device management
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'mac', 'linux')),
  is_active BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own devices
CREATE POLICY "Users can view own devices" ON user_devices
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices" ON user_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices" ON user_devices
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete own devices" ON user_devices
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON user_devices
  FOR ALL USING (auth.role() = 'service_role'); 