import type { Express } from 'express';
import request from 'supertest';
import { buildTestApp } from './helpers/testApp';

describe('auth routes', () => {
  let app: Express;

  beforeEach(() => {
    app = buildTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ada@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toEqual({ id: expect.any(String), email: 'ada@example.com' });
    });

    it('rejects an invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('rejects a short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ada@example.com', password: 'short' });

      expect(res.status).toBe(400);
    });

    it('rejects a duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'ada@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ada@example.com', password: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'ada@example.com', password: 'password123' });
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ada@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('rejects an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('rejects an incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ada@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
    });
  });
});
