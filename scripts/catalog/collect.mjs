import {collectSecSnapshot} from './collector.mjs';
if(process.argv.length!==2){console.error('Set SEC_USER_AGENT to your organization or developer name and real contact email, then run npm run catalog:collect.');process.exitCode=2;}
else try{
 const result=await collectSecSnapshot({root:'work/catalog-snapshots',userAgent:process.env.SEC_USER_AGENT});
 console.log(JSON.stringify(result));
}catch(error){console.error('SEC collection failed:',error.message);process.exitCode=1;}
