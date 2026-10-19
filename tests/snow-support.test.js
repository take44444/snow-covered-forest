import test from 'node:test';
import assert from 'node:assert/strict';
import {supportedArea,hasOverheadFoliage,capField,ambientVisibility,smoothVisibility} from '../scripts/snow-support.mjs';

test('vertical twigs cannot support the same snow load as spreading foliage',()=>{
 const res=17,index=(x,y,z)=>x+res*(y+res*z),density=new Uint8Array(res**3);
 for(let y=0;y<res;y++)density[index(8,y,8)]=30;
 assert.ok(supportedArea(density,index,8,8,8,4)<.22);
 for(let z=4;z<=12;z++)for(let x=4;x<=12;x++)density[index(x,8,z)]=3;
 assert.ok(supportedArea(density,index,8,8,8,4)>.9);
});

test('upper foliage shields the inner layers of the same branch cluster',()=>{
 const res=17,index=(x,y,z)=>x+res*(y+res*z),density=new Uint8Array(res**3);density[index(8,11,8)]=3;
 assert.equal(hasOverheadFoliage(density,index,8,8,8,5),true);
 assert.equal(hasOverheadFoliage(density,index,8,3,8,5),false);
 assert.equal(hasOverheadFoliage(density,index,8,11,8,5),false);
});
test('retained snow has a thin base and a rounded, thicker top',()=>{
 assert.equal(capField(0,-.02,.12),0);assert.equal(capField(0,.13,.12),0);
 assert.ok(capField(0,.06,.12)>20);assert.ok(capField(.5,.06,.12)>20);
 assert.equal(capField(1,.06,.12),0);
 assert.ok(capField(0,.1,.12)>capField(.8,.1,.12));
});

test('ambient visibility distinguishes an open surface from a narrow cavity',()=>{
 assert.equal(ambientVisibility(0,0,0,0,1,0,(x,y,z)=>y<0),1);
 const cavity=ambientVisibility(0,0,0,0,1,0,(x,y,z)=>Math.hypot(x,y,z)>.1);
 assert.ok(cavity<=.3);
 for(const n of [[1,0,0],[0,-1,0],[0,0,1]])assert.ok(Number.isFinite(ambientVisibility(0,0,0,...n,()=>false)));
});

test('visibility smoothing softens isolated samples without crossing disconnected surfaces',()=>{
 const indices=new Uint32Array([0,1,2,3,4,5]),values=new Float32Array([1,.2,1,.4,.4,.4]),smooth=smoothVisibility(values,indices);
 assert.ok(smooth[1]>.2&&smooth[0]<1);assert.ok(Math.abs(smooth[0]-smooth[1])<.01);
 for(let i=3;i<6;i++)assert.ok(Math.abs(smooth[i]-.4)<1e-6);
});
