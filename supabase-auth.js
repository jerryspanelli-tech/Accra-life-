(() => {
  'use strict';
  const SUPABASE_URL = 'https://fktvbxmgseojcvztheqz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4oyGhQ6mUqtEXocFiqq2FA_GvFpSOuC';
  const APP_URL = 'https://jerryspanelli-tech.github.io/Accra-life-/babylon.html';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const style = document.createElement('style');
  style.textContent = `
    #accra-auth-gate{position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(ellipse at top,#29333d 0%,#111519 62%,#090b0d 100%);font-family:system-ui,-apple-system,sans-serif;color:#f5f2e9}
    #accra-auth-gate *{box-sizing:border-box}
    .al-auth-card{width:min(100%,410px);padding:28px 22px;border:1px solid rgba(201,165,74,.38);border-radius:22px;background:rgba(20,24,28,.97);box-shadow:0 24px 80px #0009}
    .al-auth-brand{color:#c9a54a;font-size:12px;font-weight:800;letter-spacing:2px;text-align:center}
    .al-auth-title{margin:9px 0 5px;text-align:center;font-size:27px;font-weight:800}
    .al-auth-sub{margin:0 0 22px;text-align:center;color:#b7bdc3;font-size:13px;line-height:1.5}
    .al-auth-tabs{display:flex;gap:8px;margin-bottom:16px}
    .al-auth-tabs button,.al-auth-submit{border:0;border-radius:11px;padding:12px 14px;font-weight:750;cursor:pointer}
    .al-auth-tabs button{flex:1;background:#30363c;color:#dce0e3}
    .al-auth-tabs button[aria-selected=true]{background:#c9a54a;color:#17191c}
    .al-auth-field{display:block;margin:12px 0 5px;color:#d9d9d4;font-size:12px;font-weight:700}
    .al-auth-input{width:100%;height:48px;border:1px solid #48515a;border-radius:10px;padding:0 13px;background:#0f1317;color:white;font-size:16px;outline:none}
    .al-auth-input:focus{border-color:#c9a54a}
    .al-auth-submit{width:100%;margin-top:17px;background:#c9a54a;color:#17191c;font-size:15px}
    .al-auth-submit:disabled{opacity:.55;cursor:wait}
    .al-auth-link{display:block;margin:14px auto 0;border:0;background:none;color:#d8bd72;text-decoration:underline;font-size:13px;cursor:pointer}
    .al-auth-message{min-height:20px;margin:13px 0 0;color:#e7d7a5;font-size:13px;line-height:1.45;text-align:center}
    #accra-auth-account{position:fixed;z-index:999998;top:calc(env(safe-area-inset-top,0px) + 8px);right:8px;max-width:56vw;border:1px solid #806b35;border-radius:13px;padding:7px 11px;background:#171b20ed;color:#f3dfaa;font:700 12px system-ui;cursor:pointer}
    #accra-auth-menu{position:fixed;z-index:999999;top:calc(env(safe-area-inset-top,0px) + 48px);right:8px;padding:10px;border:1px solid #806b35;border-radius:12px;background:#171b20;color:#fff}
    #accra-auth-menu button{border:0;border-radius:8px;padding:9px 13px;background:#a33b35;color:white;font-weight:700}
    @media(max-height:620px){.al-auth-card{padding:18px}.al-auth-title{font-size:23px}.al-auth-sub{margin-bottom:12px}.al-auth-input{height:42px}}
  `;
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.id = 'accra-auth-gate';
  gate.innerHTML = `
    <section class="al-auth-card" role="dialog" aria-modal="true" aria-labelledby="al-auth-heading">
      <div class="al-auth-brand">ACCRA LIFE</div>
      <h1 class="al-auth-title" id="al-auth-heading">Welcome to Accra</h1>
      <p class="al-auth-sub">Sign in or create an account to enter the game. Your login will be saved on this device.</p>
      <div class="al-auth-tabs">
        <button type="button" id="al-tab-login" aria-selected="true">Sign in</button>
        <button type="button" id="al-tab-signup" aria-selected="false">Create account</button>
      </div>
      <form id="al-auth-form">
        <label class="al-auth-field" for="al-email">Email address</label>
        <input class="al-auth-input" id="al-email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com">
        <label class="al-auth-field" for="al-password">Password</label>
        <input class="al-auth-input" id="al-password" type="password" autocomplete="current-password" required minlength="6" placeholder="At least 6 characters">
        <button class="al-auth-submit" id="al-submit" type="submit">Sign in</button>
      </form>
      <button class="al-auth-link" id="al-forgot" type="button">Forgot password?</button>
      <p class="al-auth-message" id="al-message" role="status" aria-live="polite"></p>
    </section>`;
  document.body.appendChild(gate);

  const $ = id => document.getElementById(id);
  let mode = 'login';
  let busy = false;
  const message = (text, bad=false) => { $('al-message').textContent = text; $('al-message').style.color = bad ? '#ffaaa2' : '#e7d7a5'; };
  const setMode = value => {
    mode = value;
    $('al-tab-login').setAttribute('aria-selected', String(mode === 'login'));
    $('al-tab-signup').setAttribute('aria-selected', String(mode === 'signup'));
    $('al-submit').textContent = mode === 'login' ? 'Sign in' : 'Create account';
    $('al-password').setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
    $('al-forgot').style.display = mode === 'login' ? 'block' : 'none';
    message('');
  };
  $('al-tab-login').addEventListener('click', () => setMode('login'));
  $('al-tab-signup').addEventListener('click', () => setMode('signup'));

  let accountButton = null;
  let accountMenu = null;
  function showAccount(user) {
    if (!accountButton) {
      accountButton = document.createElement('button');
      accountButton.id = 'accra-auth-account';
      accountButton.type = 'button';
      document.body.appendChild(accountButton);
      accountMenu = document.createElement('div');
      accountMenu.id = 'accra-auth-menu';
      accountMenu.hidden = true;
      accountMenu.innerHTML = '<button type="button" id="al-signout">Sign out</button>';
      document.body.appendChild(accountMenu);
      accountButton.addEventListener('click', () => { accountMenu.hidden = !accountMenu.hidden; });
      $('al-signout').addEventListener('click', async () => {
        accountMenu.hidden = true;
        const { error } = await supabase.auth.signOut();
        if (error) console.error('[AccraLifeAuth] Sign out failed:', error.message);
      });
    }
    accountButton.textContent = user.email || 'Account';
    accountButton.title = 'Account options';
  }
  function enterGame(user) {
    gate.style.display = 'none';
    window.__accraAuthAllowed = true;
    showAccount(user);
  }
  function lockGame() {
    window.__accraAuthAllowed = false;
    gate.style.display = 'flex';
    if (accountButton) accountButton.remove();
    if (accountMenu) accountMenu.remove();
    accountButton = accountMenu = null;
  }

  $('al-auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const email = $('al-email').value.trim();
    const password = $('al-password').value;
    if (!email || !password) return;
    busy = true;
    $('al-submit').disabled = true;
    message(mode === 'login' ? 'Signing in…' : 'Creating your account…');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: APP_URL }
        });
        if (error) throw error;
        if (data.session) enterGame(data.user);
        else message('Account created. Check your email and confirm your address, then return here to sign in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        enterGame(data.user);
      }
    } catch (error) {
      message(error && error.message ? error.message : 'Authentication failed. Please try again.', true);
    } finally {
      busy = false;
      $('al-submit').disabled = false;
    }
  });

  $('al-forgot').addEventListener('click', async () => {
    const email = $('al-email').value.trim();
    if (!email) { message('Enter your email address first.', true); $('al-email').focus(); return; }
    message('Sending password reset email…');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: APP_URL });
    if (error) message(error.message, true);
    else message('If an account exists for that email, a password reset link has been sent.');
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      lockGame();
      const newPassword = prompt('Enter your new Accra Life password (at least 6 characters):');
      if (newPassword && newPassword.length >= 6) {
        supabase.auth.updateUser({ password: newPassword }).then(({ error }) => {
          if (error) message(error.message, true);
          else message('Password updated. You can now sign in with your new password.');
          supabase.auth.signOut();
        });
      } else {
        message('Password was not changed. Please request another reset link.');
        supabase.auth.signOut();
      }
    } else if (session) {
      enterGame(session.user);
    } else {
      lockGame();
    }
  });

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) { message('Could not check your saved session. Please sign in again.', true); lockGame(); return; }
    if (data.session) enterGame(data.session.user);
    else lockGame();
  });
  console.info('[AccraLifeAuth] Supabase authentication gate loaded.');
})();
