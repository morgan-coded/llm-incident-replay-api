/** Verifies authentication covers routes and hides framework headers. */
import { expect, it } from 'vitest';
import request from 'supertest';
import { makeTestApp, TEST_API_KEY } from './helpers';

it('rejects a request with no x-api-key with 401 UNAUTHORIZED', async () => {
  const { app } = makeTestApp();
  const response = await request(app).get('/incidents');
  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});
it('rejects a wrong x-api-key with 401 UNAUTHORIZED', async () => {
  const { app } = makeTestApp();
  const response = await request(app).get('/incidents').set('x-api-key', 'wrong');
  expect(response.status).toBe(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});
it('returns 404 NOT_FOUND JSON for an unknown route with a valid key', async () => {
  const { app } = makeTestApp();
  const response = await request(app).get('/unknown').set('x-api-key', TEST_API_KEY);
  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
  expect((await request(app).get('/unknown')).status).toBe(401);
});
it('does not send x-powered-by', async () => {
  const { app } = makeTestApp();
  const response = await request(app).get('/incidents').set('x-api-key', TEST_API_KEY);
  expect(response.headers['x-powered-by']).toBeUndefined();
});
