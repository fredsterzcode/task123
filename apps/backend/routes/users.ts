import express from 'express';
import { supabase } from '../supabaseClient';
import { requireUser } from '../supabaseAuth';

const router = express.Router();

// List all users (protected)
router.get('/', requireUser, async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

// Get user info (protected)
router.get('/:id', requireUser, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

export default router; 