/* =========================================================================
   SHARED — Supabase client + small helpers used across every page.
   Loaded after config.js and the Supabase CDN script on every page.
   ========================================================================= */

const CLOUD_ENABLED = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.startsWith('YOUR_');
const supabaseClient = CLOUD_ENABLED ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I, easier to read aloud
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function timeLabel(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function dateTimeLabel(iso) { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

// Redirect helper: send the visitor to the login page if there's no session,
// or if accounts aren't configured at all yet. Returns the session's user
// on success so the calling page can continue setting itself up.
async function requireSession() {
  if (!CLOUD_ENABLED) {
    document.body.innerHTML = '<div class="gate-message"><p>Accounts aren\'t configured yet.</p><p class="party-hint">See SETUP.md to connect a free Supabase project.</p></div>';
    throw new Error('cloud not enabled');
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    throw new Error('no session');
  }
  return session.user;
}

async function getDisplayName(userId) {
  const { data } = await supabaseClient.from('profiles').select('display_name').eq('id', userId).single();
  return data ? data.display_name : 'Adventurer';
}

async function signOutAndRedirect() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}
