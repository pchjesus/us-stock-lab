import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['fx-enabled.check.ts'],testIgnore:[],outputDir:'test-results-fx',use:{...base.use,baseURL:'http://127.0.0.1:4175'},webServer:{command:'npm run preview -- --port 4175 --strictPort',port:4175,reuseExistingServer:false}});
