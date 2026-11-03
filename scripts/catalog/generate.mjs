import {readFile,writeFile} from 'node:fs/promises';
import {normalizeSec} from '../../src/catalog.ts';
const [input,output,checkedAt,sourceDate]=process.argv.slice(2);
if(!input||!output||!checkedAt||!sourceDate){console.error('Usage: node scripts/catalog/generate.mjs INPUT OUTPUT CHECKED_AT SOURCE_DATE|unknown');process.exit(2);}
try {
 const raw=JSON.parse(await readFile(input,'utf8'));
 const result=normalizeSec(raw,checkedAt,sourceDate==='unknown'?null:sourceDate);
 await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(result.counts));
} catch(e){console.error('Catalog generation failed:',e.message);process.exitCode=1;}
