import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Track downloads
router.post('/download', async (req, res) => {
  try {
    const { platform, version, userId } = req.body;

    if (!platform || !version || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert download record
    const { data, error } = await supabase
      .from('downloads')
      .insert({
        user_id: userId,
        platform,
        version,
        downloaded_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking download:', error);
      return res.status(500).json({ error: 'Failed to track download' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get download statistics
router.get('/downloads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('downloads')
      .select('*')
      .order('downloaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching downloads:', error);
      return res.status(500).json({ error: 'Failed to fetch downloads' });
    }

    res.json({ downloads: data });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 