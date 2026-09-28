/** Checks stable list ordering and entry-level filter semantics. */
import { beforeEach, expect, it } from 'vitest';
import request from 'supertest';
import { makeSubmission, makeTestApp, TEST_API_KEY } from './helpers';
import type { Submission } from '../src/schema';

let app: ReturnType<typeof makeTestApp>['app'];
beforeEach(async () => {
  app = makeTestApp().app;
  const entry = { ...makeSubmission('x').incidents[0], attackType: 'tool-use-exploit', surface: 'vision' };
  for (const submission of [makeSubmission('inc-b', [entry]), makeSubmission('inc-a')]) {
    await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission).expect(201);
  }
});
async function ids(query = '') {
  const response = await request(app).get('/incidents' + query).set('x-api-key', TEST_API_KEY).expect(200);
  return (response.body as Submission[]).map(submission => submission.id);
}
it('lists every submission in insertion order', async () => {
  expect(await ids()).toEqual(['inc-b', 'inc-a']);
});
it('filters by comma-separated attackType values, case-insensitively', async () => {
  expect(await ids('?attackType=JAILBREAK,tool-use-exploit')).toEqual(['inc-b', 'inc-a']);
  expect(await ids('?attackType=prompt-injection')).toEqual(['inc-a']);
});
it('accepts repeated query parameters as multiple values', async () => {
  expect(await ids('?surface=vision&surface=agent')).toEqual(['inc-b', 'inc-a']);
});
it('requires one entry to match every filter given', async () => {
  expect(await ids('?attackType=jailbreak&surface=chat')).toEqual([]);
  expect(await ids('?attackType=jailbreak&surface=agent')).toEqual(['inc-a']);
});
