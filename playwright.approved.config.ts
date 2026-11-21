import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'approved-ui.spec.ts',testIgnore:[],outputDir:'test-results-approved-ui'});
