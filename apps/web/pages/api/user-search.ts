import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { username, ids } = req.query;
    try {
      let url = '';
      if (ids) {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-search?ids=${encodeURIComponent(ids as string)}`;
      } else {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-search?username=${encodeURIComponent(username as string)}`;
      }
      const backendRes = await fetch(url);
      const data = await backendRes.json();
      res.status(backendRes.status).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  } else {
    res.status(405).end();
  }
} 