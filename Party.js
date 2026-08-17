/* =========================================================================
   PARTY + ACCOUNTS
   -------------------------------------------------------------------------
   Signed out: the party lives in this browser's localStorage only — same
   as before, nothing else needed.
   Signed in (via Supabase, see config.js + SETUP.md): the party is stored
   in the cloud under your account, so logging in on any device/browser
   brings it back. The first time you log in, if a local party already
   exists on this browser and you don't have a cloud one yet, it's copied
   up automatically so nothing gets lost.
   ========================================================================= */

const CLOUD_ENABLED = typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.startsWith('YOUR_');
const supabaseClient = CLOUD_ENABLED ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const PARTY_KEY = 'ff-party';
function loadLocalParty() {
  try { const raw = localStorage.getItem(PARTY_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function saveLocalParty() {
  try { localStorage.setItem(PARTY_KEY, JSON.stringify(party)); } catch (e) { /* storage unavailable */ }
}
function clearLocalParty() {
  try { localStorage.removeItem(PARTY_KEY); } catch (e) { /* storage unavailable */ }
}

function nowIso() { return new Date().toISOString(); }
function timeLabel(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let party = null;
let partyRowId = null;     // Supabase row id, once this party has synced at least once
let currentUser = null;    // Supabase auth user, or null when signed out
let partyLoading = false;  // true while fetching/migrating a cloud party
let authBusy = false;
let soloLog = [];          // ephemeral fallback log, only used with no party at all

// ---------------------------------------------------------------------------
// Persistence — local or cloud depending on sign-in state
// ---------------------------------------------------------------------------
async function persistParty() {
  if (currentUser && supabaseClient) {
    const row = {
      user_id: currentUser.id,
      name: party.name,
      members: party.members,
      active_member: party.activeMember,
      log: party.log,
      updated_at: nowIso(),
    };
    if (partyRowId) {
      await supabaseClient.from('parties').update(row).eq('id', partyRowId);
    } else {
      const { data, error } = await supabaseClient.from('parties').insert(row).select().single();
      if (!error && data) partyRowId = data.id;
    }
  } else {
    saveLocalParty();
  }
}

async function loadCloudParty() {
  const { data, error } = await supabaseClient
    .from('parties').select('*').eq('user_id', currentUser.id)
    .order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  partyRowId = data.id;
  return { name: data.name, members: data.members || [], activeMember: data.active_member || null, log: data.log || [] };
}

async function migrateLocalPartyIfAny() {
  const local = loadLocalParty();
  if (!local) return null;
  partyRowId = null;
  party = local;
  await persistParty();
  clearLocalParty();
  return party;
}

// ---------------------------------------------------------------------------
// Party actions — every mutation funnels through persistParty()
// ---------------------------------------------------------------------------
async function createParty(name) {
  party = { name, members: [], activeMember: null, log: [{ type: 'session', time: nowIso() }] };
  partyRowId = null;
  await persistParty();
  renderAll();
}
async function addMember(name) {
  const clean = name.trim();
  if (!party || !clean || party.members.includes(clean)) return;
  party.members.push(clean);
  if (!party.activeMember) party.activeMember = clean;
  await persistParty(); renderAll();
}
async function removeMember(name) {
  if (!party) return;
  party.members = party.members.filter(m => m !== name);
  if (party.activeMember === name) party.activeMember = party.members[0] || null;
  await persistParty(); renderAll();
}
async function setActiveMember(name) {
  if (!party) return;
  party.activeMember = name;
  await persistParty(); renderAll();
}
async function newSession() {
  if (!party) return;
  party.log.push({ type: 'session', time: nowIso() });
  await persistParty(); renderAll();
}
async function addNote(text) {
  const clean = text.trim();
  if (!party || !clean) return;
  party.log.push({ type: 'note', member: party.activeMember, text: clean, time: nowIso() });
  await persistParty(); renderAll();
}
async function disbandParty() {
  if (!confirm('Disband this party? This clears its roster and log.')) return;
  if (currentUser && supabaseClient && partyRowId) {
    await supabaseClient.from('parties').delete().eq('id', partyRowId);
  }
  clearLocalParty();
  party = null; partyRowId = null;
  renderAll();
}

// Called by dice.js when a roll finishes. Deliberately not awaited by the
// caller — logging happens in the background so it never delays the roll.
async function recordRoll(cfg, display, isCrit, isFail) {
  if (party) {
    party.log.push({ type: 'roll', member: party.activeMember, die: cfg.label, display, crit: !!isCrit, fail: !!isFail, time: nowIso() });
    await persistParty();
  } else {
    soloLog.unshift({ type: 'roll', die: cfg.label, display, crit: !!isCrit, fail: !!isFail, time: nowIso() });
    if (soloLog.length > 8) soloLog.pop();
  }
  renderLedger();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderEntry(e) {
  const li = document.createElement('li');
  if (e.type === 'session') {
    li.className = 'log-session';
    li.textContent = 'Session began · ' + timeLabel(e.time);
    return li;
  }
  const who = e.member ? escapeHtml(e.member) + ' · ' : '';
  if (e.type === 'note') {
    li.className = 'log-note';
    li.innerHTML = `<span>${who}“${escapeHtml(e.text)}”</span><span class="val">${timeLabel(e.time)}</span>`;
    return li;
  }
  if (e.crit) li.classList.add('crit');
  if (e.fail) li.classList.add('fail');
  li.innerHTML = `<span>${who}${e.die} · ${timeLabel(e.time)}${e.crit ? ' · critical!' : ''}${e.fail ? ' · fumble' : ''}</span><span class="val">${e.display}</span>`;
  return li;
}

function renderLedger() {
  const log = document.getElementById('log');
  const heading = document.getElementById('ledgerHeading');
  log.innerHTML = '';
  if (party) {
    heading.textContent = party.name + ' — Log';
    const entries = party.log.slice().reverse().slice(0, 40);
    if (entries.length === 0) { log.innerHTML = '<li class="empty">No rolls yet — give it a throw.</li>'; return; }
    entries.forEach(e => log.appendChild(renderEntry(e)));
  } else {
    heading.textContent = 'Roll Log';
    if (soloLog.length === 0) { log.innerHTML = '<li class="empty">No rolls yet — give it a throw.</li>'; return; }
    soloLog.forEach(e => log.appendChild(renderEntry(e)));
  }
}

function buildCreateForm() {
  const wrap = document.createElement('div');
  wrap.innerHTML = '<h2>Gather a Party</h2><p class="party-hint">Name your party to start logging rolls and notes together.</p>';
  const form = document.createElement('div');
  form.className = 'party-form';
  const input = document.createElement('input');
  input.type = 'text'; input.placeholder = 'Party name (e.g. The Last Lantern)'; input.maxLength = 40;
  const btn = document.createElement('button');
  btn.className = 'die-btn'; btn.textContent = 'Found the Party';
  btn.addEventListener('click', () => { if (input.value.trim()) createParty(input.value.trim()); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } });
  form.appendChild(input); form.appendChild(btn);
  wrap.appendChild(form);
  return wrap;
}

function buildPartyManager() {
  const wrap = document.createElement('div');

  const nameRow = document.createElement('div');
  nameRow.className = 'party-name-row';
  const nameEl = document.createElement('span'); nameEl.className = 'party-name'; nameEl.textContent = party.name;
  const actions = document.createElement('div'); actions.className = 'party-actions';
  const sessBtn = document.createElement('button'); sessBtn.className = 'link-btn'; sessBtn.textContent = 'New Session';
  sessBtn.addEventListener('click', newSession);
  const disbandBtn = document.createElement('button'); disbandBtn.className = 'link-btn'; disbandBtn.textContent = 'Disband';
  disbandBtn.addEventListener('click', disbandParty);
  actions.appendChild(sessBtn); actions.appendChild(disbandBtn);
  nameRow.appendChild(nameEl); nameRow.appendChild(actions);
  wrap.appendChild(nameRow);

  const chipsRow = document.createElement('div');
  chipsRow.className = 'member-chips';
  if (party.members.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'party-hint'; hint.style.margin = '0 0 10px'; hint.textContent = 'Add your first party member below.';
    wrap.appendChild(hint);
  }
  party.members.forEach(m => {
    const chip = document.createElement('span');
    chip.className = 'member-chip' + (party.activeMember === m ? ' active' : '');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'chip-name'; nameSpan.textContent = m;
    nameSpan.title = 'Set as current roller';
    nameSpan.addEventListener('click', () => setActiveMember(m));
    const removeSpan = document.createElement('span');
    removeSpan.className = 'remove'; removeSpan.textContent = '✕'; removeSpan.title = 'Remove';
    removeSpan.addEventListener('click', ev => { ev.stopPropagation(); removeMember(m); });
    chip.appendChild(nameSpan); chip.appendChild(removeSpan);
    chipsRow.appendChild(chip);
  });
  wrap.appendChild(chipsRow);

  const addRow = document.createElement('div');
  addRow.className = 'party-form';
  const memberInput = document.createElement('input');
  memberInput.type = 'text'; memberInput.placeholder = 'Add a member…'; memberInput.maxLength = 24;
  const addBtn = document.createElement('button'); addBtn.className = 'die-btn'; addBtn.textContent = 'Add';
  addBtn.addEventListener('click', () => { if (memberInput.value.trim()) { addMember(memberInput.value.trim()); memberInput.value = ''; } });
  memberInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); } });
  addRow.appendChild(memberInput); addRow.appendChild(addBtn);
  wrap.appendChild(addRow);

  const noteRow = document.createElement('div');
  noteRow.className = 'party-form';
  const noteInput = document.createElement('input');
  noteInput.type = 'text'; noteInput.maxLength = 200;
  noteInput.placeholder = party.activeMember ? `Note as ${party.activeMember}…` : 'Add a note…';
  const noteBtn = document.createElement('button'); noteBtn.className = 'die-btn'; noteBtn.textContent = 'Add Note';
  noteBtn.addEventListener('click', () => { if (noteInput.value.trim()) { addNote(noteInput.value.trim()); noteInput.value = ''; } });
  noteInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); noteBtn.click(); } });
  noteRow.appendChild(noteInput); noteRow.appendChild(noteBtn);
  wrap.appendChild(noteRow);

  return wrap;
}

function buildAuthPanel() {
  const wrap = document.createElement('div');
  wrap.className = 'auth-panel';

  if (!CLOUD_ENABLED) {
    wrap.innerHTML = '<p class="party-hint">Playing without an account — your party is saved on this device only. See SETUP.md to turn on cross-device accounts.</p>';
    return wrap;
  }

  if (currentUser) {
    const row = document.createElement('div');
    row.className = 'auth-row';
    const who = document.createElement('span');
    who.className = 'auth-who';
    who.textContent = 'Signed in as ' + currentUser.email;
    const out = document.createElement('button');
    out.className = 'link-btn'; out.textContent = 'Log Out';
    out.addEventListener('click', () => supabaseClient.auth.signOut());
    row.appendChild(who); row.appendChild(out);
    wrap.appendChild(row);
    return wrap;
  }

  const form = document.createElement('div');
  form.className = 'party-form auth-form';
  const emailInput = document.createElement('input');
  emailInput.type = 'email'; emailInput.placeholder = 'Email'; emailInput.autocomplete = 'email';
  const passInput = document.createElement('input');
  passInput.type = 'password'; passInput.placeholder = 'Password'; passInput.autocomplete = 'current-password';
  const loginBtn = document.createElement('button'); loginBtn.className = 'die-btn'; loginBtn.textContent = 'Log In';
  const signupBtn = document.createElement('button'); signupBtn.className = 'link-btn'; signupBtn.textContent = 'Sign up instead';
  const status = document.createElement('p'); status.className = 'party-hint auth-status';

  async function doLogin() {
    if (authBusy || !emailInput.value.trim() || !passInput.value) return;
    authBusy = true; status.textContent = 'Signing in…';
    const { error } = await supabaseClient.auth.signInWithPassword({ email: emailInput.value.trim(), password: passInput.value });
    authBusy = false;
    status.textContent = error ? error.message : '';
  }
  async function doSignup() {
    if (authBusy || !emailInput.value.trim() || !passInput.value) return;
    authBusy = true; status.textContent = 'Creating account…';
    const { error } = await supabaseClient.auth.signUp({ email: emailInput.value.trim(), password: passInput.value });
    authBusy = false;
    status.textContent = error ? error.message : 'Check your email to confirm your account, then log in.';
  }

  loginBtn.addEventListener('click', doLogin);
  signupBtn.addEventListener('click', doSignup);
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } });

  form.appendChild(emailInput); form.appendChild(passInput); form.appendChild(loginBtn); form.appendChild(signupBtn);
  wrap.appendChild(form);
  wrap.appendChild(status);
  const hint = document.createElement('p');
  hint.className = 'party-hint';
  hint.textContent = 'Log in to keep your party across devices. Without an account it only lives on this browser.';
  wrap.appendChild(hint);
  return wrap;
}

function renderAll() {
  const authWrap = document.getElementById('authPanel');
  authWrap.innerHTML = '';
  authWrap.appendChild(buildAuthPanel());

  const panel = document.getElementById('partyPanel');
  panel.innerHTML = '';
  if (partyLoading) {
    panel.innerHTML = '<p class="party-hint">Loading your party…</p>';
  } else {
    panel.appendChild(party ? buildPartyManager() : buildCreateForm());
  }
  renderLedger();
}

// ---------------------------------------------------------------------------
// Init — reacts to sign-in / sign-out, migrates a local party on first login
// ---------------------------------------------------------------------------
async function refreshPartyForAuthState() {
  if (currentUser && supabaseClient) {
    partyLoading = true; renderAll();
    party = (await migrateLocalPartyIfAny()) || (await loadCloudParty());
    partyLoading = false;
  } else {
    party = loadLocalParty();
    partyRowId = null;
  }
  renderAll();
}

function initParty() {
  if (!CLOUD_ENABLED) {
    party = loadLocalParty();
    renderAll();
    return;
  }
  let lastUserId; // undefined so the very first auth event always triggers a load
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    const nextId = currentUser ? currentUser.id : null;
    if (nextId !== lastUserId) {
      lastUserId = nextId;
      refreshPartyForAuthState();
    }
  });
}

initParty();
