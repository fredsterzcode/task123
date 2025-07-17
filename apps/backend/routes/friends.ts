import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// GET /api/friends - List friends
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const { data, error } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ friends: data });
});

// DELETE /api/friends/:friend_id - Remove a friend
router.delete('/:friend_id', async (req, res) => {
  const { userId } = req.body;
  const { friend_id } = req.params;
  if (!userId || !friend_id) return res.status(400).json({ error: 'Missing userId or friend_id' });
  // Remove both directions
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`user_id.eq.${userId},friend_id.eq.${friend_id}`)
    .or(`user_id.eq.${friend_id},friend_id.eq.${userId}`);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router; 