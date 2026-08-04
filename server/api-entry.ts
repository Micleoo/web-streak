import { getRequestListener } from '@hono/node-server';
import app from './index';

const listener = getRequestListener(app.fetch);

export default async function handler(req: any, res: any) {
  try {
    const originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-now-route-matches'] || req.url;
    if (originalUrl && typeof originalUrl === 'string' && originalUrl.startsWith('/api')) {
      req.url = originalUrl;
    }
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
