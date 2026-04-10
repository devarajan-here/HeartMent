import serverless from 'serverless-http';
import app from '../../server/index.js';

// This wraps our Express app so Netlify can run it as a serverless function
export const handler = serverless(app);
