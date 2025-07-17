import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const token = req.headers.authorization;
  if (req.method === 'GET') {
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats?userId=${userId}`, {
        headers: { 'Authorization': token || '' }
      });
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  } else {
    res.status(405).end();
  }
} 