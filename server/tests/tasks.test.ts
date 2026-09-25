import type { Express } from 'express';
import request from 'supertest';
import { buildTestApp } from './helpers/testApp';

async function registerAndLogin(app: Express, email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  return res.body.token as string;
}

describe('tasks routes', () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    app = buildTestApp();
    token = await registerAndLogin(app, 'ada@example.com');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('creates and lists tasks ordered by position', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First task' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second task' });

    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.map((t: { title: string }) => t.title)).toEqual([
      'First task',
      'Second task',
    ]);
    expect(res.body[0].completed).toBe(false);
  });

  it('rejects creating a task with an empty title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '  ' });

    expect(res.status).toBe(400);
  });

  it('gets, updates, and deletes a single task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy milk', description: 'Whole milk' });
    const taskId = created.body.id;

    const fetched = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe('Buy milk');

    const updated = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy oat milk', description: 'Whole milk', completed: true });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('Buy oat milk');
    expect(updated.body.completed).toBe(true);

    const deleted = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(afterDelete.status).toBe(404);
  });

  it('returns 404 for a task belonging to another user', async () => {
    const otherToken = await registerAndLogin(app, 'grace@example.com');
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Private task' });

    const res = await request(app)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it('searches tasks by title or description', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy milk' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Walk the dog', description: 'take the milk bone treats' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Read a book' });

    const res = await request(app)
      .get('/api/tasks?search=milk')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.map((t: { title: string }) => t.title)).toEqual([
      'Buy milk',
      'Walk the dog',
    ]);
  });

  it('reorders tasks', async () => {
    const first = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First' });
    const second = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second' });

    const res = await request(app)
      .patch('/api/tasks/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: [second.body.id, first.body.id] });

    expect(res.status).toBe(200);
    expect(res.body.map((t: { id: string }) => t.id)).toEqual([second.body.id, first.body.id]);
  });

  it('rejects reordering with a mismatched id set', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First' });

    const res = await request(app)
      .patch('/api/tasks/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: ['does-not-exist'] });

    expect(res.status).toBe(400);
  });
});
