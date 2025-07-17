import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const token = req.headers.authorization;
  if (req.method === 'GET') {
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presence/${userId}`, {
        headers: { 'Authorization': token || '' }
      });
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch presence' });
    }
  } else if (req.method === 'POST') {
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/presence`, {
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
      res.status(500).json({ error: 'Failed to update presence' });
    }
  } else {
    res.status(405).end();
  }
} 