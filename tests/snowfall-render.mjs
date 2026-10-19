import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
const fallback='/home/take44444/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync(fallback)?fallback:undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:400,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.resolvedUrls.local[0]+'src/snowfall.js');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createSnowfall}=await import('/src/snowfall.js');
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(400,400);document.body.replaceChildren(renderer.domElement);document.body.style.margin='0';
  const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.add(new THREE.HemisphereLight(0xffffff,0xffffff,3));
  const camera=new THREE.PerspectiveCamera(62,1,.035,320);camera.position.set(3,.35,11);const snow=createSnowfall(scene,1);snow.update(0,camera);const anchor=snow.reviewView();camera.position.fromArray(anchor.position);camera.lookAt(new THREE.Vector3(...anchor.target));camera.updateMatrixWorld();renderer.render(scene,camera);
  const pixels=new Uint8Array(400*400*4);renderer.getContext().readPixels(0,0,400,400,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,pixels);let visible=0;
  for(let y=170;y<230;y++)for(let x=170;x<230;x++)if(pixels[(y*400+x)*4]>40)visible++;
  return {visible,anchor};
 });console.log(result);await page.screenshot({path:'/tmp/boreal-crystal-probe.png'});assert.ok(result.visible>50,'live crystal must occupy visible pixels at its review anchor');assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close();}
