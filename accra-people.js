/* accra-people.js
 * The old Superhero_Male_FullBody override is intentionally retired.
 * Player characters now use People/AccraLife male/female GLBs through
 * ACCRA_PLAYER_MODEL. Until a dedicated realistic NPC library is integrated,
 * NPC creation falls back to the game's existing AccraFigure implementation.
 */
(function(){
  try{
    const spawned=[];
    function spawn(parent,options){
      if(!window.AccraAssets||typeof window.AccraAssets.createCharacter!=='function'){
        console.warn('[AccraPeople] Character factory is not ready yet.');
        return null;
      }
      const figure=window.AccraAssets.createCharacter(window.scene || window.accraScene || scene, options||{});
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
    console.log('[AccraPeople] Legacy superhero replacement disabled; using safe NPC fallback.');
  }catch(err){console.error('accra-people compatibility layer failed:',err);}
})();
