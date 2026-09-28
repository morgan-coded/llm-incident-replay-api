/** Verifies per-submission history remains isolated and ordered. */
import { expect, it } from 'vitest';
import request from 'supertest';
import { makeSubmission, makeTestApp, TEST_API_KEY } from './helpers';

it('lists replay attempts for an id oldest first and 404s an unknown id', async () => {
  const { app, store } = makeTestApp();
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(makeSubmission('history')).expect(201);
  const entries = [
    { incidentId: 'history', timestamp: '2026-09-27T22:40:00Z' },
    { incidentId: 'history', timestamp: '2026-09-27T22:41:00Z' },
  ];
  store.appendReplay(entries[0]);
  store.appendReplay({ incidentId: 'other', timestamp: '2026-09-27T22:40:30Z' });
  store.appendReplay(entries[1]);
  const response = await request(app).get('/incidents/history/replays').set('x-api-key', TEST_API_KEY);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(entries);
  const missing = await request(app).get('/incidents/unknown/replays').set('x-api-key', TEST_API_KEY);
  expect(missing.status).toBe(404);
  expect(missing.body.error.code).toBe('NOT_FOUND');
});
