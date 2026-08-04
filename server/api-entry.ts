import { getRequestListener } from '@hono/node-server';
import app from './index';

const listener = getRequestListener(app.fetch);

export default async function handler(req: any, res: any) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'web-streak.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    
    // Parse URL to check if path param was passed via Vercel rewrite
    try {
      const parsed = new URL(req.url, `${proto}://${host}`);
      const pathParam = parsed.searchParams.get('path');
      if (pathParam) {
        parsed.searchParams.delete('path');
        const qs = parsed.searchParams.toString();
        req.url = `/api/${pathParam}${qs ? `?${qs}` : ''}`;
      }
    } catch {}

    req.headers['x-forwarded-proto'] = proto;
    req.headers['x-forwarded-host'] = host;

    return await listener(req, res);
  } catch (error: any) {
    console.error('Vercel API error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: error?.message || 'Internal Server Error',
        stack: error?.stack,
      }));
    }
  }
}
