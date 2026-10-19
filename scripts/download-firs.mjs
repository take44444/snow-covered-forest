import fs from 'node:fs';
import https from 'node:https';
import {pipeline} from 'node:stream/promises';
const directory=process.env.FIR_SOURCE_DIR||'.cache/fir';fs.mkdirSync(directory,{recursive:true});
const origin='https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/fir_tree_01/';
async function download(remote,file,expected){
 const destination=directory+'/'+file,start=expected&&fs.existsSync(destination)?fs.statSync(destination).size:0;if(start===expected){console.log('Source already complete:',file);return;}
 const response=await new Promise((resolve,reject)=>{https.get(origin+remote,{headers:start?{Range:`bytes=${start}-`}:{}},res=>{if(![200,206].includes(res.statusCode)){res.resume();reject(Error(`Source HTTP ${res.statusCode}`));}else resolve(res);}).on('error',reject);});
 await pipeline(response,fs.createWriteStream(destination,{flags:response.statusCode===206?'a':'w'}));
 if(expected&&fs.statSync(destination).size!==expected)throw Error('Incomplete fir source; rerun to resume.');console.log('Downloaded',file);
}
await download('fir_tree_01_1k.gltf','fir.gltf');const manifest=JSON.parse(fs.readFileSync(directory+'/fir.gltf','utf8'));await download(manifest.buffers[0].uri,'fir.bin',manifest.buffers[0].byteLength);
