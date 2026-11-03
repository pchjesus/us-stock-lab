import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'prototype',testMatch:'ux0.spec.ts',outputDir:'test-results-ux0',use:{baseURL:'http://127.0.0.1:4180',launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}},webServer:{command:'npx vite --config vite.ux0.config.ts --host 127.0.0.1 --port 4180 --strictPort',port:4180,reuseExistingServer:false}});
