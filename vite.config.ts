import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,'.','VITE_');
 for(const key of [env.VITE_SUPABASE_PUBLISHABLE_KEY,env.VITE_SUPABASE_ANON_KEY].filter(Boolean)){
 let forbidden=key.startsWith('sb_secret_');
 try{const role=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role;if(role&&role!=='anon')forbidden=true;}catch{/* Non-JWT publishable keys are supported. */}
 if(forbidden)throw new Error('Server-only Supabase keys must never be included in a browser build. Use a publishable/anon key.');
 }
 return {plugins:[react()],base:'./'};
});
