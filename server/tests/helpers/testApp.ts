import type { Express } from 'express';
import { createApp } from '../../src/app';
import { createDb } from '../../src/db';

export function buildTestApp(): Express {
  const db = createDb(':memory:');
  return createApp({ db, jwtSecret: 'test-secret' });
}
