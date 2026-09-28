/** Exercises submission validation, uniqueness, and retrieval through HTTP. */
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import request from 'supertest';
import { makeSubmission, makeTestApp, TEST_API_KEY } from './helpers';

it('creates a submission and returns 201 with the stored record', async () => {
  const { app } = makeTestApp();
  const submission = makeSubmission('one');
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
  expect(response.status).toBe(201);
  expect(response.body).toEqual(submission);
});
it('accepts the bundled examples/incident.json', async () => {
  const { app } = makeTestApp();
  const submission = JSON.parse(readFileSync(new URL('../examples/incident.json', import.meta.url), 'utf8'));
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
  expect(response.status).toBe(201);
  expect(response.body).toEqual(submission);
});
it('rejects a duplicate id with 409 DUPLICATE_ID and keeps the first record', async () => {
  const { app } = makeTestApp();
  const first = makeSubmission('same');
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(first).expect(201);
  const second = makeSubmission('same');
  second.incidents[0].actualResponse = 'Changed';
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(second);
  expect(response.status).toBe(409);
  expect(response.body.error.code).toBe('DUPLICATE_ID');
  expect((await request(app).get('/incidents/same').set('x-api-key', TEST_API_KEY)).body).toEqual(first);
});
it('rejects an invalid submission with 400 VALIDATION_ERROR and field paths', async () => {
  const { app } = makeTestApp();
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send({ id: 'x', submissionTimestamp: 'yesterday', incidents: [] });
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.body.error.details).toEqual(expect.arrayContaining([
    expect.objectContaining({ path: 'submissionTimestamp' }), expect.objectContaining({ path: 'incidents' }),
  ]));
  await request(app).get('/incidents/x').set('x-api-key', TEST_API_KEY).expect(404);
});
it('reports the nested path of a missing entry field', async () => {
  const { app } = makeTestApp();
  const submission = makeSubmission('missing');
  const { prompt, ...entry } = submission.incidents[0];
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send({ ...submission, incidents: [entry] });
  expect(response.status).toBe(400);
  expect(response.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'incidents.0.prompt' })]));
});
it('rejects unknown keys with 400 VALIDATION_ERROR', async () => {
  const { app } = makeTestApp();
  for (const submission of [
    { ...makeSubmission('unknown'), extra: true },
    { ...makeSubmission('unknown'), incidents: [{ ...makeSubmission('x').incidents[0], extra: true }] },
  ]) {
    const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  }
});
it('returns 400 INVALID_JSON for a malformed body without a stack trace', async () => {
  const { app } = makeTestApp();
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).set('content-type', 'application/json').send('{"id":');
  expect(response.status).toBe(400);
  expect(response.headers['content-type']).toContain('application/json');
  expect(response.body.error.code).toBe('INVALID_JSON');
  expect(response.text).not.toContain('<html');
  expect(response.text).not.toContain('    at ');
});
it('returns 413 PAYLOAD_TOO_LARGE for a body over the limit', async () => {
  const { app } = makeTestApp();
  const submission = makeSubmission('large');
  submission.incidents[0].prompt = 'x'.repeat(120000);
  const response = await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
  expect(response.status).toBe(413);
  expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
});
it('returns 404 NOT_FOUND for an unknown id and 200 for a stored one', async () => {
  const { app } = makeTestApp();
  const missing = await request(app).get('/incidents/absent').set('x-api-key', TEST_API_KEY);
  expect(missing.status).toBe(404);
  expect(missing.body.error.code).toBe('NOT_FOUND');
  const submission = makeSubmission('present');
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
  const found = await request(app).get('/incidents/present').set('x-api-key', TEST_API_KEY);
  expect(found.status).toBe(200);
  expect(found.body).toEqual(submission);
});
