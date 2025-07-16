import express from 'express';
import { supabase } from '../supabaseClient';
import { requireUser } from '../supabaseAuth';

const router = express.Router();

// List all sessions (protected)
router.get('/', requireUser, async (req, res) => {
  const { data, error } = await supabase.from('sessions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sessions: data });
});

// Create a new session (protected)
router.post('/', requireUser, async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Missing name or type' });
  const { data, error } = await supabase.from('sessions').insert([{ name, type }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data[0] });
});

// End a session (protected)
router.post('/:id/end', requireUser, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data[0] });
});

export default router; 