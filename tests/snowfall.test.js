import test from 'node:test';
import assert from 'node:assert/strict';
import {crystalGeometry,particlePosition} from '../src/snowfall.js';

test('dendrite has physical millimetre dimensions and sixfold geometry',()=>{
 const g=crystalGeometry(),p=g.attributes.position,n=g.attributes.normal;
 const quantize=(x,y,z)=>[x,y,z].map(v=>Math.round(v*1e8)).join(',');
 const vertices=new Set(Array.from({length:p.count},(_,i)=>quantize(p.getX(i),p.getY(i),p.getZ(i))));
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  assert.ok(Math.hypot(x,y)<=.00301);assert.ok(Math.abs(z)<=.000013);
  assert.ok(vertices.has(quantize(x*.5-y*Math.sqrt(3)/2,x*Math.sqrt(3)/2+y*.5,z)));
  assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);
 }
 g.dispose();
});
test('nearby crystals retain world position as the viewer translates',()=>{
 const seed=[1,2,3,.3],a=particlePosition(seed,2,[0,0,0]),b=particlePosition(seed,2,[.1,-.2,.3]);
 for(let i=0;i<3;i++)assert.ok(Math.abs(a[i]-b[i])<1e-12);
 assert.ok(particlePosition(seed,2.1,[0,0,0])[1]<a[1]);
 const wrapped=particlePosition(seed,100,[80,48,-90]);
 for(let i=0;i<3;i++)assert.ok(Math.abs(wrapped[i]-[80,48,-90][i])<=7);
});
