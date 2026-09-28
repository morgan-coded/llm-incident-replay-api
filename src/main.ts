/** Loads local configuration and owns the service's listener lifecycle. */
import { existsSync } from 'node:fs';
import { createApp } from './app';
import { loadConfig } from './config';
import { dummyReplayer } from './replayer';
import { createMemoryStore } from './store';

try {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const { apiKey, port } = loadConfig(process.env);
  const app = createApp({ apiKey, store: createMemoryStore(), replayer: dummyReplayer });
  const server = app.listen(port);
  server.on('listening', () => console.log('llm-incident-replay-api listening on port ' + port));
  server.on('error', (error: Error) => { console.error(error.message); process.exit(1); });
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : 'Startup failed');
  process.exit(1);
}
