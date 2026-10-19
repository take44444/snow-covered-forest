import {chromium} from '@playwright/test';
import {serveBuild} from './static-server.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await serveBuild(),fallback='/home/take44444/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync(fallback)?fallback:undefined),args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:.5});page.setDefaultTimeout(180000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
async function ready(){await page.waitForFunction(()=>window.__forest?.state.ready);await page.waitForFunction(()=>document.getElementById('loading').hidden);assert.equal(await page.evaluate(()=>window.__forestReview),undefined);assert.deepEqual(await page.evaluate(()=>window.__forest.state.assetErrors),[]);}
try{
 console.log('Cold production load');await page.goto(server.url,{waitUntil:'domcontentloaded'});await ready();
 const cdp=await page.context().newCDPSession(page),shot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/boreal-production-updated.png',Buffer.from(shot.data,'base64'));
 for(const quality of ['balanced','high']){const frames=await page.evaluate(()=>window.__forest.state.frames);await page.selectOption('#quality',quality);await page.waitForFunction(f=>window.__forest.state.frames>f+1,frames);assert.equal(await page.evaluate(()=>window.__forest.state.quality),quality);console.log('Rendered quality',quality);}
 await page.click('#enter');await page.waitForFunction(()=>window.__forest.state.active);const z=await page.evaluate(()=>window.__forest.state.position[2]);await page.keyboard.down('KeyW');await page.waitForFunction(v=>window.__forest.state.position[2]<v-.3,z);await page.keyboard.up('KeyW');await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__forest.state.active);console.log('Production entry, movement and pause passed');
 console.log('Warm-cache reload');await page.reload({waitUntil:'domcontentloaded'});await ready();assert.deepEqual(errors,[]);console.log('PASS production render, both qualities, controls, warm reload; no review API or runtime errors');
}finally{await browser.close();await server.close();}
