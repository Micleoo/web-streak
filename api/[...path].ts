import { getRequestListener } from '@hono/node-server';
import app from '../server/index';

const listener = getRequestListener(app.fetch);

export default async function handler(req: any, res: any) {
  try {
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
