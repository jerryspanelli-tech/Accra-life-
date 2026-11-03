/* accra-people.js
 * Real rigged 3D NPC pipeline for pedestrians, police and remote players.
 * Uses the same locally hosted AccraLife GLBs as the player. Keeps the
 * synchronous createCharacter API while models load asynchronously.
 */
(function(){
  try{
    const B=window.BABYLON;
    if(!B||!B.SceneLoader) throw new Error("Babylon glTF loader is not ready");
    const baseUrl=new URL("./People/AccraLife/",window.location.href).href;
    const files={
      male:["AccraLife_Male.glb","AccraLife_Male_Kente.glb","AccraLife_Male_Suit.glb"],
      female:["AccraLife_Female.glb","AccraLife_Female_Ankara.glb","AccraLife_Female_Pantsuit.glb"]
    };
    const containers=new Map(),spawned=new Set();
    let sequence=0;
    const TOPS=["#9a4a42","#c9a54a","#56705a","#4d6a8a","#e8e6df","#2a2c30","#7a6a8a","#c08a5a"];
    const PANTS=["#1f2a44","#111111","#5b4630","#6b6b6b","#2f5d3a","#b8a27a"];

    function choose(options){
      const o=options||{},gender=o.gender==="female"?"female":"male";
      let outfit=0;
      if(o.police) outfit=0;
      else if(gender==="female"){
        outfit=(o.outfit==="suit"||o.style===1)?2:(o.outfit==="ankara"||o.style===4?1:((sequence%3===1)?1:0));
      }else{
        outfit=(o.outfit==="suit"||o.style===1)?2:(o.outfit==="kente"||o.style===6?1:((sequence%4===1)?1:0));
      }
      return {gender,file:files[gender][outfit]};
    }
    function loadContainer(file){
      if(!containers.has(file)){
        const p=B.SceneLoader.LoadAssetContainerAsync(baseUrl,file);
        containers.set(file,p);
        p.catch(()=>containers.delete(file));
      }
      return containers.get(file);
    }
    function materialColor(material,hex){
      if(!material||!hex)return;
      const color=B.Color3.FromHexString(hex);
      if(material.albedoColor) material.albedoColor=color;
      if(material.diffuseColor) material.diffuseColor=color;
    }
    function customize(instance,options){
      const o=options||{};
      const look=o.look||o;
      const top=typeof o.shirtHex==="string"?o.shirtHex:(typeof o.shirt==="string"?o.shirt:(Number.isInteger(look.top)?TOPS[look.top%TOPS.length]:null));
      const pants=typeof o.pantsHex==="string"?o.pantsHex:(Number.isInteger(look.pants)?PANTS[look.pants%PANTS.length]:null);
      const police=!!o.police;
      const meshes=instance.rootNodes.flatMap(n=>[...(n.getChildMeshes? n.getChildMeshes(false):[])]);
      meshes.forEach(mesh=>{
        const m=mesh.material;if(!m)return;
        const name=String(m.name||"").toLowerCase();
        if(police){
          if(/tee|shirt|top|jacket|cloth/.test(name)) materialColor(m,"#18365f");
          else if(/jean|pant|trouser/.test(name)) materialColor(m,"#101a2b");
        }else{
          if(top&&/tee|shirt|top|cloth/.test(name)) materialColor(m,top);
          if(pants&&/jean|pant|trouser/.test(name)) materialColor(m,pants);
        }
        if(o.skinTone&&/skin|body/.test(name))materialColor(m,o.skinTone);
      });
    }
    function playState(record){
      if(!record.ready)return;
      const groups=record.groups||[];
      const desired=record.speed>4
        ? (groups.find(g=>/run/i.test(g.name))||groups.find(g=>/walk/i.test(g.name)))
        : (record.speed>.18
          ? (groups.find(g=>/walk/i.test(g.name))||groups.find(g=>/run/i.test(g.name)))
          : (groups.find(g=>/idle/i.test(g.name))||groups.find(g=>/stand/i.test(g.name))));
      if(!desired)return;
      if(record.active===desired&&desired.isPlaying)return;
      groups.forEach(g=>{if(g!==desired)g.stop();});
      desired.start(true);
      record.active=desired;
    }
    function spawn(parent,options){
      const o=options||{},id=++sequence,choice=choose(o);
      const root=new B.TransformNode("accraNpc_"+id,scene);
      if(parent)root.parent=parent;
      root.position.y=0;
      const record={id,root,groups:[],active:null,ready:false,speed:0,instance:null,legacy:null,disposed:false};
      spawned.add(record);
      const setMoving=value=>{record.speed=typeof value==="number"?Math.max(0,value):(value?2:0);playState(record);};
      const dispose=()=>{
        if(record.disposed)return;record.disposed=true;spawned.delete(record);
        if(record.groups)record.groups.forEach(g=>g.dispose());
        root.dispose(false,true);
      };
      record.dispose=dispose;
      record.readyPromise=loadContainer(choice.file).then(container=>{
        if(record.disposed)return;
        const instance=container.instantiateModelsToScene(n=>"npc"+id+"_"+n,true);
        record.instance=instance;
        instance.rootNodes.forEach(n=>{n.parent=root;n.rotationQuaternion=null;});
        const bounds=root.getHierarchyBoundingVectors(true),height=bounds.max.y-bounds.min.y;
        if(!Number.isFinite(height)||height<.1)throw new Error("NPC model has invalid dimensions: "+choice.file);
        const scale=1.8/height;
        root.scaling.setAll(scale);
        root.position.y=-bounds.min.y*scale;
        customize(instance,o);
        record.groups=instance.animationGroups||[];
        record.ready=true;
        playState(record);
        root.metadata=Object.assign({},root.metadata,{accraNpc:true,gender:choice.gender,model:choice.file});
        return record;
      }).catch(error=>{
        console.error("[AccraPeople] Could not load "+choice.file,error);
        if(record.disposed)return;
        // Keep gameplay functional if a model file is unavailable; this is a
        // last-resort fallback only, never the normal NPC path.
        if(window.AccraFigure&&window.AccraFigure.human){
          const legacy=window.AccraFigure.human(o);
          if(legacy&&legacy.root){legacy.root.parent=root;record.legacy=legacy;}
        }
        record.ready=true;
        return record;
      });
      return {root,setMoving,dispose,ready:()=>record.ready,readyPromise,model:()=>record.instance?choice.file:null};
    }
    window.ACCRA_PEOPLE={
      spawn,
      ready:()=>true,
      count:()=>spawned.size,
      loadedModels:()=>Array.from(containers.keys()),
      disposeAll:()=>Array.from(spawned).forEach(p=>p.dispose&&p.dispose())
    };
    if(window.AccraAssets){
      window.AccraAssets.createCharacter=(scn,o)=>spawn(null,o);
    }
    (window.ACCRA_MODULES=window.ACCRA_MODULES||{}).people=1;
    console.log("[AccraPeople] Rigged AccraLife 3D NPC pipeline ready.");
  }catch(err){console.error("accra-people 3D pipeline failed:",err);}
})();
