import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// POST /api/group-calls - Create a group call
router.post('/', async (req, res) => {
  const { userId, chatId } = req.body;
  if (!userId || !chatId) return res.status(400).json({ error: 'Missing userId or chatId' });
  // Create group call
  const { data: call, error: callError } = await supabase
    .from('group_calls')
    .insert({ chat_id: chatId, created_by: userId })
    .select()
    .single();
  if (callError) return res.status(500).json({ error: callError.message });
  // Add creator as participant
  const { error: partError } = await supabase
    .from('call_participants')
    .insert({ call_id: call.id, user_id: userId });
  if (partError) return res.status(500).json({ error: partError.message });
  res.json({ call });
});

// POST /api/group-calls/:call_id/join - Join a group call
router.post('/:call_id/join', async (req, res) => {
  const { userId } = req.body;
  const { call_id } = req.params;
  if (!userId || !call_id) return res.status(400).json({ error: 'Missing userId or call_id' });
  // Add participant
  const { error } = await supabase
    .from('call_participants')
    .insert({ call_id, user_id: userId });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/group-calls/:call_id/leave - Leave a group call
router.post('/:call_id/leave', async (req, res) => {
  const { userId } = req.body;
  const { call_id } = req.params;
  if (!userId || !call_id) return res.status(400).json({ error: 'Missing userId or call_id' });
  // Remove participant
  const { error } = await supabase
    .from('call_participants')
    .delete()
    .eq('call_id', call_id)
    .eq('user_id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/group-calls - List group calls for a user (by chat participation)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  // Get chat IDs for user
  const { data: chatParts, error: chatPartsError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);
  if (chatPartsError) return res.status(500).json({ error: chatPartsError.message });
  const chatIds = chatParts.map(row => row.chat_id);
  if (chatIds.length === 0) return res.json({ calls: [] });
  // Get group calls for those chats
  const { data: calls, error: callsError } = await supabase
    .from('group_calls')
    .select('*')
    .in('chat_id', chatIds);
  if (callsError) return res.status(500).json({ error: callsError.message });
  res.json({ calls });
});

export default router; 