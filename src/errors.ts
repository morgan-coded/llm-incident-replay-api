/** Centralizes public error envelopes and validation field paths. */
import type { Response } from 'express';
import type { z } from 'zod';

export type ErrorCode = 'VALIDATION_ERROR' | 'INVALID_JSON' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'DUPLICATE_ID' | 'PAYLOAD_TOO_LARGE' | 'STORE_FULL' | 'INTERNAL_ERROR';
type ErrorDetail = { path: string; message: string };
export function sendError(res: Response, status: number, code: ErrorCode, message: string, details?: ErrorDetail[]): void {
  res.status(status).json({ error: { code, message, ...(code === 'VALIDATION_ERROR' && details ? { details } : {}) } });
}
export function zodIssuesToDetails(issues: z.core.$ZodIssue[]): ErrorDetail[] {
  return issues.map(issue => ({ path: issue.path.length ? issue.path.join('.') : '(root)', message: issue.message }));
}
