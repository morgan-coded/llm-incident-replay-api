/** Checks fail-closed startup configuration. */
import { expect, it } from 'vitest';
import { loadConfig } from '../src/config';

it('refuses to load without a non-empty API_KEY', () => {
  expect(() => loadConfig({})).toThrow('API_KEY is required');
  expect(() => loadConfig({ API_KEY: '   ' })).toThrow('API_KEY is required');
});
it('defaults PORT to 4000 and rejects an invalid PORT', () => {
  expect(loadConfig({ API_KEY: 'key' }).port).toBe(4000);
  expect(loadConfig({ API_KEY: 'key', PORT: '3111' }).port).toBe(3111);
  for (const PORT of ['abc', '70000']) {
    expect(() => loadConfig({ API_KEY: 'key', PORT })).toThrow('PORT must be an integer between 1 and 65535');
  }
});
