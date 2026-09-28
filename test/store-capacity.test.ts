/** Ensures storage pressure rejects new ids without replacing existing records. */
import { expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { createMemoryStore } from '../src/store';
import { dummyReplayer } from '../src/replayer';
import { makeSubmission, TEST_API_KEY } from './helpers';

it('rejects a new submission with 507 STORE_FULL when the store is at capacity', async () => {
  const store = createMemoryStore(1);
  const app = createApp({ apiKey: TEST_API_KEY, store, replayer: dummyReplayer });
  const first = makeSubmission('first');
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(first).expect(201);
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(makeSubmission('second'));
  expect(response.status).toBe(507);
  expect(response.body.error.code).toBe('STORE_FULL');
  expect(store.list()).toEqual([first]);
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(first).expect(409);
});
