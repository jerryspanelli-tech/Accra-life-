/* accra-cloud.js - connects the game to the online database (Supabase).
 * Shows a status line at the top of the screen at each step, so problems are visible.
 * Exposes window.ACCRA_CLOUD.ready and window.ACCRA_CLOUD.pay(txId, amount, reason). */
(function () {
  try {
    const SUPABASE_URL = "https://rojzwrewmwsnzbbfkdr.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvanp3cmV3bXdzbnpiYmZma2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDk2MDAsImV4cCI6MjEwNzkyNTYwMH0.UVBUp3HgstVyOcDD2P6qm4DJxr3C7woUjbtXWddS-LE";
    let sb = null;

    // status line at the top of the screen
    const bar = document.createElement("div");
    bar.style.cssText = "position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 96px);transform:translateX(-50%);background:rgba(28,30,33,.9);color:#c9a54a;border:1px solid #c9a54a;border-radius:12px;padding:6px 10px;font:700 12px system-ui;z-index:90;max-width:90vw;text-align:center";
    bar.textContent = "Online: starting…";
    document.body.appendChild(bar);
    const say = t => { bar.textContent = "Online: " + t; console.log("accra-cloud: " + t); };

    function loadLibrary() {
      return new Promise((res, rej) => {
        if (window.supabase && window.supabase.createClient) return res();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
        s.onload = () => (window.supabase && window.supabase.createClient) ? res() : rej(new Error("library loaded but empty"));
        s.onerror = () => rej(new Error("library could not be downloaded"));
        document.head.appendChild(s);
      });
    }

    const ready = (async () => {
      say("loading library…");
      await loadLibrary();
      say("connecting…");
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const session = await sb.auth.getSession();
      if (!session.data.session) {
        say("signing in…");
        const r = await sb.auth.signInAnonymously();
        if (r.error) throw new Error("sign-in: " + r.error.message);
      }
      say("loading your player…");
      const p = await sb.rpc("create_player", { p_name: localStorage.getItem("accra-name") || "Citizen" });
      if (p.error) throw new Error("player: " + p.error.message);
      say("connected (" + (p.data && p.data.name ? p.data.name : "player") + ", cash " + (p.data ? p.data.cash : "?") + ")");
      return p.data;
    })();

    window.ACCRA_CLOUD = {
      ready,
      // every money change goes through here; the database refuses duplicates and overdrafts
      async pay(txId, amount, reason) {
        try {
          await ready;
          const r = await sb.rpc("apply_transaction", { p_tx: txId, p_amount: amount, p_reason: reason });
          if (r.error) return { ok: false, reason: r.error.message };
          return r.data;
        } catch (e) { return { ok: false, reason: e.message || String(e) }; }
      }
    };
    ready.catch(e => say("NOT connected: " + (e.message || e)));
  } catch (err) { console.error("accra-cloud failed to start:", err); }
})();
