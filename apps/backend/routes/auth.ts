import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Device registration and session management
router.post('/device/register', async (req, res) => {
  try {
    const { userId, deviceId, deviceName, platform } = req.body;

    if (!userId || !deviceId || !deviceName || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if device is already registered
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    if (existingDevice) {
      // Update last login
      await supabase
        .from('user_devices')
        .update({ 
          last_login: new Date().toISOString(),
          is_active: true 
        })
        .eq('id', existingDevice.id);

      return res.json({ 
        success: true, 
        device: existingDevice,
        message: 'Device already registered' 
      });
    }

    // Check device limit (max 2 devices per user)
    const { data: deviceCount } = await supabase
      .from('user_devices')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (deviceCount && deviceCount.length >= 2) {
      return res.status(403).json({ 
        error: 'Device limit reached. Maximum 2 devices allowed per user.' 
      });
    }

    // Register new device
    const { data: newDevice, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName,
        platform,
        is_active: true,
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering device:', error);
      return res.status(500).json({ error: 'Failed to register device' });
    }

    res.json({ success: true, device: newDevice });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /register - Open registration (no invite required)
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Register user with Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
  });
  if (signUpError) return res.status(400).json({ error: signUpError.message });

  const userId = signUpData.user.id;

  // Insert into profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: userId, username }]);
  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return res.status(400).json({ error: profileError.message });
  }

  return res.status(200).json({ message: 'User registered successfully!' });
});

// Terminate other sessions when logging in
router.post('/session/activate', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Deactivate all other sessions for this user
    await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('user_id', userId)
      .neq('device_id', deviceId);

    // Activate current device
    await supabase
      .from('user_devices')
      .update({ 
        is_active: true,
        last_login: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    res.json({ success: true, message: 'Session activated' });
  } catch (error) {
    console.error('Session activation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if device is authorized
router.get('/device/check/:userId/:deviceId', async (req, res) => {
  try {
    const { userId, deviceId } = req.params;

    const { data: device, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .single();

    if (error || !device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ 
      success: true, 
      device,
      isAuthorized: device.is_active 
    });
  } catch (error) {
    console.error('Device check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's devices
router.get('/devices/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_login', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }

    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove device
router.delete('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userId } = req.body;

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing device:', error);
      return res.status(500).json({ error: 'Failed to remove device' });
    }

    res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 