import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf'};
let server,baseURL=process.env.FOREST_URL;
if(!baseURL){server=createServer((req,res)=>{const file=path.resolve('dist','.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(path.resolve('dist')+path.sep)&&file!==path.resolve('dist')){res.writeHead(403).end();return;}const target=file===path.resolve('dist')?path.join(file,'index.html'):file;try{res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});res.end(fs.readFileSync(target));}catch{res.writeHead(404).end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));baseURL='http://127.0.0.1:'+server.address().port;}
const fallback='/home/take44444/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync(fallback)?fallback:undefined);
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:Number(process.env.FOREST_DPR||.5)});
page.setDefaultTimeout(120000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
try{
 console.log('Opening forest');await page.goto(baseURL,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__forest?.state.ready,null,{timeout:180000});await page.waitForFunction(()=>document.getElementById('loading').hidden,null,{timeout:120000});
 const state=()=>page.evaluate(()=>window.__forest.state);
 console.log('Initial render',await state());
 console.log('Capturing overview');const cdp=await page.context().newCDPSession(page);const shot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/boreal-overview.png',Buffer.from(shot.data,'base64'));console.log('Overview saved');
 assert.equal((await state()).assetErrors.length,0);assert.ok((await state()).trees>600);
 if(process.env.SMOKE_ONLY!=='1'){
 await page.selectOption('#quality','balanced');
 await page.click('#enter');await page.waitForFunction(()=>window.__forest.state.active);console.log('Entered forest');
 let before=await state();await page.keyboard.down('KeyW');await page.waitForFunction(z=>window.__forest.state.position[2]<z-.4,before.position[2],{timeout:120000});await page.keyboard.up('KeyW');let after=await state();assert.ok(after.position[2]<before.position[2]-.3);
 before=after;await page.keyboard.down('Space');await page.waitForFunction(y=>window.__forest.state.position[1]>y+.4,before.position[1],{timeout:120000});await page.keyboard.up('Space');
 before=await state();await page.keyboard.down('ControlLeft');await page.waitForFunction(y=>window.__forest.state.position[1]<y-.25,before.position[1],{timeout:120000});await page.keyboard.up('ControlLeft');
 before=await state();await page.mouse.move(650,330);await page.mouse.move(760,300);after=await state();assert.notEqual(before.rotation[1],after.rotation[1]);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__forest.state.active,null,{timeout:120000});await page.click('#help');assert.equal(await page.locator('#help-panel').isVisible(),true);await page.click('#close-help');
 await page.click('#sound');assert.equal((await state()).sound,true);await page.click('#sound');assert.equal((await state()).sound,false);
 console.log('Controls, pause, help, audio passed');
 // Exercise the actual boundary by flying there through normal keyboard input.
 await page.click('#enter');await page.keyboard.down('ShiftLeft');await page.keyboard.down('Space');
 await page.waitForFunction(()=>window.__forest.state.position[1]>25,null,{timeout:180000});await page.keyboard.up('Space');await page.keyboard.down('KeyD');
 await page.waitForFunction(()=>Math.hypot(window.__forest.state.position[0],window.__forest.state.position[2])>89,null,{timeout:180000});assert.equal(await page.locator('#boundary').isVisible(),true);
 await page.waitForFunction(()=>Math.hypot(window.__forest.state.position[0],window.__forest.state.position[2])>99.9,null,{timeout:120000});
 await page.keyboard.up('KeyD');await page.keyboard.up('ShiftLeft');after=await state();assert.ok(Math.hypot(after.position[0],after.position[2])<=100.001);
 const edgeShot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/boreal-boundary.png',Buffer.from(edgeShot.data,'base64'));
 console.log('Boundary warning and enforced limit passed',after.position);
 }
 assert.deepEqual(errors,[]);console.log('PASS: no rendering or runtime errors');
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
