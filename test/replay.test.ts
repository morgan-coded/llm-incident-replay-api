/** Checks deterministic replay results, logging, and failure isolation. */
import { expect, it, vi } from 'vitest';
import request from 'supertest';
import { makeSubmission, makeTestApp, TEST_API_KEY } from './helpers';

it('replays every entry with the fixed simulated response and logs the attempt', async () => {
  const { app, store } = makeTestApp();
  const submission = makeSubmission('replay');
  await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(submission);
  const response = await request(app).post('/incidents/replay/replay').set('x-api-key', TEST_API_KEY);
  expect(response.status).toBe(200);
  expect(response.body.incidentId).toBe('replay');
  expect(response.body.results).toEqual(submission.incidents.map((entry, index) => ({
    index, attackType: entry.attackType, llmModel: entry.llmModel, prompt: entry.prompt,
    simulatedResponse: 'Replay complete: simulated response for prompt: ' + entry.prompt,
  })));
  expect(Number.isNaN(Date.parse(response.body.replayedAt))).toBe(false);
  expect(store.listReplays()).toEqual([{ incidentId: 'replay', timestamp: response.body.replayedAt }]);
});
it('returns 404 for an unknown id and logs nothing', async () => {
  const { app, store } = makeTestApp();
  await request(app).post('/incidents/unknown/replay').set('x-api-key', TEST_API_KEY).expect(404);
  expect(store.listReplays()).toEqual([]);
});
it('returns 500 INTERNAL_ERROR without internals when the replayer fails', async () => {
  const { app, store } = makeTestApp({ replayer: { replay: async () => { throw new Error('boom'); } } });
  const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await request(app).post('/incidents').set('x-api-key', TEST_API_KEY).send(makeSubmission('fail'));
    const response = await request(app).post('/incidents/fail/replay').set('x-api-key', TEST_API_KEY);
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.text).not.toContain('boom');
    expect(store.listReplays()).toEqual([]);
    expect(stderr).toHaveBeenCalled();
  } finally { stderr.mockRestore(); }
});
