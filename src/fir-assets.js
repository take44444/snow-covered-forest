import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function decodeFirAssets(description,buffer){
 if(description.version!==1||buffer.byteLength!==description.byteLength)throw Error('The fir asset package is incomplete.');
 function attribute(data,Type){if(data.offset%4||data.offset+data.count*data.itemSize*4>buffer.byteLength)throw Error('Invalid fir geometry range');return new THREE.BufferAttribute(new Type(buffer,data.offset,data.count*data.itemSize),data.itemSize);}
 function geometry(part){const g=new THREE.BufferGeometry();g.setAttribute('position',attribute(part.position,Float32Array));g.setAttribute('normal',attribute(part.normal,Float32Array));g.setAttribute('uv',attribute(part.uv,Float32Array));g.setIndex(attribute(part.indices,Uint32Array));g.computeBoundingBox();g.computeBoundingSphere();return g;}
 return description.variants.map(variant=>({profile:variant.profile,levels:variant.levels.map(parts=>{
  const meshes=Object.fromEntries(parts.map(p=>[p.name,geometry(p)])),woodParts=[meshes.trunk,meshes.branches,meshes.deadwood],wood=mergeGeometries(woodParts);woodParts.forEach(g=>g.dispose());wood.computeBoundingBox();wood.computeBoundingSphere();return {wood,foliage:meshes.foliage,snow:meshes.snow};
 })}));
}
export async function loadFirAssets(manager){
 const description=await new THREE.FileLoader(manager).setRequestHeader({'Cache-Control':'no-cache'}).setResponseType('json').loadAsync('/models/fir/forest.json');
 const chunks=await Promise.all(description.bufferChunks.map(c=>new THREE.FileLoader(manager).setResponseType('arraybuffer').loadAsync('/models/fir/'+c.uri+'?v='+c.sha256.slice(0,12))));
 const data=new Uint8Array(description.byteLength);let offset=0;for(let i=0;i<chunks.length;i++){if(chunks[i].byteLength!==description.bufferChunks[i].byteLength)throw Error('Incomplete fir geometry chunk');data.set(new Uint8Array(chunks[i]),offset);offset+=chunks[i].byteLength;}const buffer=data.buffer;
 return decodeFirAssets(description,buffer);
}
