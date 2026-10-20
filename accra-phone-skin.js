/* accra-phone-skin.js - makes the in-game phone look like a real smartphone.
 * It only adds styles on top of phone.js: a rounded phone body with a wallpaper, a status bar, a four-column app
 * grid with bigger icons, the screen with the phone's own content, and a dock at the bottom with Home, Back and Close.
 * Nothing in phone.js is changed, so every app keeps working. */
(function () {
  try {
    const css = `
      .p2{
        top:calc(env(safe-area-inset-top,0px) + 50px);
        bottom:calc(env(safe-area-inset-bottom,0px) + 130px);
        width:min(60vw,300px);
        border:9px solid #0a0a0d;border-radius:44px;
        background:radial-gradient(120% 70% at 50% 0%,#2c5f7a 0%,#15324a 45%,#0b1a2a 100%);
        box-shadow:0 14px 50px rgba(0,0,0,.65),inset 0 0 0 2px #2a2d33,0 0 0 1px #3d3f45;
      }
      .p2::before{content:"";position:absolute;top:8px;left:50%;transform:translateX(-50%);width:90px;height:22px;border-radius:14px;background:#050507;z-index:2}
      .p2 .sb{padding:12px 20px 0;font:700 12px system-ui;color:#fff;opacity:.95}
      .p2 .hd{display:none}
      .p2 .bd{padding:14px 14px 6px;min-height:0;flex:1 1 0;overflow-y:auto}
      .p2 h3{color:#fff;font-size:15px;text-shadow:0 1px 3px rgba(0,0,0,.4)}
      .p2 .ag{grid-template-columns:repeat(4,1fr);gap:18px 4px;padding:6px 0}
      .p2 .ai{font-size:9.5px;min-height:62px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);gap:5px}
      .p2 .ai i{width:50px;height:50px;border-radius:14px;font-size:24px;background:linear-gradient(160deg,rgba(255,255,255,.35),rgba(255,255,255,0) 50%),var(--c);box-shadow:0 3px 8px rgba(0,0,0,.45),inset 0 -2px 0 rgba(0,0,0,.18)}
      .p2 .bal{margin-top:18px;border-radius:24px;background:rgba(10,12,16,.55);border:1px solid rgba(201,165,74,.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
      .p2 .cd{background:rgba(10,14,20,.55);border-radius:16px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
      .p2 .bt{border-radius:14px}
      .p2 .nv{margin:0 12px 14px;padding:8px 10px;border-radius:26px;background:rgba(10,12,16,.6);border:1px solid rgba(255,255,255,.12);justify-content:space-around;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .p2 .nv button{width:40px;height:40px;background:rgba(255,255,255,.1)}
      .p2 .nv #phm{width:44px;height:44px;border:2px solid #c9a54a;color:#c9a54a;background:rgba(201,165,74,.12)}
      .p2 .bd::-webkit-scrollbar{width:0}
      .p2::after{content:"";position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:90px;height:4px;border-radius:3px;background:rgba(255,255,255,.7);z-index:2}
      @media (orientation:landscape){
        .p2{top:calc(env(safe-area-inset-top,0px) + 10px);bottom:calc(env(safe-area-inset-bottom,0px) + 10px);width:min(34vh,260px)}
      }
    `;
    const style = document.createElement("style");
    style.id = "accra-phone-skin";
    style.textContent = css;
    document.head.appendChild(style);
    console.log("Phone skin ready");
  } catch (err) { console.error("accra-phone-skin failed:", err); }
})();
