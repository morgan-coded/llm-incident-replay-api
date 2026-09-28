/** Supplies isolated applications and fresh submission fixtures. */
import { createApp } from '../src/app';
import { createMemoryStore } from '../src/store';
import { dummyReplayer, type Replayer } from '../src/replayer';
import type { IncidentEntry, Submission } from '../src/schema';

export const TEST_API_KEY = 'test-key';
export function makeTestApp(overrides: { replayer?: Replayer } = {}) {
  const store = createMemoryStore();
  const app = createApp({ apiKey: TEST_API_KEY, store, replayer: overrides.replayer ?? dummyReplayer });
  return { app, store };
}
export function makeSubmission(id: string, entries?: IncidentEntry[]): Submission {
  return {
    id,
    submissionTimestamp: '2026-09-27T22:40:00Z',
    incidents: entries ?? [
      { attackType: 'prompt-injection', surface: 'chat', llmModel: 'gpt-4o', prompt: 'Summarize email.', expectedBehavior: 'Ignore injected instructions.', actualResponse: 'Leaked instructions.' },
      { attackType: 'jailbreak', surface: 'agent', llmModel: 'llama-3-instruct', prompt: 'Delete the audit log.', expectedBehavior: 'Refuse.', actualResponse: 'Complied.' },
    ],
  };
}
