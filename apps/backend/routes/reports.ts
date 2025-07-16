import express from 'express';
import { supabase } from '../supabaseClient';
import { requireUser } from '../supabaseAuth';

const router = express.Router();

// Get all reports (protected)
router.get('/', requireUser, async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ reports: data });
});

// Download a session report (protected)
router.get('/:sessionId/download', requireUser, async (req, res) => {
  const { sessionId } = req.params;
  // Example: fetch report file URL from Supabase storage or DB
  const { data, error } = await supabase.from('reports').select('*').eq('session_id', sessionId).single();
  if (error) return res.status(500).json({ error: error.message });
  // TODO: Replace with actual file download logic
  res.json({ report: data });
});

export default router; 