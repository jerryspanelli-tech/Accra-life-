/* Accra Life account authentication and cloud player saves. Browser-tested in CI. */
(function () {
  "use strict";
  const SUPABASE_URL = "https://fktvbxmgseojcvztheqz.supabase.co";
  const SUPABASE_KEY = "sb_publishable_4oyGhQ6mUqtEXocFiqq2FA_GvFpSOuC";
  const GAME_KEY_PREFIX = "accra-";
  let client = null;
  let session = null;
  let saveTimer = null;
  let saveDirty = false;
  let saving = false;

  function gameSnapshot() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GAME_KEY_PREFIX) && key !== "accra-auth") {
        try { result[key] = localStorage.getItem(key); } catch (_) {}
      }
    }
    return result;
  }

  async function loadProfile() {
    if (!session) return null;
    const { data, error } = await client.from("player_profiles")
      .select("display_name,gender,look,game_save")
      .eq("id", session.user.id).maybeSingle();
    if (error) throw error;
    if (data && data.game_save && typeof data.game_save === "object") {
      Object.entries(data.game_save).forEach(([key, value]) => {
        if (key.startsWith(GAME_KEY_PREFIX) && typeof value === "string") {
          try { localStorage.setItem(key, value); } catch (_) {}
        }
      });
    }
    if (data) {
      if (data.display_name) localStorage.setItem("accra-name", data.display_name);
      if (data.look && typeof data.look === "object") {
        localStorage.setItem("accra-look", JSON.stringify(data.look));
        if (window.ACCRA_AVATAR && window.ACCRA_AVATAR.look) {
          Object.assign(window.ACCRA_AVATAR.look, data.look);
        }
      }
      if (data.gender === "male" || data.gender === "female") {
        const look = window.ACCRA_AVATAR && window.ACCRA_AVATAR.look;
        if (look) look.gender = data.gender;
      }
    }
    return data;
  }

  async function saveProfile(details) {
    if (!session) return { ok: false, reason: "Not signed in" };
    const look = details && details.look || (window.ACCRA_AVATAR && window.ACCRA_AVATAR.look) || {};
    const displayName = String(details && details.display_name || localStorage.getItem("accra-name") || "Citizen").trim().slice(0,16) || "Citizen";
    const gender = (details && details.gender || look.gender) === "female" ? "female" : "male";
    const { error } = await client.from("player_profiles").upsert({
      id: session.user.id,
      display_name: displayName,
      gender,
      look,
      game_save: gameSnapshot(),
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  }

  async function flushSave() {
    if (!session || !saveDirty || saving) return;
    saving = true;
    saveDirty = false;
    try { await saveProfile(); }
    catch (error) { console.warn("[AccraAuth] Cloud save failed:", error.message || error); saveDirty = true; }
    finally { saving = false; }
  }

  function attachAutosave() {
    if (window.__accraCloudSaveAttached) return;
    window.__accraCloudSaveAttached = true;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage && String(key).startsWith(GAME_KEY_PREFIX) && session) {
        saveDirty = true;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushSave, 1800);
      }
    };
    window.addEventListener("pagehide", () => { if (session && saveDirty) flushSave(); });
    window.addEventListener("beforeunload", () => { if (session && saveDirty) flushSave(); });
    setInterval(() => { if (session && saveDirty) flushSave(); }, 15000);
  }

  function authScreen() {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.id = "accra-auth-screen";
      overlay.style.cssText = "position:fixed;inset:0;z-index:100000;background:linear-gradient(180deg,#14161a,#090a0c);color:#fff;font:14px system-ui;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;overflow:auto";
      const card = document.createElement("div");
      card.style.cssText = "width:min(100%,390px);background:#1c1e21;border:2px solid #c9a54a;border-radius:20px;padding:22px;box-sizing:border-box;box-shadow:0 18px 60px #0009";
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      let mode = "signin";
      const safe = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
      function render(message, error) {
        card.innerHTML = `
          <div style="text-align:center;font-size:25px;font-weight:900;letter-spacing:2px;color:#c9a54a">ACCRA LIFE</div>
          <div style="text-align:center;color:#bbb;margin:6px 0 20px">${mode === "signin" ? "Sign in to continue your life in Accra" : "Create your player account"}</div>
          <form id="accra-auth-form">
            <label style="display:block;margin:10px 0 5px;color:#ddd">Email address</label>
            <input id="accra-auth-email" type="email" autocomplete="email" required placeholder="you@example.com" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:13px;font:15px system-ui;background:#fff;color:#111">
            <label style="display:block;margin:12px 0 5px;color:#ddd">Password</label>
            <input id="accra-auth-password" type="password" minlength="6" autocomplete="${mode === "signin" ? "current-password" : "new-password"}" required placeholder="At least 6 characters" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:13px;font:15px system-ui;background:#fff;color:#111">
            <div id="accra-auth-message" role="status" style="min-height:38px;margin:12px 0;color:${error ? "#ff9999" : "#e7d59b"};line-height:1.4">${safe(message || (error ? "" : "Your account saves your character and game progress."))}</div>
            <button id="accra-auth-submit" type="submit" style="width:100%;border:0;border-radius:13px;padding:14px;font:800 16px system-ui;background:#c9a54a;color:#17191c">${mode === "signin" ? "Sign In" : "Create Account"}</button>
          </form>
          <button id="accra-auth-switch" type="button" style="width:100%;margin-top:12px;border:1px solid #777;border-radius:12px;padding:11px;background:transparent;color:#fff;font:600 13px system-ui">${mode === "signin" ? "New player? Create an account" : "Already have an account? Sign in"}</button>
        `;
        card.querySelector("#accra-auth-switch").onclick = () => { mode = mode === "signin" ? "signup" : "signin"; render(); };
        card.querySelector("#accra-auth-form").onsubmit = async event => {
          event.preventDefault();
          const email = card.querySelector("#accra-auth-email").value.trim();
          const password = card.querySelector("#accra-auth-password").value;
          const submit = card.querySelector("#accra-auth-submit");
          const msg = card.querySelector("#accra-auth-message");
          submit.disabled = true; submit.textContent = "Please wait…";
          msg.style.color = "#e7d59b"; msg.textContent = "Connecting securely…";
          try {
            if (mode === "signup") {
              const { data, error } = await client.auth.signUp({ email, password });
              if (error) throw error;
              if (!data.session) {
                msg.textContent = "Account created. Check your email for the confirmation link, then return here and sign in.";
                submit.disabled = false; submit.textContent = "Create Account";
                return;
              }
              session = data.session;
            } else {
              const { data, error } = await client.auth.signInWithPassword({ email, password });
              if (error) throw error;
              session = data.session;
            }
            msg.textContent = "Signed in. Loading your player…";
            overlay.remove();
            resolve();
          } catch (err) {
            msg.style.color = "#ff9999";
            msg.textContent = err.message || "Could not sign in. Check your details and try again.";
            submit.disabled = false; submit.textContent = mode === "signin" ? "Sign In" : "Create Account";
          }
        };
      }
      render();
    });
  }

  window.ACCRA_AUTH_READY = (async function () {
    if (!window.supabase || !window.supabase.createClient) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
        script.onload = () => window.supabase && window.supabase.createClient ? resolve() : reject(new Error("Supabase library did not initialize"));
        script.onerror = () => reject(new Error("Could not load secure sign-in service"));
        document.head.appendChild(script);
      });
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
    const api = {
      get session() { return session; },
      async requireSession() {
        if (!session) await authScreen();
        if (!session) throw new Error("Please sign in to continue.");
        const profile = await loadProfile();
        attachAutosave();
        return profile;
      },
      saveProfile,
      signOut: async () => { await flushSave(); await client.auth.signOut(); session = null; }
    };
    window.ACCRA_AUTH = api;
    return api;
  })();
  window.ACCRA_AUTH_READY.catch(error => {
    console.error("[AccraAuth] Initialization failed:", error);
    const notice = document.createElement("div");
    notice.style.cssText = "position:fixed;inset:0;z-index:100001;background:#111;color:#fff;display:grid;place-items:center;padding:24px;font:16px system-ui;text-align:center";
    notice.textContent = "Accra Life sign-in could not load: " + (error.message || error) + ". Please refresh and try again.";
    document.body.appendChild(notice);
  });
})();
