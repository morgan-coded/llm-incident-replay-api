/** Composes authenticated incident routes and a uniform JSON error boundary. */
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { requireApiKey } from './auth';
import { sendError, zodIssuesToDetails } from './errors';
import { matchesFilters, parseFilterValues } from './filters';
import type { Replayer } from './replayer';
import { submissionSchema, type ReplayResult } from './schema';
import type { IncidentStore } from './store';

export const JSON_BODY_LIMIT = '100kb';
export function createApp(deps: { apiKey: string; store: IncidentStore; replayer: Replayer }): Express {
  if (!deps.apiKey.trim()) throw new Error('API_KEY is required');
  const { store, replayer } = deps;
  const app = express();
  app.disable('x-powered-by');
  app.use(requireApiKey(deps.apiKey));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.post('/incidents', (req, res) => {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Request body failed validation', zodIssuesToDetails(parsed.error.issues));
      return;
    }
    const result = store.add(parsed.data);
    if (result === 'duplicate') {
      sendError(res, 409, 'DUPLICATE_ID', 'A submission with this id already exists');
      return;
    }
    res.status(201).json(parsed.data);
  });
  app.get('/incidents', (req, res) => {
    const filters = { attackTypes: parseFilterValues(req.query.attackType), surfaces: parseFilterValues(req.query.surface) };
    res.json(store.list().filter(submission => matchesFilters(submission, filters)));
  });
  app.get('/incidents/:id', (req, res) => {
    const submission = store.get(req.params.id);
    if (!submission) { sendError(res, 404, 'NOT_FOUND', 'Incident not found'); return; }
    res.json(submission);
  });
  app.post('/incidents/:id/replay', async (req, res) => {
    const submission = store.get(req.params.id);
    if (!submission) { sendError(res, 404, 'NOT_FOUND', 'Incident not found'); return; }
    const results: ReplayResult[] = [];
    for (const [index, entry] of submission.incidents.entries()) {
      const simulatedResponse = await replayer.replay(entry);
      results.push({ index, attackType: entry.attackType, llmModel: entry.llmModel, prompt: entry.prompt, simulatedResponse });
    }
    const replayedAt = new Date().toISOString();
    store.appendReplay({ incidentId: submission.id, timestamp: replayedAt });
    res.json({ incidentId: submission.id, replayedAt, results });
  });
  app.use((_req, res) => { sendError(res, 404, 'NOT_FOUND', 'Route not found'); });
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (typeof err === 'object' && err !== null && 'type' in err) {
      if (err.type === 'entity.parse.failed') { sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON'); return; }
      if (err.type === 'entity.too.large') { sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 100kb'); return; }
    }
    console.error(err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  });
  return app;
}
