const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  try{
    await page.goto('http://127.0.0.1:4173/test-accra-npc-preview.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__npcTestReady===true,null,{timeout:90000});
    const results=await page.evaluate(()=>window.__npcTestResults);
    if(results.length!==5)throw new Error('Expected five NPCs, got '+results.length);
    for(const npc of results){
      if(!npc.ready||!npc.model)throw new Error('NPC model failed: '+JSON.stringify(npc));
      if(!npc.animations.some(n=>/walk/i.test(n)))throw new Error('Walk animation missing: '+JSON.stringify(npc));
      if(!npc.animations.some(n=>/idle/i.test(n)))throw new Error('Idle animation missing: '+JSON.stringify(npc));
    }
    if(errors.length)throw new Error(errors.join(' | '));
    console.log(JSON.stringify({passed:true,npcs:results},null,2));
  }finally{
    await browser.close();
  }
})();
