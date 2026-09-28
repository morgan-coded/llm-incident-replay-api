/** Validates environment configuration before a listener is created. */
export const DEFAULT_PORT = 4000;
export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export function loadConfig(env: NodeJS.ProcessEnv): { apiKey: string; port: number } {
  const apiKey = env.API_KEY;
  if (!apiKey?.trim()) throw new Error('API_KEY is required');
  const port = env.PORT === undefined ? DEFAULT_PORT : Number(env.PORT);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return { apiKey, port };
}
