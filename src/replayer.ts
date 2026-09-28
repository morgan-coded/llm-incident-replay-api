/** Provides an injectable replay boundary with a deterministic local dummy. */
import type { IncidentEntry } from './schema';

export const REPLAY_MESSAGE_PREFIX = 'Replay complete: simulated response for prompt: ';
export interface Replayer { replay(entry: IncidentEntry): Promise<string> }
export const dummyReplayer: Replayer = {
  async replay(entry) { return REPLAY_MESSAGE_PREFIX + entry.prompt; },
};
