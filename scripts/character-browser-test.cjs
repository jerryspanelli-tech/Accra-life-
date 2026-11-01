const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
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
    await page.waitForFunction(()=>window.__accraSelectionPreviewLoaded==='male',null,{timeout:45000});
    await page.waitForSelector('#startScreen button[data-v="female"]',{timeout:30000});
    await page.locator('#startScreen button[data-v="female"]').click();
    await page.waitForFunction(()=>window.__accraSelectionPreviewLoaded==='female',null,{timeout:45000});
    await page.locator('#sStart').click();
    await page.waitForFunction(()=>window.ACCRA_PLAYER_MODEL&&window.ACCRA_PLAYER_MODEL.gender()==='female',null,{timeout:45000});
    const femaleInspection=await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.inspect());
    const femaleEyeZ=femaleInspection.find(m=>m.material==='Eyes')?.ranges?.[0]?.center?.[2];
    const femaleHairMaterial=femaleInspection.find(m=>m.material&&/braid|cornrow|hair/i.test(m.material))?.material||null;
    if(!(femaleEyeZ>0))throw new Error('Female model face direction is not +Z; eye geometry centroid='+femaleEyeZ);
    await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.setGender('male'));
    await page.waitForFunction(()=>window.ACCRA_PLAYER_MODEL.gender()==='male',null,{timeout:45000});
    await page.waitForFunction(()=>window.ACCRA_PLAYER_MODEL.ready(),null,{timeout:45000});
    const maleInspection=await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.inspect());
    const maleEyeZ=maleInspection.find(m=>m.material==='Eyes')?.ranges?.[0]?.center?.[2];
    const maleMaterials=[...new Set(maleInspection.map(m=>m.material).filter(Boolean))];
    const maleHairMaterial=maleInspection.find(m=>m.material&&/buzz|hair|short|scalp|cut/i.test(m.material))?.material||null;
    if(!(maleEyeZ>0))throw new Error('Male model face direction is not +Z; eye geometry centroid='+maleEyeZ);
    await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.setGender('female'));
    await page.waitForFunction(()=>window.ACCRA_PLAYER_MODEL.gender()==='female',null,{timeout:45000});
    await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.setAppearance({skin:2,top:2,pants:1,hcol:1,shoe:1}));
    const appearanceMaterials=await page.evaluate(()=>window.ACCRA_PLAYER_MODEL.inspect().filter(m=>['Skin','Oversized tee','Baggy jeans','Braids','Sneaker leather'].includes(m.material)).map(m=>({material:m.material,color:m.color})));
    const colorOf=name=>appearanceMaterials.find(m=>m.material===name)?.color;
    const appearanceCheck={skin:colorOf('Skin'),shirt:colorOf('Oversized tee'),trousers:colorOf('Baggy jeans'),hair:colorOf('Braids'),shoes:colorOf('Sneaker leather')};
    const expectedAppearance={skin:'#6b4028',shirt:'#56705a',trousers:'#111111',hair:'#2a1a10',shoes:'#111111'};
    for(const key of Object.keys(expectedAppearance))if(appearanceCheck[key]!==expectedAppearance[key])throw new Error('Appearance option did not apply to '+key+': '+JSON.stringify({appearanceCheck,expectedAppearance}));

    await page.keyboard.down('s');
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='walk',null,{timeout:10000});
    await page.waitForTimeout(400);
    const keyboardWalk=await page.evaluate(()=>{const p=window.__accraPlayerPosition,m=window.__accraMovementDirection,expected=Math.atan2(m.x,m.z),yaw=window.__accraPlayerFacingYaw;return{animation:window.__accraCurrentAnimation,running:window.__accraRunning,position:p,movement:m,yaw,expectedYaw:expected,yawError:Math.abs(Math.atan2(Math.sin(yaw-expected),Math.cos(yaw-expected)))};});
    if(keyboardWalk.yawError>.02)throw new Error('Player facing does not match live movement vector: '+JSON.stringify(keyboardWalk));
    await page.keyboard.down('Shift');
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='run',null,{timeout:10000});
    await page.keyboard.up('Shift');await page.keyboard.up('s');

    // Exercise the same pointer events used by the phone joystick.
    const joystick=await page.locator('#joy').boundingBox();
    await page.evaluate(({x,y})=>{
      const joy=document.getElementById('joy');
      joy.setPointerCapture=()=>{};
      const fire=(type,px,py)=>joy.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',clientX:px,clientY:py}));
      fire('pointerdown',x,y);
      fire('pointermove',x+15,y);
    },{x:joystick.x+joystick.width/2,y:joystick.y+joystick.height/2});
    await page.waitForFunction(()=>window.__accraRunning===false,null,{timeout:5000});
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='walk',null,{timeout:10000});
    const joystickWalk=await page.evaluate(()=>({animation:window.__accraCurrentAnimation,running:window.__accraRunning}));
    await page.evaluate(({x,y})=>{
      const joy=document.getElementById('joy');
      joy.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',clientX:x+42,clientY:y}));
    },{x:joystick.x+joystick.width/2,y:joystick.y+joystick.height/2});
    await page.waitForFunction(()=>window.__accraRunning===true,null,{timeout:5000});
    await page.waitForFunction(()=>window.__accraCurrentAnimation==='run',null,{timeout:10000});
    const joystickRun=await page.evaluate(()=>({animation:window.__accraCurrentAnimation,running:window.__accraRunning}));
    await page.evaluate(({x,y})=>{
      const joy=document.getElementById('joy');
      joy.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',clientX:x,clientY:y}));
    },{x:joystick.x+joystick.width/2,y:joystick.y+joystick.height/2});

    const mainErrors=errors.filter(x=>x.includes('[AccraLifePlayer] Model load failed')||x.includes('[accra-start] 3D preview failed'));
    if(mainErrors.length)throw new Error('Main game character errors: '+mainErrors.join(' | '));
    console.log(JSON.stringify({pass:true,maleStatus,femaleStatus,walkStatus,runStatus,selectionPreview:'female GLB preview loaded',playableGender:'female',selectionPreview:'male and female previews loaded',femaleEyeZ,femaleHairMaterial,maleEyeZ,maleHairMaterial,maleMaterials,appearanceCheck,keyboardWalk,joystickWalk,joystickRun,mainConsoleErrors:mainErrors},null,2));
  }catch(e){
    const status=await page.locator('#status').innerText().catch(()=>'(no status element)');
    const diagnostics=await page.evaluate(()=>({animation:window.__accraCurrentAnimation,running:window.__accraRunning,position:window.__accraPlayerPosition})).catch(()=>null);
    console.error(JSON.stringify({error:e.message,status,diagnostics,errors},null,2));process.exitCode=1;
  }finally{await browser.close();}
})();
