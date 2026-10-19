import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {mossGeometry,lichenGeometry,leafGeometry,icicleGeometry,rockGeometry} from '../src/ground-geometry.js';

test('dry leaves have a thin, curved centimetre-scale surface facing upward',()=>{
 const g=leafGeometry();g.computeBoundingBox();const size=g.boundingBox.getSize(new Vector3());
 assert.ok(size.x>.04&&size.x<.07);assert.ok(size.z>.1&&size.z<.12);assert.ok(size.y>.004&&size.y<.025);
 const n=g.attributes.normal;let upward=0;for(let i=0;i<n.count;i++)if(n.getY(i)>.5)upward++;
 assert.ok(upward/n.count>.8);g.dispose();
});
test('moss resolves millimetre shoots and retains its cushion at both detail levels',()=>{
 const high=mossGeometry(true),low=mossGeometry(false);high.computeBoundingBox();
 assert.ok(high.boundingBox.max.y>.01&&high.boundingBox.max.y<.03);
 assert.ok(high.boundingBox.max.x-high.boundingBox.min.x<.13);
 assert.ok(high.attributes.position.count>low.attributes.position.count);
 assert.deepEqual(Array.from(high.attributes.position.array.slice(0,low.attributes.position.array.length)),Array.from(low.attributes.position.array));
 high.dispose();low.dispose();
});
test('lichen lobes are small folded surfaces with finite normals',()=>{
 const g=lichenGeometry(true);g.computeBoundingBox();assert.ok(g.boundingBox.max.y-g.boundingBox.min.y>.0015);assert.ok(g.boundingBox.max.y<.015);
 assert.ok(Array.from(g.attributes.normal.array).every(Number.isFinite));g.dispose();
});
test('icicles taper downward with outward normals for correct refraction',()=>{
 const length=.22,radius=.014,g=icicleGeometry(length,radius,42);g.computeBoundingBox();
 assert.ok(Math.abs(g.boundingBox.min.y+length)<1e-6);assert.ok(Math.abs(g.boundingBox.max.y)<1e-6);
 const p=g.attributes.position,n=g.attributes.normal;let count=0;
 for(let i=0;i<p.count;i++){
  const t=-p.getY(i)/length;if(t<.1||t>.8)continue;
  const radial=new Vector3(p.getX(i)-Math.sin(t*2)*radius*.2,0,p.getZ(i)).normalize(),normal=new Vector3().fromBufferAttribute(n,i);
  assert.ok(normal.dot(radial)>.8);count++;
 }
 assert.ok(count>30);g.dispose();
});
test('irregular rocks have smooth, finite surface normals',()=>{
 const g=rockGeometry();g.computeBoundingSphere();assert.ok(g.boundingSphere.radius>.9&&g.boundingSphere.radius<1.2);
 assert.ok(Array.from(g.attributes.normal.array).every(Number.isFinite));g.dispose();
});
