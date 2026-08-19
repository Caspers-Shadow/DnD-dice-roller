/* =========================================================================
   LOGIN / SIGN UP
   ========================================================================= */

const statusEl = document.getElementById('authStatus');
let busy = false;

(async function initLoginPage() {
  if (!CLOUD_ENABLED) {
    document.getElementById('authCard').innerHTML =
      '<p class="party-hint">Accounts aren\'t configured yet. See SETUP.md to connect a free Supabase project — until then, this page can\'t sign anyone in.</p>';
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = 'dashboard.html';
})();

document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
document.getElementById('tabSignup').addEventListener('click', () => switchTab('signup'));
function switchTab(which) {
  const isLogin = which === 'login';
  document.getElementById('loginForm').style.display = isLogin ? '' : 'none';
  document.getElementById('signupForm').style.display = isLogin ? 'none' : '';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('tabLogin').setAttribute('aria-selected', isLogin);
  document.getElementById('tabSignup').setAttribute('aria-selected', !isLogin);
  statusEl.textContent = '';
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  if (busy) return;
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { statusEl.textContent = 'Enter your email and password.'; return; }
  busy = true; statusEl.textContent = 'Signing in…';
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  busy = false;
  if (error) { statusEl.textContent = error.message; return; }
  window.location.href = 'dashboard.html';
});

document.getElementById('signupBtn').addEventListener('click', async () => {
  if (busy) return;
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  if (!name || !email || !password) { statusEl.textContent = 'Fill in your name, email, and a password.'; return; }
  busy = true; statusEl.textContent = 'Creating your account…';
  const { data, error } = await supabaseClient.auth.signUp({
    email, password, options: { data: { display_name: name } }
  });
  busy = false;
  if (error) { statusEl.textContent = error.message; return; }
  if (data.session) {
    window.location.href = 'dashboard.html';
  } else {
    statusEl.textContent = 'Check your email to confirm your account, then log in.';
  }
});

['loginPassword'].forEach(id => document.getElementById(id).addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('loginBtn').click(); }
}));
document.getElementById('signupPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('signupBtn').click(); }
});
