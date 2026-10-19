import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {randomGenerator,noise,snowHeight} from './world.js';
import {rockGeometry,rockRadius,mossGeometry,lichenGeometry,leafGeometry,leafTexture,icicleGeometry} from './ground-geometry.js';
const up=new THREE.Vector3(0,1,0);
function rockPoint(group,n,offset=.001){return n.clone().multiplyScalar(rockRadius(n)+offset).applyMatrix4(group.matrixWorld);}
function rockNormal(group,n){
 const tangent=new THREE.Vector3().crossVectors(Math.abs(n.y)>.95?new THREE.Vector3(1,0,0):up,n).normalize(),bitangent=new THREE.Vector3().crossVectors(n,tangent).normalize();
 const p=rockPoint(group,n),a=rockPoint(group,n.clone().addScaledVector(tangent,.001).normalize()).sub(p),b=rockPoint(group,n.clone().addScaledVector(bitangent,.001).normalize()).sub(p);
 return a.cross(b).normalize();
}
export function createGroundDetails(scene,{snowMaterial,bark,rock,mossMaps}){
 const random=randomGenerator(312),anchors={rocks:[],moss:[],lichen:[],logs:[],icicles:[],leaves:[]},o=new THREE.Object3D();
 const rockGeo=rockGeometry(),capGeo=new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI*.52),cp=capGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const v=new THREE.Vector3().fromBufferAttribute(cp,i);v.multiplyScalar(1.02+noise(v.x*4+12,v.z*4+v.y)*.13);const edge=Math.pow(1-Math.max(0,v.y),3),phi=Math.atan2(v.z,v.x);v.y+=.12+edge*(.12*Math.sin(phi*3+1.2)+.06*Math.sin(phi*7+.8));cp.setXYZ(i,v.x,v.y,v.z);}capGeo.computeVertexNormals();
 const rocks=new THREE.InstancedMesh(rockGeo,rock,165),caps=new THREE.InstancedMesh(capGeo,snowMaterial,165),patches=[];
 const rockGroups=[];
 for(let i=0;i<165;i++){
  const a=random()*Math.PI*2,d=Math.sqrt(random())*108;let x=Math.cos(a)*d,z=Math.sin(a)*d;if(i===0){x=6;z=5;}if(i===1){x=-4;z=-1;}
  const size=i===0?1.5:.3+random()*1.65,burial=i<2?.28:random()*.65-.35;
  const group=new THREE.Object3D();group.position.set(x,snowHeight(x,z)+size*burial,z);group.rotation.y=random()*Math.PI*2;group.scale.set(size,size*(.55+random()*.3),size*(.8+random()*.3));group.updateMatrixWorld();rocks.setMatrixAt(i,group.matrixWorld);caps.setMatrixAt(i,group.matrixWorld);rockGroups.push(group);
  const rockAnchor={position:group.position.toArray(),scale:group.scale.toArray()};if(i<3)anchors.rocks.push(rockAnchor);
  for(let j=0;j<15;j++){
   const angle=j===0&&i===0?Math.PI/2:random()*Math.PI*2,y=i<2?-.06-random()*.13:-.08-random()*.45,n=new THREE.Vector3(Math.cos(angle)*Math.sqrt(1-y*y),y,Math.sin(angle)*Math.sqrt(1-y*y)),position=rockPoint(group,n),normal=rockNormal(group,n);
   if(position.y<snowHeight(position.x,position.z)+.018)continue;
   const scale=.65+random()*.8;o.position.copy(position);o.quaternion.setFromUnitVectors(up,normal);o.rotateY(random()*Math.PI*2);o.scale.setScalar(scale);o.updateMatrix();const matrix=o.matrix.clone();
   const color=new THREE.Color().setHSL(.2+random()*.05,.12+random()*.18,.65+random()*.2);
   patches.push({position:position.clone(),moss:matrix,color});
   if(i===0){anchors.moss.push({position:position.toArray(),normal:normal.toArray()});if(!rockAnchor.exposed)rockAnchor.exposed={position:position.toArray(),normal:normal.toArray()};}
   const ln=n.clone().applyAxisAngle(up,.08);ln.y-=.02;ln.normalize();const lp=rockPoint(group,ln,.0015),lNormal=rockNormal(group,ln);
   if(lp.y>snowHeight(lp.x,lp.z)+.012){o.position.copy(lp);o.quaternion.setFromUnitVectors(up,lNormal);o.scale.setScalar(.65+random()*.65);o.updateMatrix();patches[patches.length-1].lichen=o.matrix.clone();if(i===0)anchors.lichen.push({position:lp.toArray(),normal:lNormal.toArray()});}
  }
 }
 rocks.castShadow=rocks.receiveShadow=caps.castShadow=caps.receiveShadow=true;scene.add(rocks,caps);
 const mossMat=new THREE.MeshStandardMaterial({map:mossMaps.diff,normalMap:mossMaps.normal,normalScale:new THREE.Vector2(.6,.6),roughnessMap:mossMaps.rough,color:0xaaaaaa,vertexColors:true,roughness:.95,side:THREE.DoubleSide}),lichenMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
 const plants=[mossGeometry(true),mossGeometry(false),lichenGeometry(true),lichenGeometry(false)].map((geo,i)=>{const mesh=new THREE.InstancedMesh(geo,i<2?mossMat:lichenMat,patches.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.receiveShadow=true;scene.add(mesh);return mesh;});
 const twigGeo=new THREE.CylinderGeometry(.006,.013,1,8,4),tuv=twigGeo.attributes.uv;for(let i=0;i<tuv.count;i++){tuv.setX(i,tuv.getX(i)*.035);tuv.setY(i,tuv.getY(i)*.5);}
 const twigs=new THREE.InstancedMesh(twigGeo,bark,1800),leafMap=leafTexture();const leafMat=new THREE.MeshStandardMaterial({map:leafMap,bumpMap:leafMap,bumpScale:.0003,roughness:.92,side:THREE.DoubleSide});const leaves=new THREE.InstancedMesh(leafGeometry(),leafMat,650);
 for(let i=0;i<1800;i++){
  const a=random()*Math.PI*2,d=Math.sqrt(random())*105,x=Math.cos(a)*d,z=Math.sin(a)*d;
  o.position.set(x,snowHeight(x,z)+.006,z);o.rotation.set(Math.PI/2+(random()-.5)*.12,random()*6.28,random()*6.28);o.scale.set(1,.15+random()*.7,1);o.updateMatrix();twigs.setMatrixAt(i,o.matrix);
  if(i<650){const lx=x+.08+random()*.15,lz=z+random()*.2;o.position.set(lx,snowHeight(lx,lz)+.003,lz);o.rotation.set((random()-.5)*.08,random()*6.28,0);o.scale.setScalar(.65+random()*.8);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.08+random()*.04,.15+random()*.15,.7+random()*.2));if(i<3)anchors.leaves.push(o.position.toArray());}
 }
 twigs.castShadow=leaves.castShadow=leaves.receiveShadow=true;scene.add(twigs,leaves);
 const iceFar=new THREE.MeshPhysicalMaterial({color:0xd7eaf1,roughness:.12,clearcoat:1,ior:1.31,transparent:true,opacity:.72});
 const iceNear=iceFar.clone();iceNear.transmission=.88;iceNear.thickness=.025;iceNear.opacity=1;iceNear.roughness=.07;
 const icicleGeometries=[],logPositions=[];
 for(let i=0;i<14;i++){
  const x=i===0?7:(random()-.5)*170,z=i===0?1:(random()-.5)*170,length=i===0?5:3+random()*5,angle=random()*Math.PI*2;
  const hA=snowHeight(x-Math.cos(angle)*length/2,z+Math.sin(angle)*length/2),hB=snowHeight(x+Math.cos(angle)*length/2,z-Math.sin(angle)*length/2);
  const log=new THREE.Group();log.position.set(x,(hA+hB)/2+.27,z);log.rotation.set(0,angle,Math.atan2(hB-hA,length));
  function bow(g){const p=g.attributes.position;for(let j=0;j<p.count;j++){const px=p.getX(j);p.setY(j,p.getY(j)+.32*Math.max(0,1-(2*px/length)**2));}g.computeVertexNormals();return g;}
  const trunkGeo=new THREE.CylinderGeometry(.18,.3,length,28,32),uv=trunkGeo.attributes.uv;for(let j=0;j<uv.count;j++){uv.setX(j,uv.getX(j)*.75);uv.setY(j,uv.getY(j)*length*.5);}trunkGeo.rotateZ(Math.PI/2);bow(trunkGeo);
  const trunk=new THREE.Mesh(trunkGeo,bark);trunk.castShadow=trunk.receiveShadow=true;log.add(trunk);
  const mantleGeo=new THREE.CapsuleGeometry(.29,length-.5,8,20);mantleGeo.rotateZ(Math.PI/2);mantleGeo.scale(1,1,.8);mantleGeo.translate(0,.16,0);bow(mantleGeo);const mantle=new THREE.Mesh(mantleGeo,snowMaterial);mantle.castShadow=mantle.receiveShadow=true;log.add(mantle);log.updateMatrixWorld();scene.add(log);logPositions.push(log.position.clone());
  if(i<3)anchors.logs.push({position:log.position.toArray(),angle,length});
  for(let j=0;j<18;j++){
   const px=(random()-.5)*length*.83,bend=.32*Math.max(0,1-(2*px/length)**2),radius=.18+(px/length+.5)*.12,base=new THREE.Vector3(px,bend-radius*Math.sqrt(1-.65**2)+.003,radius*.65),world=base.clone().applyMatrix4(log.matrixWorld),clearance=world.y-snowHeight(world.x,world.z)-.025;
   const len=Math.min(.12+random()*.2,clearance);if(len<.045)continue;
   const geo=icicleGeometry(len,.009+random()*.012,117+i*19+j);geo.translate(...world.toArray());icicleGeometries.push(geo);if(i===0&&anchors.icicles.length<3)anchors.icicles.push({position:world.toArray(),length:len});
  }
 }
 const iceMesh=new THREE.Mesh(mergeGeometries(icicleGeometries),iceFar);scene.add(iceMesh);icicleGeometries.forEach(g=>g.dispose());
 const grass=new THREE.InstancedMesh(new THREE.CylinderGeometry(.001,.004,1,5),new THREE.MeshStandardMaterial({color:0x82765d,roughness:1}),2400);
 for(let i=0;i<2400;i++){const a=random()*6.283,d=Math.sqrt(random())*105,x=Math.cos(a)*d,z=Math.sin(a)*d,h=.08+random()*.32;o.position.set(x,snowHeight(x,z)+h*.4,z);o.rotation.set((random()-.5)*.8,random()*6.28,(random()-.5)*.8);o.scale.set(1,h,1);o.updateMatrix();grass.setMatrixAt(i,o.matrix);}scene.add(grass);
 let previousCell='';
 function update(camera,quality='high'){
  const cell=`${Math.floor(camera.position.x/2)},${Math.floor(camera.position.z/2)}`;
  if(cell!==previousCell){previousCell=cell;const counts=[0,0,0,0];
   for(const p of patches){const near=camera.position.distanceToSquared(p.position)<144,index=near?0:1;plants[index].setMatrixAt(counts[index]++,p.moss);plants[index].setColorAt(counts[index]-1,p.color);if(p.lichen){const li=index+2;plants[li].setMatrixAt(counts[li]++,p.lichen);}}
   plants.forEach((mesh,i)=>{mesh.count=counts[i];mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();});
  }
  const nearIce=quality==='high'&&logPositions.some(p=>p.distanceToSquared(camera.position)<36);iceMesh.material=nearIce?iceNear:iceFar;
 }
 return {anchors,update};
}
