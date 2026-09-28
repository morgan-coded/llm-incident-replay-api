/** Stores submissions by id and successful replay attempts in insertion order. */
import type { ReplayLogEntry, Submission } from './schema';

export const MAX_STORED_SUBMISSIONS = 10000;
export type AddResult = 'created' | 'duplicate' | 'full';
export interface IncidentStore {
  add(submission: Submission): AddResult;
  get(id: string): Submission | undefined;
  list(): Submission[];
  appendReplay(entry: ReplayLogEntry): void;
  listReplays(): ReplayLogEntry[];
}
export function createMemoryStore(maxSubmissions = MAX_STORED_SUBMISSIONS): IncidentStore {
  const submissions = new Map<string, Submission>();
  const replays: ReplayLogEntry[] = [];
  return {
    add(submission) {
      if (submissions.has(submission.id)) return 'duplicate';
      if (submissions.size >= maxSubmissions) return 'full';
      submissions.set(submission.id, submission);
      return 'created';
    },
    get(id) { return submissions.get(id); },
    list() { return [...submissions.values()]; },
    appendReplay(entry) { replays.push(entry); },
    listReplays() { return [...replays]; },
  };
}
