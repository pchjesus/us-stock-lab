import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'server-replay.spec.ts',outputDir:'/tmp/us-stock-finance-replay-results',workers:1});
