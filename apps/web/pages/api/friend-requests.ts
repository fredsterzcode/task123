import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const token = req.headers.authorization;
  if (req.method === 'GET') {
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend-requests?userId=${userId}`, {
        headers: { 'Authorization': token || '' }
      });
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch friend requests' });
    }
  } else if (req.method === 'POST') {
    // Accept or decline friend request
    const { action } = req.body;
    let endpoint = '/api/friend-requests';
    if (action === 'accept') endpoint += '/accept';
    if (action === 'decline') endpoint += '/decline';
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(req.body)
      });
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to update friend request' });
    }
  } else if (req.method === 'DELETE') {
    // Cancel or remove friend request
    const { requestId } = req.query;
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/friend-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(req.body)
      });
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to remove friend request' });
    }
  } else {
    res.status(405).end();
  }
} 