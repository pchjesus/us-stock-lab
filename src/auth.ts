import {createClient,type SupabaseClient} from '@supabase/supabase-js';
export interface AuthConfig {url:string;key:string}
// Reject server-only keys before ever initializing a browser client.
export function authConfig(url:unknown,key:unknown):AuthConfig|null {
 if(typeof url!=='string'||typeof key!=='string'||!url||!key)return null;
 try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)return null;
 if(key.startsWith('sb_publishable_')&&key.length>25&&!key.includes('REPLACE'))return {url:parsed.origin,key};
 const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role==='anon'&&key.split('.').length===3)return {url:parsed.origin,key};
 }catch{/* Invalid configuration is a disabled integration, never a broken app. */}return null;
}
let client:SupabaseClient|null=null;
export function getAuthClient():SupabaseClient|null {
 if(client)return client;
 const env=import.meta.env;const config=authConfig(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_ANON_KEY);
 if(!config)return null;
 client=createClient(config.url,config.key,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000)})}});return client;
}
