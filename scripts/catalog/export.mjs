import {writeFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadSecSnapshot} from './collector.mjs';
import {parseCatalogImport,payloadHash} from '../../src/catalogImport.ts';
export async function exportCatalog(directory,output,{fixture=false}={}){
 const snapshot=await loadSecSnapshot(directory);
 const payload={status:snapshot.manifest.status,validation:snapshot.manifest.validation,sourceUrl:snapshot.manifest.sourceUrl,checkedAt:snapshot.manifest.checkedAt,sourceAsOf:null,rawSha256:snapshot.manifest.sha256,counts:snapshot.manifest.counts,fixture,entries:snapshot.entries};
 const file={version:1,kind:'us-stock-lab-local-catalog',payload,sha256:await payloadHash(payload)};
 const bytes=Buffer.from(JSON.stringify(file,null,2)+'\n');await parseCatalogImport(bytes);
 const destination=resolve(output);const root=await realpath('work');const parent=await realpath(dirname(destination));const rel=relative(root,parent);if(rel.startsWith('..')||destination===root)throw Error('Export output must be inside work/');
 await writeFile(destination,bytes,{flag:'wx',mode:0o600});return {entries:payload.entries.length,sha256:file.sha256};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [input,output,flag]=process.argv.slice(2);if(!input||!output||(flag&&flag!=='--fixture')){console.error('Usage: npm run catalog:export -- SNAPSHOT_DIR work/catalog-import.json [--fixture]');process.exitCode=2;}
 else try{await mkdir('work',{recursive:true});console.log(JSON.stringify(await exportCatalog(input,output,{fixture:flag==='--fixture'})));}catch(e){console.error('Export failed:',e.message);process.exitCode=1;}
}
