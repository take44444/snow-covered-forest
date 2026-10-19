import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomGenerator,noise} from './world.js';
export const rockRadius=(v)=>.9+noise(v.x*4+12,v.z*4+v.y)*.22;
export function rockGeometry(){
 const source=new THREE.IcosahedronGeometry(1,8);const p=source.attributes.position;
 for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).normalize();v.multiplyScalar(rockRadius(v));p.setXYZ(i,v.x,v.y,v.z);}
 const g=mergeVertices(source);source.dispose();g.computeVertexNormals();return g;
}
function geometry(vertices,indices,colors,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
export function mossGeometry(detailed=true){
 const r=randomGenerator(155),v=[],idx=[],colors=[];
 function leaf(base,tip,width,color){
  const dir=tip.clone().sub(base),side=new THREE.Vector3(-dir.z,.08,dir.x).normalize().multiplyScalar(width),mid=base.clone().lerp(tip,.58).add(new THREE.Vector3(0,.0008,0));const n=v.length/3;
  for(const p of [base,mid.clone().add(side),tip,mid.clone().sub(side)]){v.push(...p.toArray());colors.push(...color.toArray());}idx.push(n,n+1,n+2,n,n+2,n+3);
 }
 // Tiny overlapping scales form a low, irregular cushion in both models.
 for(let i=0;i<180;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*.048,base=new THREE.Vector3(Math.cos(a)*d,.001+(.048-d)*.08,Math.sin(a)*d),tip=base.clone().add(new THREE.Vector3((r()-.5)*.012,.001+r()*.003,(r()-.5)*.012));leaf(base,tip,.0015+r()*.002,new THREE.Color().setHSL(0,0,.55+r()*.3));}
 if(detailed)for(let i=0;i<100;i++){
  const a=r()*Math.PI*2,d=Math.sqrt(r())*.043,base=new THREE.Vector3(Math.cos(a)*d,.002,Math.sin(a)*d),height=.005+r()*.012;
  for(let j=0;j<4;j++)for(let side=0;side<2;side++){const theta=a+j*2.4+side*Math.PI,stem=base.clone().add(new THREE.Vector3(0,height*j/4,0));const tip=stem.clone().add(new THREE.Vector3(Math.cos(theta)*.004,height*.27,Math.sin(theta)*.004));leaf(stem,tip,.00065,new THREE.Color().setHSL(0,0,.5+r()*.35));}
 }
 const shoots=geometry(v,idx,colors),bed=new THREE.SphereGeometry(.048,24,10,0,Math.PI*2,0,Math.PI*.5),bp=bed.attributes.position,bedColors=[];
 for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getZ(i),t=noise(x*150,z*150),height=bp.getY(i)*(.07+t*.04)-.0015;bp.setXYZ(i,x*(.65+t*.4),height,z*(.65+t*.4));bedColors.push(...new THREE.Color(.45+t*.25,.45+t*.25,.45+t*.25).toArray());}
 bed.deleteAttribute('uv');bed.setAttribute('color',new THREE.Float32BufferAttribute(bedColors,3));bed.computeVertexNormals();
 const g=mergeGeometries([bed,shoots]);bed.dispose();shoots.dispose();const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(.42+(p.getX(i)/.11+.5)*.17,.22+(p.getZ(i)/.11+.5)*.2);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;
}
export function lichenGeometry(detailed=true){
 const r=randomGenerator(517),v=[],idx=[],colors=[];
 const count=detailed?64:10,rows=detailed?8:4,cols=detailed?4:2;
 for(let i=0;i<count;i++){
  const a=r()*Math.PI*2,dist=r()*.02,length=.009+r()*.017,width=.003+r()*.004,n=v.length/3;
  for(let row=0;row<=rows;row++)for(let side=0;side<=cols;side++){
   const t=row/rows,s=side/cols*2-1,rad=dist+t*length,spread=width*Math.sin((t*.9+.05)*Math.PI)*(1+Math.sin(t*15+i)*.13);
   const x=Math.cos(a)*rad-Math.sin(a)*s*spread,z=Math.sin(a)*rad+Math.cos(a)*s*spread,y=.001+Math.sin(t*Math.PI)*.0015+Math.abs(s)*.0008*Math.sin(t*8+i);
   v.push(x,y,z);const c=new THREE.Color().setHSL(.18+r()*.025,.1+r()*.08,.035+t*.025+r()*.008);colors.push(...c.toArray());
   if(row<rows&&side<cols){const k=n+row*(cols+1)+side;idx.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  }
 }
 return geometry(v,idx,colors);
}
export function leafGeometry(){
 const v=[],idx=[],uv=[],rows=24,cols=8;
 for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
  const t=i/rows,s=j/cols*2-1,width=.028*Math.pow(Math.sin(Math.PI*t),.75)*(1+.035*Math.sin(t*82));
  const x=s*width,z=(t-.5)*.105,y=.002+Math.abs(s)**2*.008+Math.sin(t*5)*.004+Math.sin(t*18+s*2)*.001;
  v.push(x,y,z);uv.push(j/cols,t);
  if(i<rows&&j<cols){const k=i*(cols+1)+j;idx.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
 }
 return geometry(v,idx,null,uv);
}
export function leafTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d'),r=randomGenerator(812),image=ctx.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const i=(y*c.width+x)*4,n=r(),m=noise(x*.025,y*.025),vein=Math.exp(-Math.abs(x-128)/3)*16;
  image.data[i]=78+m*48+n*13+vein;image.data[i+1]=43+m*26+n*7+vein*.65;image.data[i+2]=18+m*17+n*5+vein*.3;image.data[i+3]=255;
 }
 ctx.putImageData(image,0,0);ctx.lineCap='round';ctx.strokeStyle='#ac885590';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(128,0);ctx.bezierCurveTo(124,180,132,350,128,512);ctx.stroke();
 for(let y=50;y<490;y+=38)for(const side of [-1,1]){ctx.lineWidth=.65;ctx.strokeStyle='#b499614f';ctx.beginPath();ctx.moveTo(128,y);ctx.bezierCurveTo(128+side*25,y+4,128+side*60,y+30,128+side*120,y+80);ctx.stroke();for(let j=1;j<5;j++){ctx.lineWidth=.3;ctx.beginPath();ctx.moveTo(128+side*j*22,y+j*11);ctx.lineTo(128+side*(j*22+15),y+j*11-12);ctx.stroke();}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
export function icicleGeometry(length,radius,seed){
 const r=randomGenerator(seed),v=[],idx=[],uv=[],sides=12,rows=10;
 for(let i=0;i<=rows;i++)for(let j=0;j<=sides;j++){
  const t=i/rows,a=j/sides*Math.PI*2,width=radius*Math.pow(1-t,1.25)*(1+Math.sin(t*35+seed)*.055);
  v.push(Math.cos(a)*width+Math.sin(t*2)*radius*.2,-t*length,Math.sin(a)*width);uv.push(j/sides,t);
  if(i<rows&&j<sides){const k=i*(sides+1)+j;idx.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
 }
 return geometry(v,idx,null,uv);
}
