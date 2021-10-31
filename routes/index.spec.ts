import request from 'supertest';
import app from '../app';

describe('Index route', () => {
  it('returns a 200 status code', async () => {
    const response = await request(app)
      .get('/')
      .send();

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello world!');
  });
});
