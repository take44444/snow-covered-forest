import * as THREE from 'three';
import {randomGenerator,snowHeight} from './world.js';
// Millimetre-scale hexagonal ice grains supplement the scanned snow normal map.
// World-cell seeds keep the same crystals in the same place as the camera moves.
export function createFrost(scene){
 const geometry=new THREE.ConeGeometry(.0018,.006,6,1);
 const material=new THREE.MeshPhysicalMaterial({color:0xe8f4ff,roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.12,ior:1.31,specularIntensity:1.1});
 const mesh=new THREE.InstancedMesh(geometry,material,8100),object=new THREE.Object3D();mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);let previous='';
 return {update(camera){
  mesh.visible=camera.position.y-snowHeight(camera.position.x,camera.position.z)<3;
  if(!mesh.visible)return;
  const cx=Math.floor(camera.position.x),cz=Math.floor(camera.position.z),key=`${cx},${cz}`;if(previous===key)return;previous=key;let i=0;
  for(let x=cx-4;x<=cx+4;x++)for(let z=cz-4;z<=cz+4;z++){
   const random=randomGenerator((x*73856093)^(z*19349663));
   for(let j=0;j<100;j++){
    const px=x+random(),pz=z+random();object.position.set(px,snowHeight(px,pz)+.001,pz);object.rotation.set((random()-.5)*1.6,random()*Math.PI*2,(random()-.5)*1.6);const size=.4+random()*1.1;object.scale.set(size,size*(.7+random()),size);object.updateMatrix();mesh.setMatrixAt(i++,object.matrix);
   }
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
 }};
}
