import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

const { error } = dotenv.config({ path: '.env.test', override: true });
if (error) {
  throw error;
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
