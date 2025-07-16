import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { deviceId } = req.query;
    const token = req.headers.authorization;
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/device/${deviceId}`, {
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
      res.status(500).json({ error: 'Failed to remove device' });
    }
  } else {
    res.status(405).end();
  }
} 