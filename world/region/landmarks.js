// landmarks.js - Labadi Beach and sea for the Babylon.js game.
// Upgraded to feel like real Labadi Beach, Ghana: umbrellas, chairs, football, horses, couples, kiosks, and NPCs.
(function(){
 const E=window.ACCRA_LANDMARKS=[];
 const M=o=>Object.assign(new BABYLON.StandardMaterial('lm',scene),o);
 
 const lbl=(t,x,y,z,rot,w)=>{const dt=new BABYLON.DynamicTexture('lb',{width:512,height:128},scene,true),c=dt.getContext();c.fillStyle='#17191c';c.fillRect(0,0,512,128);c.fillStyle='#c9a54a';c.font='bold 44px Trebuchet MS';c.textAlign='center';c.textBaseline='middle';c.fillText(t,256,64);dt.update();
  const p=BABYLON.MeshBuilder.CreatePlane('lb',{width:w||16,height:4},scene);p.position.set(x,y,z);p.rotation.y=rot||0;p.material=M({diffuseTexture:dt,emissiveTexture:dt,disableLighting:true,backFaceCulling:false});p.isPickable=false;return p};

 // ================= LABADI BEACH AND SEA (south) =================
 const sand=BABYLON.MeshBuilder.CreateGround('sand',{width:300,height:70},scene);sand.position.set(0,.04,222);sand.material=mat('#e3cf9b');sand.receiveShadows=true;
 const sea=BABYLON.MeshBuilder.CreateGround('sea',{width:700,height:300},scene);sea.position.set(0,.12,415);sea.material=M({diffuseColor:C3('#2f7f9f'),specularColor:new BABYLON.Color3(.9,.9,.9),specularPower:60});
 const wall=BABYLON.MeshBuilder.CreateBox('sw',{width:700,height:4,depth:1},scene);wall.position.set(0,2,268);wall.isVisible=false;wall.checkCollisions=true;
 
 if(typeof palm==='function')for(let x=-120;x<=120;x+=34)palm(x,208+(Math.abs(x)%3)*4);
 
 lbl('LABADI BEACH',0,6,200,Math.PI,14);
 E.push({n:'Labadi Beach',x:0,z:222});

 // ================= BEACH PROPS =================
 function umbrella(x, z, color) {
   const pole = BABYLON.MeshBuilder.CreateCylinder("upole", { height: 3, diameter: 0.1 }, scene);
   pole.position.set(x, 1.5, z); pole.material = mat("#dddddd"); pole.checkCollisions = true;
   const canopy = BABYLON.MeshBuilder.CreateCylinder("ucan", { diameterTop: 0, diameterBottom: 4, height: 0.6, tessellation: 8 }, scene);
   canopy.position.set(x, 3, z); canopy.material = mat(color);
 }
 
 function beachChair(x, z, ry) {
   const chair = new BABYLON.TransformNode("bchair", scene);
   chair.position.set(x, 0, z); chair.rotation.y = ry;
   const seat = BABYLON.MeshBuilder.CreateBox("cseat", { width: 1.2, height: 0.1, depth: 2 }, scene);
   seat.parent = chair; seat.position.set(0, 0.5, 0); seat.rotation.x = -0.2; seat.material = mat("#8a5a2b");
   const back = BABYLON.MeshBuilder.CreateBox("cback", { width: 1.2, height: 0.1, depth: 1 }, scene);
   back.parent = chair; back.position.set(0, 1, -0.8); back.rotation.x = 0.8; back.material = mat("#8a5a2b");
   const legs = BABYLON.MeshBuilder.CreateBox("clegs", { width: 1, height: 0.5, depth: 1.5 }, scene);
   legs.parent = chair; legs.position.set(0, 0.25, 0); legs.material = mat("#5a3a22");
 }
 
 function footballGoal(x, z, dir) {
   const g = new BABYLON.TransformNode("goal", scene); g.position.set(x, 0, z); g.rotation.y = dir;
   const p1 = BABYLON.MeshBuilder.CreateCylinder("gp1", { height: 2, diameter: 0.1 }, scene); p1.parent = g; p1.position.set(-3, 1, 0); p1.material = mat("#ffffff");
   const p2 = BABYLON.MeshBuilder.CreateCylinder("gp2", { height: 2, diameter: 0.1 }, scene); p2.parent = g; p2.position.set(3, 1, 0); p2.material = mat("#ffffff");
   const bar = BABYLON.MeshBuilder.CreateCylinder("gbar", { height: 6, diameter: 0.1 }, scene); bar.parent = g; bar.position.set(0, 2, 0); bar.rotation.z = Math.PI/2; bar.material = mat("#ffffff");
 }
 
 // Build the props ON THE SAND (z = 185 to 200)
 for(let i=-80; i<=80; i+=20) { umbrella(i, 195, i%40===0?"#c8102e":"#fcd116"); }
 for(let i=-60; i<=60; i+=15) { beachChair(i, 197, 0); }
 footballGoal(-40, 188, 0);
 footballGoal(40, 188, Math.PI);

 setTimeout(() => {
   if (window.AccraAssets && window.AccraAssets.createKiosk) {
     window.AccraAssets.createKiosk(scene, { position: [-20, 0, 185], color: "#d9382c", awning: "#ffd23f" });
     window.AccraAssets.createKiosk(scene, { position: [20, 0, 185], color: "#2f7fd0", awning: "#ffffff" });
   }
 }, 2000);

 // ================= NPC & ANIMAL SPAWNER =================
 setTimeout(() => {
   if (!window.AccraAssets || !window.AccraAssets.createCharacter) return;

   const spawnPerson = (x, z, ry, shirt, pants) => {
     const npc = window.AccraAssets.createCharacter(scene, { shirt, pants, skin: "#8d5a3b", hair: "#1b1b1b", kente: false });
     npc.root.position.set(x, 0, z);
     npc.root.rotation.y = ry;
     if (npc.setMoving) npc.setMoving(false); // Force them to stand still
     return npc;
   };

   const spawnCouple = (x, z, ry) => {
     spawnPerson(x - 0.6, z, ry, "#c9a54a", "#17191c"); // Person 1
     spawnPerson(x + 0.6, z, ry, "#2456a6", "#ffffff"); // Person 2
     // Removed setMoving(true) so they don't slide
   };

   const spawnHorse = (x, z, ry) => {
     const horse = new BABYLON.TransformNode("horse", scene);
     horse.position.set(x, 0, z); horse.rotation.y = ry;
     const body = BABYLON.MeshBuilder.CreateBox("hbody", { width: 1, height: 1.2, depth: 2.5 }, scene);
     body.parent = horse; body.position.set(0, 1.2, 0); body.material = mat("#5a3a22");
     const neck = BABYLON.MeshBuilder.CreateBox("hneck", { width: 0.6, height: 1, depth: 0.8 }, scene);
     neck.parent = horse; neck.position.set(0, 2, 1); neck.rotation.x = -0.5; neck.material = mat("#5a3a22");
     const head = BABYLON.MeshBuilder.CreateBox("hhead", { width: 0.4, height: 0.5, depth: 1 }, scene);
     head.parent = horse; head.position.set(0, 2.3, 1.6); head.material = mat("#5a3a22");
     [[-0.4, -0.8], [0.4, -0.8], [-0.4, 0.8], [0.4, 0.8]].forEach(p => {
       const leg = BABYLON.MeshBuilder.CreateCylinder("hleg", { height: 1.2, diameter: 0.2 }, scene);
       leg.parent = horse; leg.position.set(p[0], 0.6, p[1]); leg.material = mat("#5a3a22");
     });
     const rider = window.AccraAssets.createCharacter(scene, { shirt: "#c8102e", pants: "#17191c", skin: "#8d5a3b", hair: "#1b1b1b", kente: false });
     rider.root.parent = horse; rider.root.position.set(0, 1.6, 0);
     if (rider.setMoving) rider.setMoving(false);
   };

   // Footballers
   spawnPerson(-40, 188, 0, "#c8102e", "#ffffff");
   spawnPerson(-38, 188, Math.PI, "#2456a6", "#17191c");

   // Drummers
   spawnPerson(-5, 192, Math.PI/2, "#fcd116", "#17191c");
   spawnPerson(0, 192, Math.PI/2, "#3f8f7a", "#17191c");
   spawnPerson(5, 192, Math.PI/2, "#9a4a42", "#17191c");

   // People chilling
   for(let i=0; i<5; i++) {
     spawnPerson(-30 + (i*15), 198, Math.PI, ["#ffffff", "#17191c", "#e6e0d4", "#c9a54a", "#2b2f36"][i], "#5b4630");
   }

   // Vendors
   spawnPerson(-22, 186, 0, "#f0f0f0", "#111111");
   spawnPerson(22, 186, 0, "#f0f0f0", "#111111");

   // Couples
   spawnCouple(-60, 196, Math.PI);
   spawnCouple(50, 196, Math.PI);
   spawnCouple(70, 194, Math.PI);

   // Horses
   spawnHorse(-80, 190, Math.PI/2);
   spawnHorse(80, 190, -Math.PI/2);
   spawnHorse(15, 200, Math.PI);

   console.log("Labadi Beach populated safely on the sand!");

 }, 4000);
})();
