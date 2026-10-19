import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomGenerator,forestLayout,noise} from './world.js';
const up=new THREE.Vector3(0,1,0);
function branch(a,b,r1,r2,segments=6){
 const len=a.distanceTo(b),g=new THREE.CylinderGeometry(r2,r1,len,segments,1);
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*len*.5);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,b.clone().sub(a).normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return g;
}
function snowRibbon(a,b,width,seed,detailed=true){
 const steps=detailed?3:1, sides=detailed?6:4;
 const vertices=[],uv=[],indices=[];const dir=b.clone().sub(a),side=new THREE.Vector3(-dir.z,0,dir.x).normalize();
 for(let i=0;i<=steps;i++){
  const t=i/steps,center=a.clone().lerp(b,t);center.y-=Math.sin(t*Math.PI)*dir.length()*.13;const w=width*Math.pow(Math.sin(Math.PI*(t*.9+.03)),.5)*(1+.15*Math.sin(t*27+seed));
  for(let j=0;j<=sides;j++){
   const theta=j/sides*Math.PI*2;const p=center.clone().addScaledVector(side,Math.cos(theta)*w);p.y+=Math.max(-.14,Math.sin(theta)*.9)*w+.025+Math.sin(t*16+seed)*.035;
   vertices.push(...p.toArray());uv.push(t*dir.length()*.6,j/sides*.3);
   if(i<steps&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function treeGeometry(seed,detailed){
 const r=randomGenerator(seed),wood=[],needles=[],snow=[];
 const height=16, layers=detailed?18:12;
 const trunk=new THREE.CylinderGeometry(.025,.33,height,detailed?14:7,12);
 const pos=trunk.attributes.position;for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setX(i,pos.getX(i)+Math.sin(y*.4+seed)*.045);}
 const trunkUV=trunk.attributes.uv;for(let i=0;i<trunkUV.count;i++)trunkUV.setY(i,trunkUV.getY(i)*height*.5);
 trunk.translate(0,height/2,0);trunk.computeVertexNormals();wood.push(trunk);
 for(let level=0;level<layers;level++){
  const y=1.3+level*(14.7/layers)+(r()-.5)*.32,frac=y/height,branchCount=detailed?6:5;
  const span=4.5*Math.pow(1-frac,.85)*(.86+r()*.24);
  for(let k=0;k<branchCount;k++){
   if(r()<.06)continue;
   const angle=k/branchCount*Math.PI*2+level*2.39+r()*.5,dx=Math.cos(angle),dz=Math.sin(angle);
   const len=span*(.7+r()*.45),base=new THREE.Vector3(0,y,0);
   const mid=new THREE.Vector3(dx*len*.53,y-.12-len*.28,dz*len*.53),end=new THREE.Vector3(dx*len,y-.12-len*.12,dz*len);
   if(detailed){wood.push(branch(base,mid,.045*(1-frac)+.009,.022));wood.push(branch(mid,end,.022,.004));}
   const steps=detailed?4:2;
   for(let j=1;j<=steps;j++){
    const t=j/(steps+1),origin=base.clone().lerp(end,t);origin.y-=Math.sin(t*Math.PI)*len*.2;
    for(const sign of [-1,1]){
     const subAngle=angle+sign*(.5+r()*.35),subLen=len*(1-t)*(.65+r()*.15)+.15;
     const tip=origin.clone().add(new THREE.Vector3(Math.cos(subAngle)*subLen,-.12-subLen*.12+r()*.1,Math.sin(subAngle)*subLen));
     if(detailed&&j%2===0)wood.push(branch(origin,tip,.015,.003,4));
     const center=origin.clone().lerp(tip,.55);center.y-=.035;
     const g=new THREE.PlaneGeometry(subLen*1.35,.55+subLen*.3);g.rotateX(-Math.PI/2);g.rotateY(-subAngle);g.translate(...center.toArray());needles.push(g);
     if(detailed){const g2=new THREE.PlaneGeometry(subLen*1.35,.5+subLen*.25);g2.rotateX(-.5);g2.rotateY(-subAngle);g2.translate(...center.toArray());needles.push(g2);}
     if((!detailed||j%2===0)&&r()>.08)snow.push(snowRibbon(origin.clone().add(new THREE.Vector3(0,.055,0)),tip,.18+subLen*.22,r()*10,detailed));
    }
   }
   snow.push(snowRibbon(base, end,.13+len*.10,r()*10,detailed));
  }
 }
 return [wood,needles,snow].map(list=>{const g=mergeGeometries(list);list.forEach(g=>g.dispose());return g;});
}
export function createForest(scene,materials){
 const needleMat=new THREE.MeshStandardMaterial({map:materials.twig,alphaMap:materials.twigAlpha,normalMap:materials.twigNormal,normalScale:new THREE.Vector2(.5,.5),alphaTest:.4,side:THREE.DoubleSide,roughness:.92,color:0xd3dbcf});
 const mats=[materials.bark,needleMat,materials.branchSnow];
 const variants=Array.from({length:6},(_,i)=>[treeGeometry(140+i*83,true),treeGeometry(140+i*83,false)]);
 const layout=forestLayout(),chunks=new Map(),obj=new THREE.Object3D();
 for(const tree of layout){const key=`${Math.floor(tree.x/28)},${Math.floor(tree.z/28)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(tree);}
 const lods=[];
 for(const trees of chunks.values()){
  const center=new THREE.Vector3(trees.reduce((a,t)=>a+t.x,0)/trees.length,0,trees.reduce((a,t)=>a+t.z,0)/trees.length);
  const groups=[new THREE.Group(),new THREE.Group()];
  for(let detail=0;detail<2;detail++)for(let v=0;v<6;v++){
   const items=trees.filter(t=>t.variant===v);if(!items.length)continue;
   for(let part=0;part<3;part++){
    const mesh=new THREE.InstancedMesh(variants[v][detail][part],mats[part],items.length);
    for(let j=0;j<items.length;j++){const t=items[j];obj.position.set(t.x,t.y,t.z);obj.rotation.set(0,t.angle,0);obj.scale.set(t.width,t.height/16,t.width);obj.updateMatrix();mesh.setMatrixAt(j,obj.matrix);}
    mesh.castShadow=part!==1;mesh.receiveShadow=true;mesh.computeBoundingSphere();groups[detail].add(mesh);
   }
  }
  groups.forEach(g=>scene.add(g));lods.push({center,groups});
 }
 return {layout,update(camera){let changed=false;for(const {center,groups} of lods){const d=Math.hypot(camera.position.x-center.x,camera.position.z-center.z),near=d<43,far=d>=43&&d<155;changed=changed||groups[0].visible!==near||groups[1].visible!==far;groups[0].visible=near;groups[1].visible=far;}return changed;},triangleEstimate:variants[0][0].reduce((s,g)=>s+g.index.count/3,0)};
}
