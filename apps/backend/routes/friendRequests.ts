import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// POST /api/friend-requests - Send a friend request
router.post('/', async (req, res) => {
  const { userId, receiverId } = req.body;
  if (!userId || !receiverId) {
    return res.status(400).json({ error: 'Missing userId or receiverId' });
  }
  // Check if request already exists
  const { data: existing, error: existingError } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${receiverId}`)
    .or(`sender_id.eq.${receiverId},receiver_id.eq.${userId}`)
    .maybeSingle();
  if (existing) {
    return res.status(409).json({ error: 'Friend request already exists' });
  }
  // Insert friend request
  const { error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: userId, receiver_id: receiverId });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/friend-requests/accept - Accept a friend request
router.post('/accept', async (req, res) => {
  const { userId, requestId } = req.body;
  if (!userId || !requestId) {
    return res.status(400).json({ error: 'Missing userId or requestId' });
  }
  // Get the request
  const { data: request, error: reqError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (reqError || !request) return res.status(404).json({ error: 'Request not found' });
  if (request.receiver_id !== userId) return res.status(403).json({ error: 'Not authorized' });
  // Add to friends
  const { error: friendError } = await supabase
    .from('friends')
    .insert([
      { user_id: request.sender_id, friend_id: request.receiver_id },
      { user_id: request.receiver_id, friend_id: request.sender_id }
    ]);
  if (friendError) return res.status(500).json({ error: friendError.message });
  // Delete the request
  await supabase.from('friend_requests').delete().eq('id', requestId);
  res.json({ success: true });
});

// POST /api/friend-requests/decline - Decline a friend request
router.post('/decline', async (req, res) => {
  const { userId, requestId } = req.body;
  if (!userId || !requestId) {
    return res.status(400).json({ error: 'Missing userId or requestId' });
  }
  // Get the request
  const { data: request, error: reqError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (reqError || !request) return res.status(404).json({ error: 'Request not found' });
  if (request.receiver_id !== userId) return res.status(403).json({ error: 'Not authorized' });
  // Delete the request
  await supabase.from('friend_requests').delete().eq('id', requestId);
  res.json({ success: true });
});

// GET /api/friend-requests - List friend requests (sent and received)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ requests: data });
});

export default router; 