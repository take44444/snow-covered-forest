import * as THREE from 'three';
import {randomGenerator,snowHeight} from './world.js';

// A sixfold dendrite, 6 mm across and 24 micrometres thick. Each rib is a
// tapered prism: it keeps an edge and a reflection when viewed from the side.
export function crystalGeometry(){
 const positions=[],indices=[];
 function rib(ax,ay,bx,by,width){
  const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy),nx=-dy/l*width/2,ny=dx/l*width/2,k=positions.length/3;
  for(const z of [-.000012,.000012])positions.push(ax+nx,ay+ny,z,ax-nx,ay-ny,z,bx-nx*.22,by-ny*.22,z,bx+nx*.22,by+ny*.22,z);
  indices.push(k,k+2,k+1,k,k+3,k+2,k+4,k+5,k+6,k+4,k+6,k+7);
  for(let i=0;i<4;i++){const j=(i+1)%4;indices.push(k+i,k+j,k+j+4,k+i,k+j+4,k+i+4);}
 }
 for(let arm=0;arm<6;arm++){
  const a=arm*Math.PI/3,c=Math.cos(a),s=Math.sin(a),rotate=(x,y)=>[x*c-y*s,x*s+y*c];
  const add=(ax,ay,bx,by,w)=>rib(...rotate(ax,ay),...rotate(bx,by),w);
  add(0,0,.003,0,.00016);
  for(const [r,length] of [[.0008,.0008],[.0014,.00068],[.002,.00048],[.0025,.00026]])for(const side of [-1,1]){
   add(r,0,r+length*.5,side*length*.866,.00009);
   if(r<.0015)add(r+length*.25,side*length*.433,r+length*.53,side*length*.433,.000045);
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

const wrap=(x,center,span)=>center+((x-center+span/2)%span+span)%span-span/2;
// Wrapping only changes a particle at the volume boundary. Local camera
// translations leave its world position unchanged, retaining real parallax.
export function particlePosition(seed,time,center,span=14){
 return [wrap(seed[0]+time*.06+Math.sin(time*.24+seed[2])*.14,center[0],span),wrap(seed[1]-time*seed[3],center[1],span),wrap(seed[2]+Math.sin(time*.17+seed[0])*.12,center[2],span)];
}

export function createSnowfall(scene,pixelRatio){
 const random=randomGenerator(312),count=900,seeds=[],scales=[],rotations=[];
 const material=new THREE.MeshPhysicalMaterial({color:0xe8f3ff,roughness:.24,metalness:0,clearcoat:1,clearcoatRoughness:.12,ior:1.31,transparent:true,opacity:.86});
 const crystals=new THREE.InstancedMesh(crystalGeometry(),material,count);crystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);crystals.frustumCulled=false;scene.add(crystals);
 for(let i=0;i<count;i++){seeds.push([(random()-.5)*14,(random()-.5)*14,(random()-.5)*14,.18+random()*.24]);scales.push(.65+random()*.7);rotations.push([random()*Math.PI*2,random()*Math.PI*2,random()*Math.PI*2]);}
 const positions=[],sizes=[];
 for(let i=0;i<2300;i++){positions.push((random()-.5)*65,(random()-.5)*40,(random()-.5)*65);sizes.push(.65+random()*.7);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
 // At these distances crystals are subpixel; a soft point integrates their
 // light without presenting a large, camera-facing snowflake icon.
 const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uCamera:{value:new THREE.Vector3()},uRatio:{value:pixelRatio}},transparent:true,depthWrite:false,vertexShader:`
  attribute float aSize; uniform float uTime,uRatio; uniform vec3 uCamera; varying float vAlpha;
  void main(){vec3 p=position+vec3(uTime*.06,-uTime*(.24+aSize*.1),0.);p=uCamera+mod(p-uCamera+vec3(32.5,20.,32.5),vec3(65.,40.,65.))-vec3(32.5,20.,32.5);vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*2.8*uRatio/-mv.z,.7,2.);vAlpha=smoothstep(4.,8.,length(p-uCamera))*.5;}`,
 fragmentShader:`varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.93,.97,1.,(1.-smoothstep(.15,1.,r))*vAlpha);}`});
 const distant=new THREE.Points(geo,mat);distant.frustumCulled=false;scene.add(distant);
 const transform=new THREE.Object3D(),center=new THREE.Vector3();let currentTime=0;
 function update(time,camera){
  currentTime=time;center.copy(camera.position);mat.uniforms.uTime.value=time;mat.uniforms.uCamera.value.copy(center);
  for(let i=0;i<count;i++){
   transform.position.fromArray(particlePosition(seeds[i],time,center.toArray()));const r=rotations[i];transform.rotation.set(r[0]+time*.34,r[1]+time*.21,r[2]+time*.17);transform.scale.setScalar(scales[i]);transform.updateMatrix();crystals.setMatrixAt(i,transform.matrix);
  }crystals.instanceMatrix.needsUpdate=true;
 }
 function reviewView(){
  // Inspect a real member of the live field, frozen at the current time.
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
  const i=seeds.findIndex((seed,i)=>{
   crystals.getMatrixAt(i,matrix);matrix.decompose(point,q,scale);
   return point.y>snowHeight(point.x,point.z)+1&&new THREE.Vector3(0,0,1).applyQuaternion(q).y>.65;
  });
  crystals.getMatrixAt(i,matrix);matrix.decompose(point,q,scale);const p=point.toArray();
  const n=new THREE.Vector3(.18,.1,1).normalize().applyQuaternion(q);
  const position=point.clone().addScaledVector(n,.039);crystals.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(position,n.clone().negate(),.035,.06),hit=ray.intersectObject(crystals).some(hit=>hit.instanceId===i);
  if(!hit)throw Error('Crystal review camera misses its live geometry');
  return {position:position.toArray(),target:p};
 }
 return {update,resize(ratio){mat.uniforms.uRatio.value=ratio;},reviewView,setVisible(visible){crystals.visible=distant.visible=visible;}};
}
