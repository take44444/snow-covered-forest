import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';
import {createForest} from './forest.js';
import {createAtmosphere} from './atmosphere.js';
import {createFrost} from './frost.js';
import {configureSnowMaterial,configureWorldMaterial} from './snow-material.js';
import {createGroundDetails} from './ground-details.js';
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
 configureSnowMaterial(snowMaterial);
 const branchSnow=configureWorldMaterial(snowMaterial.clone(),{repeat:.5,sparkle:true,albedoStrength:.2});
 const bark=new THREE.MeshStandardMaterial({map:texture(loader,'bark_brown_02','diff',2),normalMap:texture(loader,'bark_brown_02','nor_gl',2),roughnessMap:texture(loader,'bark_brown_02','rough',2),normalScale:new THREE.Vector2(.9,.9),roughness:1,color:0xa7aaa0});
 const rock=new THREE.MeshStandardMaterial({map:texture(loader,'rock_boulder_cracked','diff'),normalMap:texture(loader,'rock_boulder_cracked','nor_gl'),roughnessMap:texture(loader,'rock_boulder_cracked','rough'),roughness:1,color:0x8e9995});
 configureWorldMaterial(rock,{repeat:1,sparkle:false});
 const twig=texture(loader,'fir_tree_01_twig','diff'),twigNormal=texture(loader,'fir_tree_01_twig','nor_gl'),twigRough=texture(loader,'fir_tree_01_twig','rough');

 const mossMaps={diff:texture(loader,'moss_wood','diff'),normal:texture(loader,'moss_wood','nor_gl'),rough:texture(loader,'moss_wood','rough')};
 const sky=new Sky();sky.scale.setScalar(400);sky.material.uniforms.turbidity.value=5;sky.material.uniforms.rayleigh.value=1.2;sky.material.uniforms.mieCoefficient.value=.005;sky.material.uniforms.mieDirectionalG.value=.85;
 const sunDirection=new THREE.Vector3(-.5,.32,-.75).normalize();sky.material.uniforms.sunPosition.value.copy(sunDirection);
 const atmosphere=createAtmosphere(scene.fog.color,sunDirection);scene.add(atmosphere);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(sky,.04).texture;scene.environmentIntensity=.35;pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xdcecff,0x5b6d79,1));
 const sun=new THREE.DirectionalLight(0xffebcc,3.0);sun.position.copy(sunDirection.clone().multiplyScalar(70));sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.camera.near=1;sun.shadow.camera.far=155;sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);
 const terrain=new THREE.PlaneGeometry(640,640,640,640);terrain.rotateX(-Math.PI/2);const positions=terrain.attributes.position,uv=terrain.attributes.uv;const colors=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,snowHeight(x,z));uv.setXY(i,x/2,z/2);
  const c=.89+noise(x*.12,z*.12)*.1;colors.push(c,c*.995,c);
 }
 terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();snowMaterial.vertexColors=true;
 const ground=new THREE.Mesh(terrain,snowMaterial);ground.receiveShadow=true;scene.add(ground);
 await new Promise(resolve=>setTimeout(resolve,30));$('load-status').textContent='Laying snow on the branches…';
 await loaded;if(assetErrors.length)throw new Error('Some forest textures could not load. Please reload.');
 forest=await createForest(scene,{bark,branchSnow,twig,twigNormal,twigRough,manager});forest.update(camera);
 const groundDetails=createGroundDetails(scene,{snowMaterial:branchSnow,bark,rock,mossMaps}),detailAnchors=groundDetails.anchors;groundDetails.update(camera);createSnowfall();frost=createFrost(scene);frost.update(camera);
 await loaded;
 if(assetErrors.length)throw new Error('Some forest textures could not load. Please reload.');
 clock=new THREE.Clock();
 let frameWindow=0,frameCount=0,lastLOD=-1;
 renderer.setAnimationLoop(()=>{
  const rawDt=clock.getDelta(),dt=Math.min(rawDt,.25);elapsed+=dt;frameWindow+=rawDt;frameCount++;
  if(frameWindow>.7){state.fps=Math.round(frameCount/frameWindow);frameWindow=0;frameCount=0;}
  if(state.active){let remaining=dt;while(remaining>0){const step=Math.min(.04,remaining);updateMovement(step);remaining-=step;}}
  else if(!state.everEntered){camera.position.y=snowHeight(3,11)+1.75+Math.sin(elapsed*.3)*.015;camera.rotation.set(pitch+Math.sin(elapsed*.07)*.005,yaw+Math.sin(elapsed*.045)*.012,0);}
  if(elapsed-lastLOD>.5){const forestChanged=forest.update(camera);frost.update(camera);groundDetails.update(camera,state.quality);lastLOD=elapsed;const cx=Math.round(camera.position.x/8)*8,cz=Math.round(camera.position.z/8)*8;if(forestChanged||sun.target.position.x!==cx||sun.target.position.z!==cz){sun.target.position.set(cx,0,cz);sun.position.set(cx+sunDirection.x*70,sunDirection.y*70,cz+sunDirection.z*70);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;}}
  snow.material.uniforms.uTime.value=elapsed;snow.position.copy(camera.position);
  if(windGain&&state.sound){windGain.gain.setTargetAtTime(.025+Math.sin(elapsed*.23)*.009,audio.currentTime,.5);windFilter.frequency.setTargetAtTime(450+Math.sin(elapsed*.15)*180,audio.currentTime,.6);footGain.gain.setTargetAtTime(state.active&&(keys.has('KeyW')||keys.has('KeyS')||keys.has('KeyA')||keys.has('KeyD'))&&camera.position.y<snowHeight(camera.position.x,camera.position.z)+2.3?.008*(.4+Math.sin(elapsed*12)**6):0,audio.currentTime,.1);}
  atmosphere.position.copy(camera.position);renderer.render(scene,camera);state.frames++;
 });
 await renderer.compileAsync(scene,camera);state.ready=true;$('loading').classList.add('gone');setTimeout(()=>$('loading').hidden=true,1200);
 // This camera harness is compiled out of production builds.
 if(import.meta.env.MODE==='review'){
  renderer.setAnimationLoop(null);state.everEntered=true;
  window.__forestReview={anchors:{trees:forest.layout,branch:forest.branchView(forest.layout.reduce((a,b)=>Math.hypot(a.x-3,a.z-11)<Math.hypot(b.x-3,b.z-11)?a:b)),...detailAnchors},setView(position,target){
   camera.position.fromArray(position);camera.lookAt(new THREE.Vector3(...target));yaw=camera.rotation.y;pitch=camera.rotation.x;camera.updateMatrixWorld();forest.update(camera);frost.update(camera);groundDetails.update(camera);
   sun.target.position.set(camera.position.x,0,camera.position.z);sun.position.copy(sun.target.position).addScaledVector(sunDirection,70);sun.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
   atmosphere.position.copy(camera.position);renderer.render(scene,camera);return {position:camera.position.toArray(),target,triangles:renderer.info.render.triangles};
  }};
 }
 // Read-only telemetry used by automated acceptance checks and performance inspection.
 window.__forest={get state(){return {...state,position:camera.position.toArray(),rotation:camera.rotation.toArray(),trees:forest.layout.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,assetErrors:[...assetErrors]};},terrainHeight:snowHeight};
 }catch(error){console.error(error);showError(`This forest needs a browser with WebGL 2 support. ${error.message}`);}
}
function showError(message){$('loading').hidden=true;$('error').hidden=false;$('error').textContent=message;}
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
 forest.constrainTrunks(camera.position);
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
