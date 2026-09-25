import cors from 'cors';
import express, { type Express } from 'express';
import type { Db } from './db';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth.routes';
import { createTasksRouter } from './routes/tasks.routes';
import { createAuthService } from './services/auth.service';
import { createTasksService } from './services/tasks.service';

export interface AppConfig {
  db: Db;
  jwtSecret: string;
  clientOrigin?: string;
}

export function createApp({ db, jwtSecret, clientOrigin }: AppConfig): Express {
  const app = express();
  app.use(cors({ origin: clientOrigin ?? true }));
  app.use(express.json());

  const authService = createAuthService(db, jwtSecret);
  const tasksService = createTasksService(db);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/tasks', requireAuth(authService), createTasksRouter(tasksService));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}
