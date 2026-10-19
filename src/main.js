import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {createForest} from './forest.js';
import {createFrost} from './frost.js';
import {randomGenerator,noise,snowHeight,terrainHeight,constrainPosition,movementSpeed,WORLD_RADIUS,WARNING_RADIUS} from './world.js';
const $=id=>document.getElementById(id);
const state={ready:false,active:false,locked:false,sound:false,frames:0,fps:0,quality:'high'};
const keys=new Set(),random=randomGenerator(312);
let renderer,scene,camera,forest,frost,snow,clock,elapsed=0,yaw=.04,pitch=.04,audio,windGain,windFilter,footGain;
const mobile=matchMedia('(pointer:coarse)').matches;
const assetErrors=[];
function texture(loader,name,type,repeat=1){const t=loader.load(`/textures/${name}_${type}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=8;if(type==='diff')t.colorSpace=THREE.SRGBColorSpace;return t;}
async function init(){
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('world').appendChild(renderer.domElement);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showError('The graphics context was interrupted. Reload this page to return to the forest.');});
 scene=new THREE.Scene();scene.background=new THREE.Color(0xa8bfc9);scene.fog=new THREE.FogExp2(0xb8c9d0,.018);
 camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.035,320);camera.rotation.order='YXZ';camera.position.set(3,snowHeight(3,11)+1.75,11);camera.rotation.set(pitch,yaw,0);
 const manager=new THREE.LoadingManager();const loaded=new Promise(resolve=>{manager.onLoad=resolve;});manager.onProgress=(url,n,total)=>{$('load-status').textContent=`Gathering winter textures · ${Math.round(n/total*100)}%`;};manager.onError=url=>assetErrors.push(url);
 const loader=new THREE.TextureLoader(manager);
 const snowMap=texture(loader,'snow_02','diff'),snowNormal=texture(loader,'snow_02','nor_gl'),snowRough=texture(loader,'snow_02','rough');
 const snowMaterial=new THREE.MeshPhysicalMaterial({color:0xf0f5fa,map:snowMap,normalMap:snowNormal,normalScale:new THREE.Vector2(.45,.45),roughnessMap:snowRough,roughness:.93,metalness:0,clearcoat:.12,clearcoatRoughness:.45});
 snowMaterial.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSnowWorld;');
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSnowWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSnowWorld;\nfloat grain(vec3 p) { return fract(sin(dot(p,vec3(12.9898,78.233,39.425)))*43758.5453); }');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat crystal = pow(grain(floor(vSnowWorld*950.0)),95.0);\nroughnessFactor = clamp(roughnessFactor - crystal*.35, .35, 1.0);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','gl_FragColor.rgb += crystal*.055;\n#include <dithering_fragment>');
 };
 const branchSnow=snowMaterial.clone();branchSnow.onBeforeCompile=snowMaterial.onBeforeCompile;
 const bark=new THREE.MeshStandardMaterial({map:texture(loader,'bark_brown_02','diff',2),normalMap:texture(loader,'bark_brown_02','nor_gl',2),roughnessMap:texture(loader,'bark_brown_02','rough',2),normalScale:new THREE.Vector2(.9,.9),roughness:1,color:0xa7aaa0});
 const rock=new THREE.MeshStandardMaterial({map:texture(loader,'rock_boulder_cracked','diff'),normalMap:texture(loader,'rock_boulder_cracked','nor_gl'),roughnessMap:texture(loader,'rock_boulder_cracked','rough'),roughness:1,color:0x8e9995});
 const sky=new Sky();sky.scale.setScalar(400);sky.material.uniforms.turbidity.value=5;sky.material.uniforms.rayleigh.value=1.2;sky.material.uniforms.mieCoefficient.value=.005;sky.material.uniforms.mieDirectionalG.value=.85;
 const sunDirection=new THREE.Vector3(-.5,.32,-.75).normalize();sky.material.uniforms.sunPosition.value.copy(sunDirection);scene.add(sky);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(sky,.04).texture;scene.environmentIntensity=.35;pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xdcecff,0x5b6d79,2));
 const sun=new THREE.DirectionalLight(0xffebcc,3.0);sun.position.copy(sunDirection.clone().multiplyScalar(70));sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.camera.near=1;sun.shadow.camera.far=155;sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);
 const terrain=new THREE.PlaneGeometry(460,460,440,440);terrain.rotateX(-Math.PI/2);const positions=terrain.attributes.position,uv=terrain.attributes.uv;const colors=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,snowHeight(x,z));uv.setXY(i,x/2,z/2);
  const c=.89+noise(x*.12,z*.12)*.1;colors.push(c,c*.995,c);
 }
 terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();snowMaterial.vertexColors=true;
 const ground=new THREE.Mesh(terrain,snowMaterial);ground.receiveShadow=true;scene.add(ground);
 await new Promise(resolve=>setTimeout(resolve,30));$('load-status').textContent='Laying snow on the branches…';
 const twig=texture(loader,'pine_tree_01_twig','diff'),twigAlpha=texture(loader,'pine_tree_01_twig','alpha'),twigNormal=texture(loader,'pine_tree_01_twig','nor_gl');
 for(const t of [twig,twigAlpha,twigNormal]){t.repeat.set(.295,.175);t.offset.set(.648,.477);}
 forest=createForest(scene,{bark,branchSnow,twig,twigAlpha,twigNormal});forest.update(camera);
 createGroundDetails({snowMaterial:branchSnow,bark,rock});createSnowfall();frost=createFrost(scene);frost.update(camera);
 await loaded;
 if(assetErrors.length)throw new Error('Some forest textures could not load. Please reload.');
 clock=new THREE.Clock();
 let frameWindow=0,frameCount=0,lastLOD=-1;
 renderer.setAnimationLoop(()=>{
  const rawDt=clock.getDelta(),dt=Math.min(rawDt,.25);elapsed+=dt;frameWindow+=rawDt;frameCount++;
  if(frameWindow>.7){state.fps=Math.round(frameCount/frameWindow);frameWindow=0;frameCount=0;}
  if(state.active){let remaining=dt;while(remaining>0){const step=Math.min(.04,remaining);updateMovement(step);remaining-=step;}}
  else if(!state.everEntered){camera.position.y=snowHeight(3,11)+1.75+Math.sin(elapsed*.3)*.015;camera.rotation.set(pitch+Math.sin(elapsed*.07)*.005,yaw+Math.sin(elapsed*.045)*.012,0);}
  if(elapsed-lastLOD>.5){const forestChanged=forest.update(camera);frost.update(camera);lastLOD=elapsed;const cx=Math.round(camera.position.x/8)*8,cz=Math.round(camera.position.z/8)*8;if(forestChanged||sun.target.position.x!==cx||sun.target.position.z!==cz){sun.target.position.set(cx,0,cz);sun.position.set(cx+sunDirection.x*70,sunDirection.y*70,cz+sunDirection.z*70);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;}}
  snow.material.uniforms.uTime.value=elapsed;snow.position.copy(camera.position);
  if(windGain&&state.sound){windGain.gain.setTargetAtTime(.025+Math.sin(elapsed*.23)*.009,audio.currentTime,.5);windFilter.frequency.setTargetAtTime(450+Math.sin(elapsed*.15)*180,audio.currentTime,.6);footGain.gain.setTargetAtTime(state.active&&(keys.has('KeyW')||keys.has('KeyS')||keys.has('KeyA')||keys.has('KeyD'))&&camera.position.y<snowHeight(camera.position.x,camera.position.z)+2.3?.008*(.4+Math.sin(elapsed*12)**6):0,audio.currentTime,.1);}
  renderer.render(scene,camera);state.frames++;
 });
 await renderer.compileAsync(scene,camera);state.ready=true;$('loading').classList.add('gone');setTimeout(()=>$('loading').hidden=true,1200);
 // Read-only telemetry used by automated acceptance checks and performance inspection.
 window.__forest={get state(){return {...state,position:camera.position.toArray(),rotation:camera.rotation.toArray(),trees:forest.layout.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,assetErrors:[...assetErrors]};},terrainHeight:snowHeight};
 }catch(error){console.error(error);showError(`This forest needs a browser with WebGL 2 support. ${error.message}`);}
}
function showError(message){$('loading').hidden=true;$('error').hidden=false;$('error').textContent=message;}
function createGroundDetails({snowMaterial,bark,rock}){
 const mossMat=new THREE.MeshStandardMaterial({color:0x45513a,roughness:1});const lichenMat=new THREE.MeshStandardMaterial({color:0x9aab8d,roughness:1});
 // A shared irregular boulder surface; snow conforms to the upper surface.
 const rockGeo=new THREE.IcosahedronGeometry(1,3),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const v=new THREE.Vector3().fromBufferAttribute(rp,i);v.multiplyScalar(.9+noise(v.x*4+12,v.z*4+v.y)*.22);rp.setXYZ(i,v.x,v.y,v.z);}rockGeo.computeVertexNormals();
 const capGeo=new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.52),cp=capGeo.attributes.position,cu=capGeo.attributes.uv;
 for(let i=0;i<cp.count;i++){const v=new THREE.Vector3().fromBufferAttribute(cp,i);v.multiplyScalar(1.02+noise(v.x*4+12,v.z*4+v.y)*.13);v.y+=.12;cp.setXYZ(i,v.x,v.y,v.z);cu.setXY(i,v.x,v.z);}capGeo.computeVertexNormals();
 const boulders=[];const rocksMesh=new THREE.InstancedMesh(rockGeo,rock,165),capsMesh=new THREE.InstancedMesh(capGeo,snowMaterial,165);
 for(let i=0;i<165;i++){
  const a=random()*Math.PI*2,d=Math.sqrt(random())*108;let x=Math.cos(a)*d,z=Math.sin(a)*d;
  if(i===0){x=6;z=5;}if(i===1){x=-4;z=-1;}
  const size=.3+random()*1.65,y=snowHeight(x,z)-size*.35;
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=random()*6;g.scale.set(size,size*(.55+random()*.3),size*(.8+random()*.3));
  g.updateMatrixWorld();rocksMesh.setMatrixAt(i,g.matrixWorld);capsMesh.setMatrixAt(i,g.matrixWorld);boulders.push(g);
 }
 rocksMesh.castShadow=rocksMesh.receiveShadow=capsMesh.castShadow=capsMesh.receiveShadow=true;scene.add(rocksMesh,capsMesh);
 // Moss and fine branching lichen follow exposed boulder faces.
 const patchGeo=new THREE.IcosahedronGeometry(.075,1),moss=new THREE.InstancedMesh(patchGeo,mossMat,165*15),lichen=new THREE.InstancedMesh(patchGeo,lichenMat,165*15),o=new THREE.Object3D();let mi=0,li=0;
 for(const group of boulders){group.updateMatrixWorld();for(let j=0;j<15;j++){
  const a=random()*Math.PI*2,y=-.05-random()*.55,v=new THREE.Vector3(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y));
  o.position.copy(v.multiplyScalar(1.055)).applyMatrix4(group.matrixWorld);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());o.scale.set(.6+random()*1.2,.11,.5+random());o.updateMatrix();moss.setMatrixAt(mi++,o.matrix);
  o.position.add(new THREE.Vector3((random()-.5)*.05,.02,(random()-.5)*.05));o.scale.multiplyScalar(.38);o.updateMatrix();lichen.setMatrixAt(li++,o.matrix);
 }}scene.add(moss,lichen);
 const twigGeo=new THREE.CylinderGeometry(.008,.018,1,5);const twigMat=new THREE.MeshStandardMaterial({color:0x453c2e,roughness:1});
 const twigs=new THREE.InstancedMesh(twigGeo,twigMat,1800),leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,4),new THREE.MeshStandardMaterial({color:0x6b4f30,roughness:1}),650);
 for(let i=0;i<1800;i++){
  const a=random()*Math.PI*2,d=Math.sqrt(random())*105,x=Math.cos(a)*d,z=Math.sin(a)*d;o.position.set(x,snowHeight(x,z)+.015,z);o.rotation.set(Math.PI/2+(random()-.5)*.2,random()*6,random()*6);o.scale.set(1,.15+random()*.7,1);o.updateMatrix();twigs.setMatrixAt(i,o.matrix);
  if(i<650){o.position.y+=.01;o.rotation.set(0,random()*6,.1);o.scale.set(.028+random()*.025,.006,.06+random()*.05);o.updateMatrix();leaves.setMatrixAt(i,o.matrix);}
 }twigs.castShadow=true;leaves.receiveShadow=true;scene.add(twigs,leaves);
 // Fallen timber, with physical bark, a snow mantle, and translucent icicles.
 const ice=new THREE.MeshPhysicalMaterial({color:0xc5e5ed,roughness:.12,transmission:0,clearcoat:1,thickness:.05,ior:1.31,transparent:true,opacity:.75});
 const icicleGeometries=[];
 for(let i=0;i<14;i++){
  const x=i===0?7:(random()-.5)*170,z=i===0?1:(random()-.5)*170,y=snowHeight(x,z);const length=3+random()*5;
  const log=new THREE.Group();log.position.set(x,y+.15,z);log.rotation.y=random()*6;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,length,18,8),bark);trunk.rotation.z=Math.PI/2;trunk.castShadow=trunk.receiveShadow=true;log.add(trunk);
  const mantle=new THREE.Mesh(new THREE.CapsuleGeometry(.29,length-.5,6,12),snowMaterial);mantle.rotation.z=Math.PI/2;mantle.scale.set(1,1,.8);mantle.position.y=.16;mantle.receiveShadow=true;log.add(mantle);
  for(let j=0;j<12;j++){const icicle=new THREE.Mesh(new THREE.ConeGeometry(.012+random()*.013,.12+random()*.2,7),ice);icicle.rotation.z=Math.PI;icicle.position.set((random()-.5)*length,-.17,.19);log.updateMatrixWorld();icicle.updateMatrix();const geometry=icicle.geometry.clone().applyMatrix4(icicle.matrix).applyMatrix4(log.matrixWorld);icicleGeometries.push(geometry);icicle.geometry.dispose();}scene.add(log);
 }
 const iceMesh=new THREE.Mesh(mergeGeometries(icicleGeometries),ice);scene.add(iceMesh);icicleGeometries.forEach(g=>g.dispose());
 // Small stems poking out of the drifts, with forks instead of flat billboards.
 const grass=new THREE.InstancedMesh(new THREE.CylinderGeometry(.002,.006,1,4),new THREE.MeshStandardMaterial({color:0x8a8166,roughness:1}),2400);
 for(let i=0;i<2400;i++){const a=random()*6.283,d=Math.sqrt(random())*105,x=Math.cos(a)*d,z=Math.sin(a)*d;const h=.08+random()*.32;o.position.set(x,snowHeight(x,z)+h*.4,z);o.rotation.set((random()-.5)*.8,random()*6,(random()-.5)*.8);o.scale.set(1,h,1);o.updateMatrix();grass.setMatrixAt(i,o.matrix);}scene.add(grass);
}
function createSnowfall(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.translate(64,64);c.strokeStyle='#ffffff';c.lineWidth=2;c.lineCap='round';
 for(let j=0;j<6;j++){c.save();c.rotate(j*Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,48);for(let y=17;y<45;y+=12){c.moveTo(-10,y-9);c.lineTo(0,y);c.lineTo(10,y-9);}c.stroke();c.restore();}
 const map=new THREE.CanvasTexture(canvas),count=2300,positions=[],sizes=[];
 for(let i=0;i<count;i++){positions.push((random()-.5)*65,(random()-.5)*40,(random()-.5)*65);sizes.push(.6+random()*1.5);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
 const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uMap:{value:map},uRatio:{value:renderer.getPixelRatio()}},transparent:true,depthWrite:false,vertexShader:`attribute float aSize; uniform float uTime; uniform float uRatio; varying float vAlpha; void main(){vec3 p=position;p.y=mod(p.y-uTime*(.24+aSize*.1)+20.,40.)-20.;p.x+=sin(uTime*.25+p.z)*.7+uTime*.06;p.x=mod(p.x+32.5,65.)-32.5;p.z+=sin(p.x+uTime*.1)*.4;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*17.*uRatio/-mv.z,1.,46.);vAlpha=smoothstep(0.3,2.,-mv.z)*(.28+aSize*.2);}`,fragmentShader:`uniform sampler2D uMap;varying float vAlpha;void main(){vec4 t=texture2D(uMap,gl_PointCoord);gl_FragColor=vec4(.93,.97,1.,t.a*vAlpha);}`});
 snow=new THREE.Points(geo,mat);snow.frustumCulled=false;scene.add(snow);
}
function updateMovement(dt){
 const forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS')),side=Number(keys.has('KeyD'))-Number(keys.has('KeyA')),vertical=Number(keys.has('Space'))-Number(keys.has('ControlLeft')||keys.has('ControlRight'));
 const direction=new THREE.Vector3(side,vertical,-forward);if(direction.lengthSq()>0)direction.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw).multiplyScalar(movementSpeed(keys)*dt);
 camera.position.add(direction);constrainPosition(camera.position);
 // Keep the camera outside trunks while allowing free flight above them.
 for(const t of forest.layout){const dx=camera.position.x-t.x,dz=camera.position.z-t.z,d=Math.hypot(dx,dz),radius=.31*t.width+.18;
  if(d<radius&&camera.position.y<t.y+t.height&&d>.0001){camera.position.x=t.x+dx/d*radius;camera.position.z=t.z+dz/d*radius;}
 }
 constrainPosition(camera.position);camera.rotation.set(pitch,yaw,0);
 const distance=Math.hypot(camera.position.x,camera.position.z);$('boundary').hidden=distance<WARNING_RADIUS;
 $('position').textContent=`${camera.position.x.toFixed(0)} E · ${(-camera.position.z).toFixed(0)} N / ${Math.max(0,WORLD_RADIUS-distance).toFixed(0)} M TO EDGE`;
}
function enter(){
 if(!state.ready)return;
 $('help-panel').hidden=true;
 if(mobile){activate();$('touch-controls').hidden=false;}else{
  try{const result=renderer.domElement.requestPointerLock();result?.catch(()=>{activate();$('controls-hint').textContent='DRAG TO LOOK · WASD MOVE · ESC PAUSE';});}catch{activate();}
 }
}
function activate(){state.active=true;state.everEntered=true;document.body.classList.add('exploring');$('reticle').hidden=false;}
function pause(){state.active=false;keys.clear();document.body.classList.remove('exploring');$('reticle').hidden=true;$('enter').innerHTML='Return to the forest <span>↗</span>';$('boundary').hidden=true;}
function toggleHelp(){if(document.pointerLockElement)document.exitPointerLock();else if(state.active)pause();$('help-panel').hidden=!$('help-panel').hidden;}
$('enter').addEventListener('click',enter);$('help').addEventListener('click',toggleHelp);$('close-help').addEventListener('click',()=>$('help-panel').hidden=true);
document.addEventListener('pointerlockchange',()=>{state.locked=document.pointerLockElement===renderer?.domElement;if(state.locked)activate();else if(state.active)pause();});
let dragging=false,lastTouch;
document.addEventListener('pointerdown',e=>{if(e.target===renderer?.domElement&&state.active){dragging=true;lastTouch={x:e.clientX,y:e.clientY};}});
document.addEventListener('pointerup',()=>dragging=false);
document.addEventListener('pointermove',e=>{if(!state.active)return;let dx=0,dy=0;if(state.locked){dx=e.movementX;dy=e.movementY;}else if(dragging){dx=e.clientX-lastTouch.x;dy=e.clientY-lastTouch.y;lastTouch={x:e.clientX,y:e.clientY};}yaw-=dx*.0018;pitch=Math.max(-Math.PI*.49,Math.min(Math.PI*.49,pitch-dy*.0018));});
window.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(['Space','ControlLeft','ControlRight','AltLeft','AltRight','Tab'].includes(e.code)&&state.active)e.preventDefault();if(e.repeat)return;if(e.code==='KeyH'){toggleHelp();return;}if(e.code==='KeyM'){toggleSound();return;}if(e.code==='Escape'){if(document.pointerLockElement)document.exitPointerLock();pause();return;}keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(state.active&&!state.locked)pause();});
document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&audio)audio.suspend();else if(audio&&state.sound)audio.resume();});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const event of ['pointerup','pointercancel'])b.addEventListener(event,()=>keys.delete(b.dataset.key));}
async function toggleSound(){
 if(!audio){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();const buffer=audio.createBuffer(1,audio.sampleRate*8,audio.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=(last+(.02*(Math.random()*2-1)))/1.02;data[i]=last*3.5;}
  const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;windFilter=audio.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=450;windGain=audio.createGain();windGain.gain.value=0;source.connect(windFilter).connect(windGain).connect(audio.destination);source.start();
  const crunch=audio.createBufferSource();crunch.buffer=buffer;crunch.loop=true;const filter=audio.createBiquadFilter();filter.type='highpass';filter.frequency.value=1100;footGain=audio.createGain();footGain.gain.value=0;crunch.connect(filter).connect(footGain).connect(audio.destination);crunch.start();
 }
 state.sound=!state.sound;if(state.sound)await audio.resume();else{windGain.gain.setTargetAtTime(0,audio.currentTime,.2);footGain.gain.setTargetAtTime(0,audio.currentTime,.1);}
 $('sound-state').textContent=state.sound?'ON':'OFF';$('sound').setAttribute('aria-label',state.sound?'Mute forest sound':'Enable forest sound');
}
$('sound').addEventListener('click',toggleSound);
$('quality').addEventListener('change',e=>{state.quality=e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio,state.quality==='high'?1.75:1));renderer.shadowMap.enabled=state.quality==='high';renderer.shadowMap.needsUpdate=true;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});snow.material.uniforms.uRatio.value=renderer.getPixelRatio();});
window.addEventListener('resize',()=>{if(!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
init();
