/* Accra Life wardrobe data engine. Additive foundation; not yet wired into production meshes. */
(function (root) {
  "use strict";
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function hash(s) { let h=2166136261; s=String(s||""); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
  function random(seed, salt) { let x=(hash(seed)^hash(salt))>>>0; x^=x<<13; x^=x>>>17; x^=x<<5; return (x>>>0)/4294967296; }
  function create(clothes, hair) {
    if(!clothes || !Array.isArray(clothes.categories) || !hair || !Array.isArray(hair.styles)) throw new Error("Invalid Accra Life wardrobe catalogues");
    const items=[];
    clothes.categories.forEach(c=>c.items.forEach(name=>items.push({id:slug(name),name,category:c.id})));
    const styles=hair.styles;
    if(styles.some(s=>!s.id || !s.availability.includes("male") || !s.availability.includes("female"))) throw new Error("Every hairstyle must support both genders");
    const colours=(clothes.colourSystem.solids||[]).slice();
    const patterns=(clothes.colourSystem.patterns||[]).slice();
    const findItem=value=>items.find(i=>i.id===slug(value)||slug(i.name)===slug(value));
    function newLook(gender) { return {schemaVersion:1,gender:gender==="female"?"female":"male",equipped:{top:null,bottom:null,outerwear:null,footwear:null,dress:null,accessory:null,hairstyle:null},colours:{},patterns:{}}; }
    function equip(look,slot,value) {
      if(!Object.prototype.hasOwnProperty.call(look.equipped,slot)) throw new Error("Unknown wardrobe slot: "+slot);
      if(slot==="hairstyle") { const s=styles.find(x=>x.id===value); if(!s) throw new Error("Unknown hairstyle"); look.equipped[slot]=s.id; return s; }
      const item=value==null?null:findItem(value); if(value!=null&&!item) throw new Error("Unknown clothing item: "+value); look.equipped[slot]=item?item.id:null; return item;
    }
    function setColour(look,slot,hex) { if(!/^#[0-9a-f]{6}$/i.test(String(hex))) throw new Error("Use a six-digit hex colour"); look.colours[slot]=String(hex).toLowerCase(); }
    function setPattern(look,slot,value) { if(value!=null&&!patterns.includes(value)) throw new Error("Unknown pattern"); if(value==null) delete look.patterns[slot]; else look.patterns[slot]=value; }
    function npcLook(id,gender) {
      const g=gender==="male"||gender==="female"?gender:(random(id,"gender")<.5?"female":"male");
      const look=newLook(g);
      const pick=(list,salt)=>list.length?list[Math.floor(random(id,salt)*list.length)]:null;
      const tops=items.filter(i=>["traditional-local","streetwear","smart-and-formal","everyday-and-occasion"].includes(i.category));
      const shoes=items.filter(i=>i.category==="footwear");
      const top=pick(tops,"top"), shoe=pick(shoes,"shoes"), style=pick(styles.filter(s=>s.availability.includes(g)),"hair");
      if(top) look.equipped.top=top.id; if(shoe) look.equipped.footwear=shoe.id; if(style) look.equipped.hairstyle=style.id;
      if(colours.length) { look.colours.top=pick(colours,"top-colour"); look.colours.footwear=pick(colours,"shoe-colour"); }
      if(patterns.length&&random(id,"pattern-choice")>.55) look.patterns.top=pick(patterns,"pattern");
      look.npcId=String(id); return look;
    }
    function serialize(look) { return JSON.parse(JSON.stringify(look)); }
    function restore(data) {
      if(!data||data.schemaVersion!==1||!data.equipped) throw new Error("Invalid saved wardrobe");
      const look=newLook(data.gender);
      Object.keys(look.equipped).forEach(slot=>{if(data.equipped[slot]!=null)equip(look,slot,data.equipped[slot]);});
      Object.keys(data.colours||{}).forEach(slot=>setColour(look,slot,data.colours[slot]));
      Object.keys(data.patterns||{}).forEach(slot=>setPattern(look,slot,data.patterns[slot]));
      return look;
    }
    return Object.freeze({items,styles,colours,patterns,newLook,equip,setColour,setPattern,npcLook,serialize,restore,
      stats:{clothingItems:items.length,hairstyles:styles.length,colourOptions:colours.length,patternOptions:patterns.length}});
  }
  async function load(paths) {
    paths=paths||{};
    const files=[paths.clothing||"character-pipeline/clothing-catalog.json",paths.hair||"character-pipeline/hairstyle-catalog.json"];
    const responses=await Promise.all(files.map(url=>fetch(url)));
    if(responses.some(r=>!r.ok)) throw new Error("Could not load wardrobe catalogues");
    const data=await Promise.all(responses.map(r=>r.json()));
    return create(data[0],data[1]);
  }
  root.AccraWardrobe={create,load};
})(typeof window!=="undefined"?window:globalThis);
