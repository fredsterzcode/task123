import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// POST /api/presence - Update presence
router.post('/', async (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !status) return res.status(400).json({ error: 'Missing userId or status' });
  // Upsert presence
  const { error } = await supabase
    .from('presence')
    .upsert({ user_id: userId, status }, { onConflict: 'user_id' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/presence/:user_id - Get presence for a user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const { data, error } = await supabase
    .from('presence')
    .select('*')
    .eq('user_id', user_id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ presence: data });
});

export default router; 