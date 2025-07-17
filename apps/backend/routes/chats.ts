import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// POST /api/chats - Create a chat (DM or group)
router.post('/', async (req, res) => {
  const { userId, participantIds, isGroup, name } = req.body;
  if (!userId || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'Missing userId or participantIds' });
  }
  // Create chat
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({ is_group: !!isGroup, name: name || null })
    .select()
    .single();
  if (chatError) return res.status(500).json({ error: chatError.message });
  // Add participants
  const allParticipants = [userId, ...participantIds];
  const participantsRows = allParticipants.map(uid => ({ chat_id: chat.id, user_id: uid }));
  const { error: partError } = await supabase
    .from('chat_participants')
    .insert(participantsRows);
  if (partError) return res.status(500).json({ error: partError.message });
  res.json({ chat });
});

// GET /api/chats - List chats for a user
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  // Get chat IDs
  const { data: participantRows, error: partError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);
  if (partError) return res.status(500).json({ error: partError.message });
  const chatIds = participantRows.map(row => row.chat_id);
  if (chatIds.length === 0) return res.json({ chats: [] });
  // Get chat details
  const { data: chats, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .in('id', chatIds);
  if (chatError) return res.status(500).json({ error: chatError.message });
  res.json({ chats });
});

// POST /api/chats/:chat_id/messages - Send a message
router.post('/:chat_id/messages', async (req, res) => {
  const { userId, content } = req.body;
  const { chat_id } = req.params;
  if (!userId || !content || !chat_id) return res.status(400).json({ error: 'Missing userId, content, or chat_id' });
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id, sender_id: userId, content });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/chats/:chat_id/messages - List messages in a chat
router.get('/:chat_id/messages', async (req, res) => {
  const { chat_id } = req.params;
  if (!chat_id) return res.status(400).json({ error: 'Missing chat_id' });
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chat_id)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages: data });
});

export default router; 