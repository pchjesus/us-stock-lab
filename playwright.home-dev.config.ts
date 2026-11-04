import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'home-fixture.spec.ts',testIgnore:[],outputDir:'test-results/home-dev',use:{...base.use,baseURL:'http://127.0.0.1:4177'},webServer:{command:'npm run dev -- --port 4177 --strictPort',port:4177,reuseExistingServer:false}});
