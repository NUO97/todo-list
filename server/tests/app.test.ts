import request from 'supertest';
import { buildTestApp } from './helpers/testApp';

describe('app', () => {
  it('responds to a health check with no auth required', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for an unknown route', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
