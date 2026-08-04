import { getRequestListener } from '@hono/node-server';
import app from '../server/index';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default getRequestListener(app.fetch);

