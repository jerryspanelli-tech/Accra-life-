/* accra-people.js
 * The old Superhero_Male_FullBody override is intentionally retired.
 * Civilian NPCs are routed through AccraAssets.createCharacter, which swaps
 * the safe procedural fallback for cached realistic People/AccraLife GLBs.
 * Police keep their uniformed fallback until a dedicated police GLB exists.
 */
(function(){
  try{
    const spawned=[];
    function spawn(parent,options){
      if(!window.AccraAssets||typeof window.AccraAssets.createCharacter!=='function'){
        console.warn('[AccraPeople] Character factory is not ready yet.');
        return null;
      }
      const figure=window.AccraAssets.createCharacter(scene, options||{});
      if(figure&&figure.root&&parent)figure.root.parent=parent;
      if(figure)spawned.push(figure);
      return figure;
    }
    window.ACCRA_PEOPLE={
      spawn,
      ready:()=>!!(window.AccraFigure&&window.AccraFigure.human),
      count:()=>spawned.filter(p=>p&&p.root&&!p.root.isDisposed()).length,
      legacySuperheroDisabled:true
    };
    (window.ACCRA_MODULES=window.ACCRA_MODULES||{}).people=1;
    console.log('[AccraPeople] Civilian GLB replacement enabled; police uniform fallback retained.');
  }catch(err){console.error('accra-people compatibility layer failed:',err);}
})();
