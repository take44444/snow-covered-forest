import * as THREE from 'three';
import {forestLayout} from './world.js';
import {loadFirAssets} from './fir-assets.js';
import {configureWorldMaterial} from './snow-material.js';
import {treeLodWeights,treeDistance,configureTreeDither,TREE_CULL_DISTANCE} from './tree-lod.js';
export async function createForest(scene,materials){
 const assets=await loadFirAssets(materials.manager),layout=forestLayout(),chunks=new Map(),object=new THREE.Object3D();
 const wood=configureWorldMaterial(materials.bark.clone(),{repeat:1,sparkle:false});
 const foliage=new THREE.MeshStandardMaterial({map:materials.twig,normalMap:materials.twigNormal,roughnessMap:materials.twigRough,normalScale:new THREE.Vector2(.35,.35),roughness:.9,side:THREE.DoubleSide,color:0x9aab92});
 const lodMaterials=[0,1,2].map(level=>({wood:configureTreeDither(wood,level),foliage:configureTreeDither(foliage,level),snow:configureTreeDither(materials.branchSnow,level)}));
 for(let i=0;i<layout.length;i++){
  const tree=layout[i],variant=tree.variant%assets.length,key=`${Math.floor(tree.x/28)},${Math.floor(tree.z/28)},${variant}`;
  if(!chunks.has(key))chunks.set(key,{trees:[],variant});
  object.position.set(tree.x,tree.y,tree.z);object.rotation.set(0,tree.angle,0);object.scale.set(tree.width,tree.height/16,tree.width);object.updateMatrix();
  chunks.get(key).trees.push({tree,index:i,matrix:object.matrix.clone()});
 }
 const buckets=[];
 for(const bucket of chunks.values()){
  bucket.meshes=[0,1,2].map(level=>['wood','foliage','snow'].map(part=>{
   const mesh=new THREE.InstancedMesh(assets[bucket.variant].levels[level][part],lodMaterials[level][part],bucket.trees.length);mesh.castShadow=part!=='foliage';mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.visible=false;scene.add(mesh);return mesh;
  }));bucket.signatures=['','',''];buckets.push(bucket);
 }
 function update(camera){
  let changed=false;
  for(const bucket of buckets){
   const selections=[[],[],[]];
   for(const item of bucket.trees){const d=treeDistance(item.tree,camera.position);if(d>=TREE_CULL_DISTANCE)continue;treeLodWeights(d).forEach((w,l)=>{if(w>0)selections[l].push(item);});}
   for(let level=0;level<3;level++){
    const selected=selections[level],signature=selected.map(t=>t.index).join(',');if(signature===bucket.signatures[level])continue;bucket.signatures[level]=signature;changed=true;
    for(const mesh of bucket.meshes[level]){mesh.count=selected.length;mesh.visible=selected.length>0;for(let i=0;i<selected.length;i++)mesh.setMatrixAt(i,selected[i].matrix);mesh.instanceMatrix.needsUpdate=true;if(mesh.visible)mesh.computeBoundingSphere();}
   }
  }
  return changed;
 }
 function constrainTrunks(position){
  for(const tree of layout){const d=Math.hypot(position.x-tree.x,position.z-tree.z);if(d>tree.width*1.5+.2||position.y>tree.y+tree.height)continue;
   const y=(position.y-tree.y)*16/tree.height,profile=assets[tree.variant%assets.length].profile,k=Math.max(0,Math.min(profile.length-1,Math.round(y/.25))),radius=profile[k].radius*tree.width+.15;
   if(d<radius&&d>.00001){position.x=tree.x+(position.x-tree.x)*radius/d;position.z=tree.z+(position.z-tree.z)*radius/d;}
  }
 }
 function branchView(tree){
  const source=assets[tree.variant%assets.length].levels[0].snow,p=source.attributes.position,n=source.attributes.normal;let best=-1,score=-Infinity;
  for(let i=0;i<p.count;i++){if(p.getY(i)<8||p.getY(i)>11||Math.abs(p.getZ(i))>1.5)continue;const value=p.getX(i)-Math.abs(p.getY(i)-9.5)*.1;if(value>score){best=i;score=value;}}
  if(best<0)throw Error('Missing fir branch review point');object.position.set(tree.x,tree.y,tree.z);object.rotation.set(0,tree.angle,0);object.scale.set(tree.width,tree.height/16,tree.width);object.updateMatrix();
  const point=new THREE.Vector3().fromBufferAttribute(p,best).applyMatrix4(object.matrix),normal=new THREE.Vector3().fromBufferAttribute(n,best).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(object.matrix));
  return {position:point.clone().addScaledVector(normal,.6).add(new THREE.Vector3(0,.15,0)).toArray(),target:point.toArray()};
 }
 return {layout,update,constrainTrunks,branchView,source:'Poly Haven Fir Tree 01',detailLevels:3};
}
