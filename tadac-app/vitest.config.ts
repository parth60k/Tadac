import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config({ path: '.env' });
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL || ''
    },
    fileParallelism: false
  },
});
