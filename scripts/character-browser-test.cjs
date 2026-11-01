const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  try{
    await page.goto('http://127.0.0.1:4173/test-accra-characters.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('male loaded'),null,{timeout:45000});
    const maleStatus=await page.locator('#status').innerText();
    await page.locator('#female').click();
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('female loaded'),null,{timeout:45000});
    const femaleStatus=await page.locator('#status').innerText();
    await page.locator('#walk').click();
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Playing Walk'),null,{timeout:10000});
    const walkStatus=await page.locator('#status').innerText();
    await page.locator('#run').click();
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Playing Run'),null,{timeout:10000});
    const runStatus=await page.locator('#status').innerText();
    const labErrors=errors.splice(0);
    if(labErrors.length)throw new Error('Character Lab browser errors: '+labErrors.join(' | '));

    await page.goto('http://127.0.0.1:4173/babylon.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.innerText.includes('ACCRA LIFE'),null,{timeout:15000});
    await page.waitForFunction(()=>window.__accraCharacterLoaded===true,null,{timeout:45000});
    await page.waitForSelector('#startScreen button[data-v="female"]',{timeout:30000});
    await page.locator('#startScreen button[data-v="female"]').click();
    await page.locator('#sStart').click();
    await page.waitForFunction(()=>window.ACCRA_PLAYER_MODEL&&window.ACCRA_PLAYER_MODEL.gender()==='female',null,{timeout:45000});
    await page.keyboard.down('w');
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='walk',null,{timeout:10000});
    await page.keyboard.down('Shift');
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='run',null,{timeout:10000});
    await page.keyboard.up('Shift');await page.keyboard.up('w');
    const mainErrors=errors.filter(x=>x.includes('[AccraLifePlayer] Model load failed'));
    if(mainErrors.length)throw new Error('Main game browser errors: '+mainErrors.join(' | '));
    console.log(JSON.stringify({pass:true,maleStatus,femaleStatus,walkStatus,runStatus,mainPageLoaded:true,mainConsoleErrors:mainErrors},null,2));
  }catch(e){const status=await page.locator('#status').innerText().catch(()=>'(no status element)');console.error(JSON.stringify({error:e.message,status,errors},null,2));process.exitCode=1;}
  finally{await browser.close();}
})();
