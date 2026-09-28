/** Authenticates all requests using fixed-length digests for safe comparison. */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { sendError } from './errors';

export function requireApiKey(apiKey: string): RequestHandler {
  const expected = createHash('sha256').update(apiKey).digest();
  return (req, res, next) => {
    const supplied = req.get('x-api-key');
    if (supplied === undefined || !timingSafeEqual(expected, createHash('sha256').update(supplied).digest())) {
      sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid x-api-key header');
      return;
    }
    next();
  };
}
