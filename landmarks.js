// landmarks.js - Labadi Beach and sea for the Babylon.js game.
// The western Accra Sports Stadium has been removed: it covered the apartment site.
// Independence Square has been removed.
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
})();
