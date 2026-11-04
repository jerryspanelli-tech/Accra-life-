/* accra-phone-skin.js - makes the in-game phone look like a real smartphone.
 * It only adds styles on top of phone.js: a rounded phone body with a wallpaper, a status bar, a four-column app
 * grid with bigger icons, the screen with the phone's own content, and a dock at the bottom with Home, Back and Close.
 * Nothing in phone.js is changed, so every app keeps working. */
(function () {
  try {
    const css = `
      .p2{position:fixed;left:50%;right:auto;top:50%;bottom:auto;transform:translate(-50%,calc(-50% + 28px)) scale(.97);width:min(88vw,390px);height:min(84dvh,820px);max-height:calc(100dvh - env(safe-area-inset-top,12px) - env(safe-area-inset-bottom,12px));box-sizing:border-box;border:7px solid #25262a;border-radius:48px;background:linear-gradient(145deg,#16181d,#050608 55%,#202127);box-shadow:0 28px 90px #000c,0 0 0 1px #7778,inset 0 0 0 1px #ffffff20;overflow:hidden}
      .p2.on{transform:translate(-50%,-50%) scale(1);opacity:1}
      .p2::before{content:"";position:absolute;top:10px;left:50%;transform:translateX(-50%);width:96px;height:27px;border-radius:18px;background:#020203;z-index:8;box-shadow:inset 0 1px 2px #000,0 0 0 1px #ffffff12;pointer-events:none}
      .p2::after{content:"";position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:104px;height:4px;border-radius:4px;background:#fff;z-index:8;pointer-events:none}
      .p2 .sb{height:37px;flex:0 0 37px;box-sizing:border-box;padding:8px 20px 0 22px;display:flex;align-items:center;justify-content:space-between;font:700 12px -apple-system,BlinkMacSystemFont,sans-serif;color:#fff;letter-spacing:.1px}
      .p2 .sb-right{display:flex;align-items:center;gap:6px;font-size:11px}.p2 .wifi{font-size:15px;transform:rotate(90deg);display:inline-block}
      .p2 .hd{display:none}
      .p2 .bd{position:relative;z-index:1;flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:13px 17px 28px;box-sizing:border-box;background:radial-gradient(ellipse at 18% 12%,#517f9c 0,transparent 43%),radial-gradient(ellipse at 88% 42%,#765c85 0,transparent 42%),linear-gradient(155deg,#142b46 0%,#19233b 48%,#111725 100%);-webkit-overflow-scrolling:touch;touch-action:pan-y}
      .p2 h3{font:700 20px -apple-system,BlinkMacSystemFont,sans-serif;color:#fff;margin:9px 2px 13px;letter-spacing:-.35px}
      .p2 .ios-widget{position:relative;min-height:132px;margin:4px 0 19px;padding:14px 15px 12px;border-radius:22px;background:linear-gradient(135deg,#dce8f0e8,#a9c2d5d9 58%,#c7b5d7e8);color:#172332;box-shadow:0 8px 22px #0003;box-sizing:border-box;overflow:hidden}
      .p2 .ios-widget:after{content:"";position:absolute;width:150px;height:150px;right:-55px;top:-55px;border:1px solid #ffffff90;border-radius:50%;box-shadow:0 0 0 18px #ffffff20,0 0 0 38px #ffffff12}
      .p2 .iw-date{font:600 12px -apple-system,BlinkMacSystemFont,sans-serif;opacity:.78}.p2 .iw-time{font:300 42px/1.1 -apple-system,BlinkMacSystemFont,sans-serif;letter-spacing:-2px}.p2 .iw-greeting{font:600 10px -apple-system,BlinkMacSystemFont,sans-serif;opacity:.7;margin-top:3px}
      .p2 .iw-wallet{position:absolute;right:10px;bottom:10px;z-index:1;width:45%;border:1px solid #ffffff90;border-radius:14px;padding:8px 9px;text-align:left;background:#17283dcc;color:#fff;display:flex;flex-direction:column;gap:3px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
      .p2 .iw-wallet span{font-size:8px;letter-spacing:1px;opacity:.8}.p2 .iw-wallet b{font-size:16px}.p2 .iw-wallet i{font-style:normal;font-size:9px;opacity:.8}
      .p2 .ag{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px 5px;margin:0;padding:0 2px}
      .p2 .ai{min-width:0;border:0;background:none;color:#fff;font:500 10px -apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:5px;padding:0;min-height:72px;text-shadow:0 1px 3px #0009}
      .p2 .ai i{position:relative;display:flex;align-items:center;justify-content:center;width:55px;height:55px;border-radius:17px;font-style:normal;font-size:27px;background:linear-gradient(145deg,#ffffff48,#ffffff08 48%,#00000016),var(--c);box-shadow:0 4px 10px #0005,inset 0 1px 1px #ffffff66,inset 0 -2px 2px #0002;transition:transform .12s}
      .p2 .ai:active i{transform:scale(.91)}.p2 .ai span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .p2 .bg{top:-5px;right:-6px;box-shadow:0 0 0 2px #27364a}
      .p2 .ios-dock{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:16px 0 0;padding:10px 5px 7px;border:1px solid #ffffff24;border-radius:24px;background:#d5e1ee38;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .p2 .ios-dock .ai{min-height:61px;gap:3px;font-size:9px}.p2 .ios-dock .ai i{width:43px;height:43px;border-radius:14px;font-size:22px}
      .p2 .cd{background:#ffffff17;border:1px solid #ffffff12;border-radius:17px;padding:11px 12px;margin:8px 0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .p2 .tx{display:flex;justify-content:space-between;align-items:center;gap:8px}.p2 .bt{border:0;border-radius:13px;background:#e4c56f;color:#1b2028;font:700 12px -apple-system,BlinkMacSystemFont,sans-serif;padding:10px 13px;min-height:40px;margin:3px 3px 0 0}
      .p2 .big{font-size:26px;font-weight:800;color:#f3d47b}.p2 .up{color:#7de2aa}.p2 .dn{color:#ff9a9a}.p2 img{width:100%;border-radius:14px;margin-top:8px}
      .p2 .nv{position:relative;z-index:2;display:flex;justify-content:space-around;align-items:center;flex:0 0 49px;margin:0 17px 12px;padding:0 12px;border:1px solid #ffffff20;border-radius:25px;background:#111722c9;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .p2 .nv button{border:0;background:#ffffff12;color:#fff;border-radius:50%;width:35px;height:35px;font-size:20px;line-height:1}
      .p2 .nv #phm{width:38px;height:38px;background:#ffffff12;border:1px solid #ffffff36;color:#fff;font-size:12px}
      .p2 .bal{display:flex;justify-content:center;align-items:center;gap:8px;width:100%;margin-top:12px;padding:10px;border:1px solid #ffffff35;border-radius:18px;background:#11172288;color:#fff;font:800 16px -apple-system,BlinkMacSystemFont,sans-serif}
      .p2 .bd::-webkit-scrollbar{width:0}
      #pbtn2{border:1px solid #ffffff70;border-radius:18px;background:linear-gradient(145deg,#e5edf5,#8998aa);color:#17202a;box-shadow:0 6px 18px #0007;font-size:23px;padding:7px 13px}
      @media (orientation:landscape){.p2{width:min(58vh,390px);height:min(92dvh,760px)}}
      @media (max-width:380px){.p2{width:91vw;border-radius:40px}.p2 .bd{padding-left:13px;padding-right:13px}.p2 .ai i{width:51px;height:51px}}
    `;
    const style = document.createElement("style");
    style.id = "accra-phone-skin";
    style.textContent = css;
    document.head.appendChild(style);
    console.log("Phone skin ready");
  } catch (err) { console.error("accra-phone-skin failed:", err); }
})();
