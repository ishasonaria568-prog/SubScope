import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  res.setHeader('Cache-Control', 'no-cache');
  return res.status(200).json({
    status: 'ok',
    service: 'SubScope Recon Engine',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
  });
}
