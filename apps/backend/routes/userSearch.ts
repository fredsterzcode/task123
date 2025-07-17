import express from 'express';
import { supabase } from '../supabaseClient';
const router = express.Router();

// GET /api/user-search?username=... - Search users by username
router.get('/', async (req, res) => {
  const { username, ids } = req.query;
  if (ids) {
    // Batch lookup by user IDs
    const idList = String(ids).split(',').map(id => id.trim()).filter(Boolean);
    if (idList.length === 0) return res.status(400).json({ error: 'No IDs provided' });
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, role, company, title')
      .in('id', idList);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ users: data });
  }
  if (!username) return res.status(400).json({ error: 'Missing username query' });
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, name, role, company, title')
    .ilike('username', `%${username}%`);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

export default router; 