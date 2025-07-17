import express from 'express';
import { supabase } from '../supabaseClient';
import { requireUser } from '../supabaseAuth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Request access (public endpoint)
router.post('/request', async (req, res) => {
  try {
    const { email, company, role, useCase } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Store the access request
    const { data, error } = await supabase
      .from('access_requests')
      .insert([{
        email,
        company: company || null,
        role: role || null,
        use_case: useCase || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating access request:', error);
      return res.status(500).json({ error: 'Failed to submit request' });
    }

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to user

    res.json({ 
      success: true, 
      message: 'Access request submitted successfully. We\'ll review and get back to you soon.' 
    });
  } catch (error) {
    console.error('Error in access request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all access requests (admin only)
router.get('/', requireUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ requests: data });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/deny access request (admin only)
router.post('/:id/status', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('access_requests')
      .update({
        status,
        admin_notes: notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (req as any).user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (status === 'approved') {
      // TODO: Send invite email with signup link
      // TODO: Create user account or send invite token
    } else {
      // TODO: Send rejection email
    }

    res.json({ 
      success: true, 
      message: `Request ${status}`,
      request: data 
    });
  } catch (error) {
    console.error('Error updating access request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invite (admin only)
router.post('/send-invite', requireUser, async (req, res) => {
  try {
    const { email, name, role } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate invite token
    const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store invite
    const { data, error } = await supabase
      .from('invites')
      .insert([{
        email,
        name: name || null,
        role: role || null,
        token: inviteToken,
        status: 'pending',
        created_by: (req as any).user.id,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // TODO: Send invite email with signup link
    const inviteUrl = `${process.env.FRONTEND_URL}/auth/register?token=${inviteToken}`;

    res.json({ 
      success: true, 
      message: 'Invite sent successfully',
      invite: data,
      inviteUrl 
    });
  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate invite token (public endpoint)
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invite token has expired' });
    }

    res.json({ 
      valid: true, 
      invite: {
        email: data.email,
        name: data.name,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Error validating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invites - Admin: create invite code
router.post('/admin/invites', async (req, res) => {
  // TODO: Add admin authentication/authorization check here!
  const { email, invitedBy, expiresAt } = req.body;
  const code = uuidv4();
  const { data, error } = await supabase
    .from('invites')
    .insert([{ code, email, invited_by: invitedBy, expires_at: expiresAt }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ invite: data });
});

// GET /api/invites - Admin: list/export unused invite codes
router.get('/admin/invites', async (req, res) => {
  // TODO: Add admin authentication/authorization check here!
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('used', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ invites: data });
});

export default router; 