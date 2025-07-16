import express from 'express';
import { supabase } from '../supabaseClient';
import { requireUser } from '../supabaseAuth';

const router = express.Router();

// Submit AI risk score (protected)
router.post('/', requireUser, async (req, res) => {
  const { session_id, score } = req.body;
  if (!session_id || typeof score !== 'number') return res.status(400).json({ error: 'Missing or invalid session_id or score' });
  const { data, error } = await supabase.from('ai_scores').insert([{ session_id, score }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ai_score: data[0] });
});

// Get AI risk score for a session (protected)
router.get('/:sessionId', requireUser, async (req, res) => {
  const { sessionId } = req.params;
  const { data, error } = await supabase.from('ai_scores').select('*').eq('session_id', sessionId).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ai_score: data });
});

export default router; 