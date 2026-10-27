import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'company-fixture.spec.ts',testIgnore:[],outputDir:'test-results/company-dev',use:{...base.use,baseURL:'http://127.0.0.1:4176'},webServer:{command:'npm run dev -- --port 4176 --strictPort',port:4176,reuseExistingServer:false}});
