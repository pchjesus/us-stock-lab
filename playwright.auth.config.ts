import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,outputDir:'test-results-auth',testMatch:['auth.spec.ts','server-hours.spec.ts','manual-ui.spec.ts','dividend-ui.spec.ts'],testIgnore:[],use:{...base.use,baseURL:'http://127.0.0.1:4174'},webServer:{command:'npm run dev -- --port 4174 --strictPort',port:4174,reuseExistingServer:false,env:{VITE_SUPABASE_URL:'https://auth-test.invalid',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_fixture_not_a_real_key'}}});
