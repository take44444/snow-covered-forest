import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {decodeFirAssets} from '../src/fir-assets.js';
import {treeLodWeights,treeDistance,treeVisibility,TREE_CULL_DISTANCE} from '../src/tree-lod.js';
const description=JSON.parse(fs.readFileSync(new URL('../public/models/fir/forest.json',import.meta.url))),binary=Buffer.concat(description.bufferChunks.map(c=>{const b=fs.readFileSync(new URL('../public/models/fir/'+c.uri,import.meta.url));assert.equal(b.length,c.byteLength);assert.ok(b.length<=8*1024*1024);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),c.sha256);return b;}));
const variants=decodeFirAssets(description,binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength));
test('fir package matches its checked-in provenance and integrity metadata',()=>{
 assert.equal(description.source,'https://polyhaven.com/a/fir_tree_01');assert.equal(description.license,'CC0-1.0');assert.equal(binary.length,description.byteLength);assert.equal(crypto.createHash('sha256').update(binary).digest('hex'),description.sha256);assert.equal(variants.length,3);
});
test('tree detail levels retain source vertex positions rather than regenerate branches',()=>{
 for(const variant of variants)for(const part of ['wood','foliage','snow']){
  let previous;
  for(const level of variant.levels){
   const g=level[part],p=g.attributes.position,points=new Set();assert.ok(g.index.count>0);assert.ok(g.boundingBox.max.y<16.8);assert.ok(g.boundingBox.min.y>-.1);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok(Number.isFinite(x+y+z));const key=`${x},${y},${z}`;if(previous)assert.ok(previous.has(key),`${part} LOD moved a source vertex`);points.add(key);}
   assert.ok(Array.from(g.attributes.normal.array).every(Number.isFinite));previous=points;
  }
 }
});
test('canopy carries bounded ambient visibility through every detail level',()=>{
 for(const variant of variants)for(const level of variant.levels){
  const uv=level.snow.attributes.uv;let shaded=0,open=0;
  for(let i=0;i<uv.count;i++){const value=uv.getX(i);assert.ok(value>=.19&&value<=1);if(value<.8)shaded++;if(value>.9)open++;}
  assert.ok(shaded>uv.count*.01,'cavities need occlusion');assert.ok(open>uv.count*.01,'open caps need ambient light');
 }
});
test('crossfade covers every distance continuously with complementary detail levels',()=>{
 let previous=treeLodWeights(0);
 for(let d=0;d<200;d+=.01){const weights=treeLodWeights(d);assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-10);weights.forEach((w,i)=>{assert.ok(w>=0&&w<=1);assert.ok(Math.abs(w-previous[i])<.006);});previous=weights;}
 assert.deepEqual(treeLodWeights(0),[1,0,0]);assert.deepEqual(treeLodWeights(25),[0,1,0]);assert.deepEqual(treeLodWeights(60),[0,0,1]);
});
test('camera height above a crown affects detail selection',()=>{
 const tree={x:0,z:0,y:0,height:16};assert.equal(treeDistance(tree,{x:0,y:65,z:0}),49);assert.equal(treeDistance(tree,{x:0,y:10,z:0}),0);
});

test('distant visibility fades before the surrounding forest can end',()=>{
 assert.equal(treeVisibility(119),1);assert.equal(treeVisibility(TREE_CULL_DISTANCE),0);let previous=1;for(let d=120;d<=155;d+=.1){const v=treeVisibility(d);assert.ok(v<=previous&&v>=0);previous=v;}assert.ok(260-100>TREE_CULL_DISTANCE);
});
