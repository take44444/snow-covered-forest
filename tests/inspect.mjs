import {chromium} from '@playwright/test';
console.log('launch');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/home/take44444/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
console.log('new page');const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR',m.text());});
console.log('goto');await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded',timeout:30000});console.log('dom loaded');
for(let i=0;i<12;i++){await page.waitForTimeout(3000);console.log('state',await page.evaluate(()=>({status:document.getElementById('load-status').textContent,error:document.getElementById('error').textContent,world:window.__forest?.state})));if(await page.evaluate(()=>!!window.__forest?.state.ready))break;}
console.log('screenshot');await page.screenshot({path:'/tmp/boreal-first.png',timeout:60000});console.log('done');await browser.close();
