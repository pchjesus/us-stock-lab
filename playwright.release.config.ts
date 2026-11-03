import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'release-candidate.spec.ts',testIgnore:[],outputDir:'test-results-release',projects:[base.projects![0]],use:{...base.use,baseURL:'http://127.0.0.1:4175'},webServer:{command:'npm run preview -- --port 4175 --strictPort',port:4175,reuseExistingServer:false}});
