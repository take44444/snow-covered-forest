import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {MeshoptSimplifier} from 'meshoptimizer';
const dir=process.env.FIR_SOURCE_DIR||'.cache/fir';
const gltf=JSON.parse(fs.readFileSync(`${dir}/fir.gltf`,'utf8')),buffer=fs.readFileSync(`${dir}/fir.bin`);
if(buffer.length!==gltf.buffers[0].byteLength)throw Error('Incomplete fir source buffer');
await MeshoptSimplifier.ready;
function accessor(id){
 const a=gltf.accessors[id],view=gltf.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],types={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5122:Int16Array,5121:Uint8Array},Type=types[a.componentType],offset=buffer.byteOffset+(view.byteOffset||0)+(a.byteOffset||0);
 if(!Type||view.byteStride)throw Error('Unsupported source accessor');
 return {data:new Type(buffer.buffer,offset,a.count*size),size,count:a.count};
}
function sourcePart(p,scale){
 const pos=accessor(p.attributes.POSITION),n=accessor(p.attributes.NORMAL),uv=p.attributes.TEXCOORD_0===undefined?null:accessor(p.attributes.TEXCOORD_0),indices=accessor(p.indices).data;
 const position=new Float32Array(pos.data.length),normal=new Float32Array(n.data),texcoord=new Float32Array(pos.count*2);
 for(let i=0;i<pos.count;i++){position[i*3]=pos.data[i*3]*scale;position[i*3+1]=(pos.data[i*3+1]+.1)*scale;position[i*3+2]=pos.data[i*3+2]*scale;if(uv){texcoord[i*2]=uv.data[i*2];texcoord[i*2+1]=uv.data[i*2+1];}}
 return {position,normal,uv:texcoord,indices:new Uint32Array(indices)};
}
function snowSurface(positions,variant){
 const res=128,mc=new MarchingCubes(res,new THREE.MeshBasicMaterial(),false,false,1200000),density=new Uint8Array(res**3),field=mc.field;
 const bounds=new THREE.Box3();for(let i=0;i<positions.length;i+=3)bounds.expandByPoint(new THREE.Vector3(positions[i],positions[i+1],positions[i+2]));bounds.expandByScalar(.4);
 const size=bounds.getSize(new THREE.Vector3()),step=size.clone().divideScalar(res-1),index=(x,y,z)=>x+res*(y+res*z);
 for(let i=0;i<positions.length;i+=3){const x=Math.round((positions[i]-bounds.min.x)/step.x),y=Math.round((positions[i+1]-bounds.min.y)/step.y),z=Math.round((positions[i+2]-bounds.min.z)/step.z),k=index(x,y,z);if(density[k]<255)density[k]++;}
 let deposits=0;
 for(let z=2;z<res-2;z++)for(let x=2;x<res-2;x++)for(let y=2;y<res-3;y++){
  if(density[index(x,y,z)]<3||density[index(x,y+1,z)]>=3)continue;
  if(Math.sin(x*.12+z*.08+variant*2.3)*Math.cos(y*.12+variant)>.65)continue;
  const jitter=Math.sin(x*17.1+z*31.7+y*5.1+variant)*.5+.5,rx=.065+jitter*.05,ry=.055+jitter*.055,rz=rx;
  const gx=Math.ceil(rx/step.x),gy=Math.ceil(ry/step.y)+1,gz=Math.ceil(rz/step.z);
  for(let dz=-gz;dz<=gz;dz++)for(let dy=-gy;dy<=gy;dy++)for(let dx=-gx;dx<=gx;dx++){
   const xx=x+dx,yy=y+dy,zz=z+dz;if(xx<1||xx>=res-1||yy<1||yy>=res-1||zz<1||zz>=res-1)continue;
   const d=(dx*step.x/rx)**2+((dy*step.y-.035)/ry)**2+(dz*step.z/rz)**2;if(d>=1)continue;const k=index(xx,yy,zz);field[k]=Math.max(field[k],100*(1-d));
  }deposits++;
 }
 mc.isolation=20;mc.blur(.5);mc.update();if(mc.count/3>1200000)throw Error('Snow mesh exceeds preparation buffer');
 const g=new THREE.BufferGeometry(),p=mc.geometry.attributes.position.array.slice(0,mc.count*3),normal=mc.geometry.attributes.normal.array.slice(0,mc.count*3),uv=new Float32Array(mc.count*2);
 // MarchingCubes uses [-1,1] coordinates with cells spaced 2 / resolution.
 for(let i=0;i<p.length;i+=3){p[i]=bounds.min.x+(p[i]+1)*res*.5*step.x;p[i+1]=bounds.min.y+(p[i+1]+1)*res*.5*step.y;p[i+2]=bounds.min.z+(p[i+2]+1)*res*.5*step.z;}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(normal,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));const welded=mergeVertices(g,1e-4);welded.computeVertexNormals();g.dispose();mc.geometry.dispose();mc.material.dispose();
 console.log('Snow deposits',variant,deposits,'triangles',welded.index.count/3);
 return {position:welded.attributes.position.array,normal:welded.attributes.normal.array,uv:welded.attributes.uv.array,indices:new Uint32Array(welded.index.array)};
}
function detailedFoliage(part,budget){
 const n=part.position.length/3,parent=new Uint32Array(n),count=new Uint32Array(n),idx=part.indices;
 for(let i=0;i<n;i++)parent[i]=i;
 const root=a=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;};
 for(let i=0;i<idx.length;i+=3){const a=root(idx[i]),b=root(idx[i+1]),c=root(idx[i+2]);parent[b]=a;parent[c]=a;}
 for(let i=0;i<idx.length;i+=3)count[root(idx[i])]++;
 const hash=i=>{i=Math.imul(i^(i>>>16),0x7feb352d);i=Math.imul(i^(i>>>15),0x846ca68b);return (i^(i>>>16))>>>0;};
 const leaves=[];for(let i=0;i<n;i++)if(count[i]===4)leaves.push(i);leaves.sort((a,b)=>hash(a)-hash(b));
 const selected=new Uint8Array(n),limit=Math.min(leaves.length,Math.floor(budget*.8/4));for(let i=0;i<limit;i++)selected[leaves[i]]=1;
 const leafIndices=[],stems=[];
 for(let i=0;i<idx.length;i+=3){const r=root(idx[i]);if(selected[r])leafIndices.push(idx[i],idx[i+1],idx[i+2]);else if(count[r]>4)stems.push(idx[i],idx[i+1],idx[i+2]);}
 const stemIndices=simplify(part,new Uint32Array(stems),Math.floor(budget*.2),true),result=new Uint32Array(leafIndices.length+stemIndices.length);result.set(leafIndices);result.set(stemIndices,leafIndices.length);
 console.log('Whole source needle components retained',limit,'of',leaves.length);return result;
}
const chunks=[];let byteLength=0;
function writeArray(array,itemSize){const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),d={offset:byteLength,count:array.length/itemSize,itemSize};chunks.push(bytes);byteLength+=bytes.length;return d;}
function compactPart(source,indices){
 const copy=new Uint32Array(indices),[remap,count]=MeshoptSimplifier.compactMesh(copy),position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);
 for(let i=0;i<remap.length;i++){const dst=remap[i];if(dst===0xffffffff)continue;position.set(source.position.subarray(i*3,i*3+3),dst*3);normal.set(source.normal.subarray(i*3,i*3+3),dst*3);uv.set(source.uv.subarray(i*2,i*2+2),dst*2);}
 return {position,normal,uv,indices:copy};
}
function simplify(part,base,target,sloppy=false,error=.02){
 if(base.length<=target*3)return new Uint32Array(base);
 const [result]=sloppy?MeshoptSimplifier.simplifySloppy(base,part.position,3,null,target*3,.4):MeshoptSimplifier.simplify(base,part.position,3,target*3,error,['Prune','Permissive']);
 if(!result.length)throw Error('Empty reduced mesh');return result;
}
const variants=[];
for(let v=0;v<gltf.meshes.length;v++){
 console.log('Preparing fir',v);const mesh=gltf.meshes[v],foliagePrimitive=mesh.primitives.find(p=>gltf.materials[p.material].name.endsWith('_twig')),maxY=gltf.accessors[foliagePrimitive.attributes.POSITION].max[1],scale=16/(maxY+.1),parts=[];let foliage,trunk;
 for(const primitive of mesh.primitives){const material=gltf.materials[primitive.material].name,name=material.endsWith('_twig')?'foliage':material.includes('_trunk_')?'trunk':material.includes('dead_branches')?'deadwood':'branches',part=sourcePart(primitive,scale);parts.push({name,part});if(name==='foliage')foliage=part;if(name==='trunk')trunk=part;}
 parts.push({name:'snow',part:snowSurface(foliage.position,v)});
 const profile=Array.from({length:65},(_,i)=>({height:i*.25,radius:0}));for(let i=0;i<trunk.position.length;i+=3){const y=trunk.position[i+1],k=Math.max(0,Math.min(64,Math.round(y/.25)));profile[k].radius=Math.max(profile[k].radius,Math.hypot(trunk.position[i],trunk.position[i+2]));}
 for(let i=1;i<profile.length;i++)if(!profile[i].radius)profile[i].radius=profile[i-1].radius*.9;
 const levels=[[],[],[]],budgets={trunk:[24000,8000,1500],branches:[16000,4000,750],deadwood:[3000,1200,300],foliage:[200000,24000,3000],snow:[50000,16000,3000]};
 for(const {name,part} of parts){let current=part;for(let lod=0;lod<3;lod++){const indices=name==='foliage'&&lod===0?detailedFoliage(current,budgets[name][lod]):simplify(current,current.indices,budgets[name][lod],name==='foliage',name==='snow'?[.0008,.0025,.008][lod]:.01);current=compactPart(current,indices);levels[lod].push({name,position:writeArray(current.position,3),normal:writeArray(current.normal,3),uv:writeArray(current.uv,2),indices:writeArray(current.indices,1),triangles:current.indices.length/3});console.log('  ',name,lod,current.indices.length/3);}}
 variants.push({sourceHeight:maxY,normalizationScale:scale,profile,levels});
}
fs.mkdirSync('public/models/fir',{recursive:true});const output=Buffer.concat(chunks);const bufferChunks=[];for(let start=0,i=0;start<output.length;start+=8*1024*1024,i++){const chunk=output.subarray(start,start+8*1024*1024),uri=`forest-${i}.bin`;fs.writeFileSync('public/models/fir/'+uri,chunk);bufferChunks.push({uri,byteLength:chunk.length,sha256:crypto.createHash('sha256').update(chunk).digest('hex')});}
const description={version:1,source:'https://polyhaven.com/a/fir_tree_01',sourceSha256:crypto.createHash('sha256').update(buffer).digest('hex'),authors:['Rico Cilliers','Rob Tuytel'],license:'CC0-1.0',bufferChunks,byteLength:output.length,sha256:crypto.createHash('sha256').update(output).digest('hex'),variants};
fs.writeFileSync('public/models/fir/forest.json',JSON.stringify(description));console.log('Prepared forest assets',output.length,'bytes');
