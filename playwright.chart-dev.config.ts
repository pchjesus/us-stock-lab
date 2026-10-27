import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'chart-lab.spec.ts',testIgnore:[],outputDir:'test-results/chart-dev',use:{...base.use,baseURL:'http://127.0.0.1:4175'},webServer:{command:'npm run dev -- --port 4175 --strictPort',port:4175,reuseExistingServer:false}});
