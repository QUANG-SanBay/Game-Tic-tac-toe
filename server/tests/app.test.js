// HTTP endpoint test với supertest
import request from 'supertest';
import app from '../src/app.js';

describe('HTTP API', () => {
  test('GET / returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
