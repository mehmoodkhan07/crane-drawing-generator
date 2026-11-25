import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { db, seedReferenceDesignIfEmpty } from './db.js';
import { createDesignsRouter } from './routes/designs.js';

export function createApp(database: DatabaseSync = db) {
  const app = express();
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    const row = database.prepare('SELECT 1 AS ok').get() as { ok: number };
    res.json({ status: 'ok', db: row.ok === 1 });
  });

  app.use('/api', createDesignsRouter(database));

  // Handle malformed JSON bodies as 400 instead of 500
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
      res.status(400).json({ errors: [{ field: 'body', message: 'Invalid JSON body' }] });
      return;
    }
    next(err);
  });

  // Central error handler — never leak stack traces
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export const app = createApp(db);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

if (process.env.NODE_ENV !== 'test' && !process.argv.some((a) => a.includes('api.test'))) {
  seedReferenceDesignIfEmpty(db);
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}
