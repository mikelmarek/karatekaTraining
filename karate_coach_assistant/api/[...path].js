import app from '../src/plannerSecureApp.js';

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Planner Vercel handler crashed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}