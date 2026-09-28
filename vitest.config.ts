/** Restricts discovery to this checkout's tests, excluding nested clean clones. */
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['test/**/*.test.ts'] } });
