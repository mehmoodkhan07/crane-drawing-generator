import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from './db.js';

export const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT 1 AS ok').get() as { ok: number };
  res.json({ status: 'ok', db: row.ok === 1 });
});

// Central error handler — never leak stack traces
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}
