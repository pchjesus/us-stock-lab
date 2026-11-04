import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',build:{outDir:'dist-ux0',rollupOptions:{input:'prototype/ux0.html'}}});
