import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// GET /api/user-search?username=... - Search users by username
router.get('/', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Missing username query' });
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, name, role, company, title')
    .ilike('username', `%${username}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

export default router; 