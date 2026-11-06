/* accra-profile.js - profile sheet (the "me" screen): a live 2D preview of your look, Edit look, Wardrobe,
 * Needs (health, energy, hunger, hygiene, mood) and your homes with rent due. Opens with the 🙂 button. */
(function () {
  try {
    const L = window.ACCRA_LIFE && window.ACCRA_LIFE.api, D = window.ACCRA_LOOKDATA;
    if (!L || !D) { console.log("accra-profile: life or look data not ready"); return; }
    const { st, cash, note, save } = L;
    const cashNow = () => (window.ACCRA_STATE ? window.ACCRA_STATE.money : 0);

    // ---------- button ----------
    const btn = document.createElement("button");
    btn.textContent = "\uD83D\uDE42"; btn.setAttribute("aria-label", "Profile");
    btn.style.cssText = "position:fixed;right:8px;top:calc(env(safe-area-inset-top,0px) + 134px);width:42px;height:42px;border-radius:50%;border:2px solid #c9a54a;background:rgba(28,30,33,.85);color:#fff;font-size:20px;z-index:6;touch-action:none;padding:0";
    document.body.appendChild(btn);

    // ---------- sheet ----------
    const sheet = document.createElement("div");
    sheet.style.cssText = "position:fixed;left:0;right:0;bottom:0;max-height:84vh;overflow:auto;background:linear-gradient(180deg,#1f2226,#131518);border-radius:22px 22px 0 0;border-top:2px solid #c9a54a;padding:12px 14px calc(env(safe-area-inset-bottom,0px) + 14px);z-index:45;color:#fff;font:13px system-ui;transform:translateY(105%);transition:transform .3s cubic-bezier(.2,.8,.2,1);touch-action:pan-y";
    document.body.appendChild(sheet);
    const cv = document.createElement("canvas"); cv.width = 240; cv.height = 320; cv.style.cssText = "width:120px;height:160px;border-radius:14px;background:linear-gradient(180deg,#cfe6f5,#eaf4fb)";
    const BS = "display:block;width:100%;margin:6px 0;border:0;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;font:700 14px system-ui;padding:11px 12px;text-align:left";
    let tab = "profile", open = false;

    // ---------- live preview drawn from the saved look ----------
    function paint() {
      const c = cv.getContext("2d"), l = window.ACCRA_AVATAR ? window.ACCRA_AVATAR.look : {};
      const sk = D.SK[(l.skin || 0) % 8], hc = D.HC[(l.hcol || 0) % 4], top = D.TP[(l.top || 0) % 8], pn = D.PN[(l.pants || 0) % 6], shoe = D.SH[(l.shoe || 0) % 4];
      const st = (l.style || 0) % 8, h = (l.hair || 0) % 10, ac = (l.acc || 0) % 6;
      c.clearRect(0, 0, 240, 320);
      // legs and shoes
      c.fillStyle = st === 2 ? sk : pn; c.fillRect(84, 170, 30, 90); c.fillRect(126, 170, 30, 90);
      c.fillStyle = shoe; c.fillRect(78, 258, 40, 16); c.fillRect(122, 258, 40, 16);
      // body
      const wide = st === 4 ? 1.12 : 1;
      c.fillStyle = st === 5 ? "#f4f4f0" : st === 7 ? "#3b2a1e" : top;
      c.fillRect(120 - 46 * wide, 100, 92 * wide, 84);
      if (st === 5) { c.fillStyle = "#c8102e"; c.fillRect(74, 114, 92, 10); c.fillStyle = "#fcd116"; c.fillRect(74, 136, 92, 10); c.fillStyle = "#006b3f"; c.fillRect(74, 158, 92, 10); }
      if (st === 6) { c.fillStyle = "#c8102e"; c.fillRect(102, 110, 8, 70); c.fillStyle = "#fcd116"; c.fillRect(114, 110, 8, 70); c.fillStyle = "#006b3f"; c.fillRect(126, 110, 8, 70); }
      if (st === 4) { c.fillStyle = "#c9a54a"; c.fillRect(74, 96, 92, 6); c.fillRect(74, 176, 92, 6); }
      if (st === 7) { c.fillStyle = "#e8e6df"; c.fillRect(110, 104, 20, 70); }
      // arms
      c.fillStyle = sk; c.fillRect(58, 110, 16, 70); c.fillRect(166, 110, 16, 70);
      // head and hair
      c.fillStyle = sk; c.beginPath(); c.ellipse(120, 70, 30, 34, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = hc;
      if (h === 2) { c.beginPath(); c.arc(120, 62, 52, 0, Math.PI * 2); c.fill(); c.fillStyle = sk; c.beginPath(); c.ellipse(120, 74, 28, 32, 0, 0, Math.PI * 2); c.fill(); }
      else if (h === 3 || h === 4 || h === 6) { c.fillRect(88, 30, 64, 14); for (let i = 0; i < 6; i++) c.fillRect(92 + i * 9, 40, 5, 40); }
      else if (h === 7) c.fillRect(114, 18, 12, 26);
      else if (h === 9) { for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(120 + Math.cos(i / 7 * 6.28) * 22, 42 + Math.sin(i / 7 * 6.28) * 6, 7, 0, 6.28); c.fill(); } }
      else if (h !== 0) { c.beginPath(); c.ellipse(120, 44, 32, 16, 0, Math.PI, 0); c.fill(); }
      // face
      c.fillStyle = "#111"; c.fillRect(106, 66, 8, 8); c.fillRect(126, 66, 8, 8);
      c.fillStyle = "#7a2a2a"; c.fillRect(108, 84, 24, 4);
      // accessories
      if (ac === 1) { c.fillStyle = "#c9a54a"; for (let i = 0; i < 5; i++) c.fillRect(96 + i * 12, 102 + Math.abs(i - 2) * 3, 5, 5); }
      if (ac === 2) { c.fillStyle = "#c8102e"; c.fillRect(88, 30, 64, 12); c.fillRect(120, 38, 40, 6); }
      if (ac === 3) { c.fillStyle = "#c9d13a"; c.beginPath(); c.ellipse(120, 36, 34, 18, 0, Math.PI, 0); c.fill(); }
      if (ac === 4) { c.fillStyle = "#111"; c.fillRect(104, 64, 14, 8); c.fillRect(122, 64, 14, 8); }
      if (ac === 5) { c.fillStyle = "#fcd116"; c.fillRect(88, 36, 64, 10); }
    }

    // ---------- sections ----------
    const bar = (lab, v, col) => '<div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="width:82px">' + lab + '</span><div style="flex:1;height:8px;background:rgba(255,255,255,.15);border-radius:5px;overflow:hidden"><div style="width:' + Math.round(v) + '%;height:100%;background:' + col + '"></div></div><b style="width:32px;text-align:right">' + Math.round(v) + '</b></div>';
    function tag() { const m = cashNow(); return m >= 50000 ? "Big Man" : m >= 5000 ? "Rising" : "Hustler"; }
    function mood() { return st.md > 60 ? "Happy" : st.md > 30 ? "Okay" : "Stressed"; }
    function body() {
      const name = localStorage.getItem("accra-name") || "Citizen";
      const head = '<div style="display:flex;gap:12px;align-items:center"><div id="pfpv"></div><div style="flex:1"><div style="font:800 19px system-ui">@' + name.replace(/</g, "") + '</div><div style="color:#c9a54a;margin-top:3px">\uD83D\uDE42 ' + mood() + ' &nbsp; <span style="border:1px solid #c9a54a;border-radius:10px;padding:1px 7px">' + tag() + '</span></div><div style="color:#aaa;margin-top:4px">Cash GH\u00A2' + Math.round(cashNow()).toLocaleString() + '</div></div></div>';
      const tabs = '<div style="display:flex;gap:6px;margin:12px 0 4px">' + [["profile", "Profile"], ["needs", "Needs"]].map(t => '<button data-tab="' + t[0] + '" style="flex:1;border:0;border-radius:14px;padding:9px;font:700 13px system-ui;background:' + (tab === t[0] ? "#c9a54a;color:#17191c" : "rgba(255,255,255,.12);color:#fff") + '">' + t[1] + "</button>").join("") + "</div>";
      let content = "";
      if (tab === "needs") {
        content = bar("\u2764\uFE0F Health", st.hp, "#e5484d") + bar("\u26A1 Energy", st.en, "#f5c542") + bar("\uD83C\uDF7D\uFE0F Hunger", st.hu, "#f08a3c") + bar("\uD83D\uDEBF Hygiene", st.hy, "#4aa3d9") + bar("\uD83D\uDE42 Mood", st.md, "#5cc27a") +
          '<div style="color:#aaa;margin-top:8px">Eat, sleep, wash and see the hospital to keep these up.</div>';
      } else {
        const homes = L.homes ? L.homes() : [];
        content = '<button data-do="edit" style="' + BS + '">\uD83E\uDDD1 Edit look</button><button data-do="wardrobe" style="' + BS + '">\uD83D\uDC57 Wardrobe</button>' +
          '<div style="margin:12px 0 4px;color:#c9a54a;font-weight:700">Home</div>' +
          (homes.length ? homes.map(h => '<div style="background:rgba(255,255,255,.08);border-radius:14px;padding:10px 12px;margin:6px 0"><b>' + h.name + '</b><br><small style="color:' + (h.own ? "#69f0ae" : "#ffd24a") + '">' + (h.own ? "Owned" : "Rent GH\u00A2" + h.rent + " per week \u00B7 next payment in " + h.mins + " min") + "</small></div>").join("")
            : '<div style="background:rgba(255,255,255,.08);border-radius:14px;padding:10px 12px"><small>No rented or owned home yet. Your villa is yours already.</small></div>');
      }
      return head + tabs + content + '<button data-do="close" style="' + BS + ';text-align:center;background:#c9a54a;color:#17191c;font-weight:800">Close</button>';
    }
    function draw() {
      sheet.innerHTML = body();
      const slot = sheet.querySelector("#pfpv"); if (slot) slot.appendChild(cv);
      paint();
    }
    function show(o) { open = o; if (o) draw(); sheet.style.transform = o ? "translateY(0)" : "translateY(105%)"; }

    btn.onclick = () => show(!open);
    sheet.addEventListener("click", e => {
      const b = e.target.closest("[data-tab],[data-do]"); if (!b) return;
      if (b.dataset.tab) { tab = b.dataset.tab; draw(); return; }
      const d = b.dataset.do;
      if (d === "close") return show(false);
      if (d === "edit" && window.ACCRA_STYLER) { show(false); window.ACCRA_STYLER("edit"); }
      if (d === "wardrobe" && window.ACCRA_STYLER) { show(false); window.ACCRA_STYLER("wardrobe"); }
    });
    // keep the preview and needs current while the sheet is open
    setInterval(() => { if (open) { draw(); } }, 2000);
    (window.ACCRA_MODULES = window.ACCRA_MODULES || {}).profile = 1;
    console.log("Accra profile ready");
  } catch (err) { console.error("accra-profile failed:", err); }
})();
