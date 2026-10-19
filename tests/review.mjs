import {chromium} from '@playwright/test';
import {serveBuild} from './static-server.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const server=await serveBuild('dist-review');
const fallback='/home/take44444/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync(fallback)?fallback:undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:720},deviceScaleFactor:1});page.setDefaultTimeout(180000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(server.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__forestReview);
 await page.addStyleTag({content:'header,footer,#intro,#loading,.vignette,#reticle{display:none!important}'});
 const a=await page.evaluate(()=>window.__forestReview.anchors),cases=[];
 if(a.crystal)cases.push({name:'crystal',...a.crystal});
 const tree=a.trees.reduce((best,t)=>Math.hypot(t.x-3,t.z-11)<Math.hypot(best.x-3,best.z-11)?t:best,a.trees[0]);
 for(const distance of [37,42.5,48])cases.push({name:'lod-'+distance,position:[tree.x+distance,tree.y+tree.height*.55,tree.z],target:[tree.x,tree.y+tree.height*.55,tree.z]});
 if(a.branch)cases.push({name:'branch',...a.branch});
 const previousBranch=JSON.parse(fs.readFileSync('artifacts/reviews/crystal-smooth.json','utf8')).metadata.branch;
 cases.push({name:'branch-reference',position:previousBranch.position,target:previousBranch.target});
 cases.push({name:'bark',position:[tree.x+.8,tree.y+1.3,tree.z],target:[tree.x+.3,tree.y+1.3,tree.z]});
 const rock=a.rocks[0],exposed=rock.exposed;if(exposed){const p=new THREE.Vector3(...exposed.position),n=new THREE.Vector3(...exposed.normal);cases.push({name:'rock',position:p.clone().addScaledVector(n,.5).add(new THREE.Vector3(0,.06,0)).toArray(),target:p.toArray()});}else cases.push({name:'rock',position:[rock.position[0],rock.position[1]+rock.scale[1]*.45,rock.position[2]+rock.scale[2]+.38],target:[rock.position[0],rock.position[1]+.08,rock.position[2]+rock.scale[2]*.75]});
 const moss=a.moss.find(m=>m.normal[1]>-.3)||a.moss[0];const mn=new THREE.Vector3(...moss.normal);const mp=new THREE.Vector3(...moss.position);
 cases.push({name:'moss',position:mp.clone().addScaledVector(mn,.25).add(new THREE.Vector3(0,.06,0)).toArray(),target:mp.toArray()});
 const icicle=a.icicles[0],ice=icicle.position||icicle;cases.push({name:'icicle',position:[ice[0]+.26,ice[1]-.03,ice[2]+.26],target:[ice[0],ice[1]-(icicle.length||.14)*.5,ice[2]]});
 if(a.lichen?.length){const p=new THREE.Vector3(...a.lichen[0].position),n=new THREE.Vector3(...a.lichen[0].normal);cases.push({name:'lichen',position:p.clone().addScaledVector(n,.2).add(new THREE.Vector3(0,.02,0)).toArray(),target:p.toArray()});}
 const leaf=a.leaves[0];cases.push({name:'leaf',position:[leaf[0]+.12,leaf[1]+.19,leaf[2]+.14],target:leaf});
 for(const [name,x,z] of [['edge-east',99,0],['edge-north',0,-99],['edge-west',-99,0],['edge-south',0,99]]){cases.push({name,position:[x,48,z],target:[x*2.3,15,z*2.3]});}
 const h=await page.evaluate(()=>window.__forest.terrainHeight(3,11));cases.push({name:'wide',position:[3,h+1.75,11],target:[1.8,h+2.95,-19]});cases.push({name:'snow',position:[3,h+.25,11],target:[3.25,h,10.8]});
 for(const p of [...a.moss,...(a.lichen||[])])assert.ok(p.position[1]>await page.evaluate(v=>window.__forest.terrainHeight(v[0],v[2]),p.position),'plant must be exposed above the snow');
 for(const p of a.icicles)if(p.position)assert.ok(p.position[1]-p.length>await page.evaluate(v=>window.__forest.terrainHeight(v[0],v[2]),p.position),'icicle tip must clear the snow');
 const cdp=await page.context().newCDPSession(page),prefix=process.env.REVIEW_PREFIX||'/tmp/boreal-review';
 const metadata={};
 for(const view of cases.filter(v=>!process.env.REVIEW_VIEWS||process.env.REVIEW_VIEWS.split(',').includes(v.name))){
  console.log('Rendering',view.name);metadata[view.name]=await page.evaluate(v=>window.__forestReview.setView(v.position,v.target),view);
  let image;
  if(view.name==='crystal'){
   const probe=await page.evaluate(()=>window.__forestReview.probeSnow());metadata[view.name].visibleChannels=probe.visibleChannels;console.log('Snow image channels',probe.visibleChannels);assert.ok(probe.visibleChannels>100,'close-up snowflake must render visible pixels');image=probe.image;
  }else image=(await cdp.send('Page.captureScreenshot',{format:'png'})).data;
  fs.writeFileSync(`${prefix}-${view.name}.png`,Buffer.from(image,'base64'));console.log('Saved',view.name);
 }
 fs.writeFileSync(`${prefix}.json`,JSON.stringify({metadata,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log('Review complete',prefix);
}finally{await browser.close();await server.close();}
