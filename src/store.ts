/** Stores submissions by id and successful replay attempts in insertion order. */
import type { ReplayLogEntry, Submission } from './schema';

export type AddResult = 'created' | 'duplicate';
export interface IncidentStore {
  add(submission: Submission): AddResult;
  get(id: string): Submission | undefined;
  list(): Submission[];
  appendReplay(entry: ReplayLogEntry): void;
  listReplays(): ReplayLogEntry[];
}
export function createMemoryStore(): IncidentStore {
  const submissions = new Map<string, Submission>();
  const replays: ReplayLogEntry[] = [];
  return {
    add(submission) {
      if (submissions.has(submission.id)) return 'duplicate';
      submissions.set(submission.id, submission);
      return 'created';
    },
    get(id) { return submissions.get(id); },
    list() { return [...submissions.values()]; },
    appendReplay(entry) { replays.push(entry); },
    listReplays() { return [...replays]; },
  };
}
