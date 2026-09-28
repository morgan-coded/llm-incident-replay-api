/** Defines the validated submission contract and shared replay types. */
import { z } from 'zod';

export const MAX_ID_LENGTH = 128;
export const ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
export const MAX_LABEL_LENGTH = 64;
export const MAX_TEXT_LENGTH = 10000;
export const MIN_INCIDENTS_PER_SUBMISSION = 1;
export const MAX_INCIDENTS_PER_SUBMISSION = 100;

const label = z.string().trim().min(1).max(MAX_LABEL_LENGTH);
const text = z.string().trim().min(1).max(MAX_TEXT_LENGTH);
export const incidentEntrySchema = z.strictObject({
  attackType: label,
  surface: label,
  llmModel: label,
  prompt: text,
  payload: z.string().max(MAX_TEXT_LENGTH).optional(),
  expectedBehavior: text,
  actualResponse: text,
  notes: z.string().max(MAX_TEXT_LENGTH).optional(),
});
export const submissionSchema = z.strictObject({
  id: z.string().trim().min(1).max(MAX_ID_LENGTH).regex(ID_PATTERN),
  submissionTimestamp: z.iso.datetime({ offset: true }),
  incidents: z.array(incidentEntrySchema).min(MIN_INCIDENTS_PER_SUBMISSION).max(MAX_INCIDENTS_PER_SUBMISSION),
});
export type IncidentEntry = z.output<typeof incidentEntrySchema>;
export type Submission = z.output<typeof submissionSchema>;
export type ReplayLogEntry = { incidentId: string; timestamp: string };
export type ReplayResult = {
  index: number;
  attackType: string;
  llmModel: string;
  prompt: string;
  simulatedResponse: string;
};
