/* =========================================================================
   PARTY ROOM
   -------------------------------------------------------------------------
   Everything here is scoped to ONE party (?party=<id> in the URL). Access
   is enforced twice over: once here (so non-members get a clear message
   instead of a broken page), and again by the database's row-level
   security policies (so it's enforced even if this file didn't bother).
   ========================================================================= */

let me = null;
let partyId = null;
let party = null;
let myRole = null;       // 'dm' | 'player'
let currentSessionId = null;
let expandedSessionId = null; // which accordion item is open, if any

(async function initPartyRoom() {
  me = await requireSession();
  partyId = new URLSearchParams(window.location.search).get('party');
  if (!partyId) { showBlocked('No party specified.'); return; }

  const { data: membership } = await supabaseClient
    .from('party_members').select('role').eq('party_id', partyId).eq('user_id', me.id).maybeSingle();
  if (!membership) { showBlocked("You're not a member of this party."); return; }
  myRole = membership.role;

  const { data: partyRow, error: partyErr } = await supabaseClient.from('parties').select('*').eq('id', partyId).single();
  if (partyErr || !partyRow) { showBlocked('That party could not be found.'); return; }
  party = partyRow;

  document.getElementById('partyTitle').innerHTML = escapeHtml(party.name) + ' <span>· ' + (myRole === 'dm' ? 'DM' : 'Player') + '</span>';
  document.title = party.name + ' - The Faerie\'s Fortune';

  await ensureSession();
  await renderPartyInfo();
  await refreshLog();
  await refreshAccordion();
})();

function showBlocked(message) {
  document.getElementById('partyInfo').innerHTML = `<p class="party-hint">${escapeHtml(message)}</p><p><a href="dashboard.html" class="link-btn">Back to your parties</a></p>`;
  document.querySelectorAll('.theme-select, .dice-select, .tray-wrap, .hint, .hamburger-row, .hamburger-panel, .ledger').forEach(el => el.style.display = 'none');
}

async function ensureSession() {
  const { data: latest } = await supabaseClient
    .from('sessions').select('id').eq('party_id', partyId).order('started_at', { ascending: false }).limit(1).maybeSingle();
  if (latest) { currentSessionId = latest.id; return; }
  if (myRole !== 'dm') return; // players wait for the DM's first session
  const { data: created } = await supabaseClient.from('sessions').insert({ party_id: partyId, label: 'Session 1' }).select().single();
  if (created) currentSessionId = created.id;
}

// ---------------------------------------------------------------------------
// Roster - DM stands out with a crown, your own entry is marked "(You)"
// ---------------------------------------------------------------------------
async function renderPartyInfo() {
  const panel = document.getElementById('partyInfo');
  const { data: roster } = await supabaseClient
    .from('party_members').select('user_id, role, user:profiles(display_name)').eq('party_id', partyId);

  panel.innerHTML = '';
  const nameRow = document.createElement('div');
  nameRow.className = 'party-name-row';
  const nameEl = document.createElement('span'); nameEl.className = 'party-name'; nameEl.textContent = party.name;
  const actions = document.createElement('div'); actions.className = 'party-actions';
  if (myRole === 'dm') {
    const sessBtn = document.createElement('button'); sessBtn.className = 'link-btn'; sessBtn.textContent = 'New Session';
    sessBtn.addEventListener('click', startNewSession);
    actions.appendChild(sessBtn);
  }
  nameRow.appendChild(nameEl); nameRow.appendChild(actions);
  panel.appendChild(nameRow);

  const chips = document.createElement('div');
  chips.className = 'member-chips';
  // DMs first, then everyone else, so the standout chip reads first
  const sorted = (roster || []).slice().sort((a, b) => (a.role === 'dm' ? -1 : 0) - (b.role === 'dm' ? -1 : 0));
  sorted.forEach(r => {
    const isDM = r.role === 'dm';
    const isMe = r.user_id === me.id;
    const chip = document.createElement('span');
    chip.className = 'member-chip' + (isDM ? ' dm' : '') + (isMe ? ' you' : '');
    const name = r.user ? r.user.display_name : 'Unknown';
    chip.innerHTML = (isDM ? '<span class="crown" title="Dungeon Master">♛</span>' : '') +
      escapeHtml(name) + (isMe ? ' <span class="you-tag">(You)</span>' : '');
    chips.appendChild(chip);
  });
  panel.appendChild(chips);

  if (myRole === 'dm') {
    const inviteRow = document.createElement('p');
    inviteRow.className = 'party-hint';
    inviteRow.innerHTML = 'Invite code: <strong style="letter-spacing:0.1em; color:var(--accent-bright);">' + escapeHtml(party.invite_code) + '</strong> - share it so players can join.';
    panel.appendChild(inviteRow);
  }
}

async function startNewSession() {
  const { data: created } = await supabaseClient.from('sessions').insert({ party_id: partyId, label: null }).select().single();
  if (!created) return;
  currentSessionId = created.id;
  expandedSessionId = created.id;
  await supabaseClient.from('log_entries').insert({ party_id: partyId, session_id: currentSessionId, user_id: me.id, type: 'session' });
  await refreshLog();
  await refreshAccordion();
}

// ---------------------------------------------------------------------------
// Log - rolls and session dividers only. Notes live in the hamburger panel.
// ---------------------------------------------------------------------------
async function refreshLog() {
  const log = document.getElementById('log');
  const { data, error } = await supabaseClient
    .from('log_entries')
    .select('type, die, display, crit, fail, created_at, user:profiles(display_name)')
    .eq('party_id', partyId)
    .neq('type', 'note')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) { log.innerHTML = '<li class="empty">Couldn\'t load the log.</li>'; return; }
  if (!data || data.length === 0) { log.innerHTML = '<li class="empty">No rolls yet - give it a throw.</li>'; return; }

  log.innerHTML = '';
  data.forEach(e => log.appendChild(renderEntry(e)));
}

function renderEntry(e) {
  const li = document.createElement('li');
  if (e.type === 'session') {
    li.className = 'log-session';
    li.textContent = 'Session began · ' + timeLabel(e.created_at);
    return li;
  }
  const who = e.user ? escapeHtml(e.user.display_name) + ' · ' : '';
  if (e.crit) li.classList.add('crit');
  if (e.fail) li.classList.add('fail');
  li.innerHTML = `<span>${who}${e.die} · ${timeLabel(e.created_at)}${e.crit ? ' · critical!' : ''}${e.fail ? ' · fumble' : ''}</span><span class="val">${e.display}</span>`;
  return li;
}

// Called by dice.js's finishRoll() once a roll settles.
async function recordRoll(cfg, display, isCrit, isFail) {
  await supabaseClient.from('log_entries').insert({
    party_id: partyId, session_id: currentSessionId, user_id: me.id,
    type: 'roll', die: cfg.label, display, crit: !!isCrit, fail: !!isFail,
  });
  refreshLog();
}

// ---------------------------------------------------------------------------
// Hamburger panel - add a note, and a cascading (expand/collapse) list of
// sessions with that session's notes tucked inside.
// ---------------------------------------------------------------------------
const hamburgerBtn = document.getElementById('hamburgerBtn');
const hamburgerPanel = document.getElementById('hamburgerPanel');
hamburgerBtn.addEventListener('click', () => {
  const open = hamburgerPanel.hasAttribute('hidden');
  if (open) hamburgerPanel.removeAttribute('hidden'); else hamburgerPanel.setAttribute('hidden', '');
  hamburgerBtn.setAttribute('aria-expanded', String(open));
});

async function refreshAccordion() {
  const wrap = document.getElementById('sessionAccordion');
  const [{ data: sessions }, { data: notes }] = await Promise.all([
    supabaseClient.from('sessions').select('id, label, started_at').eq('party_id', partyId).order('started_at', { ascending: false }),
    supabaseClient.from('log_entries').select('session_id, note_text, created_at, user:profiles(display_name)')
      .eq('party_id', partyId).eq('type', 'note').order('created_at', { ascending: false }),
  ]);

  if (!sessions || sessions.length === 0) { wrap.innerHTML = '<p class="party-hint">No sessions yet.</p>'; return; }

  const notesBySession = {};
  (notes || []).forEach(n => {
    if (!notesBySession[n.session_id]) notesBySession[n.session_id] = [];
    notesBySession[n.session_id].push(n);
  });

  wrap.innerHTML = '';
  sessions.forEach((s, i) => {
    const sessionNotes = notesBySession[s.id] || [];
    const item = document.createElement('div');
    item.className = 'accordion-item' + (expandedSessionId === s.id ? ' expanded' : '');

    const header = document.createElement('button');
    header.className = 'accordion-header';
    header.type = 'button';
    const label = s.label || ('Session · ' + dateTimeLabel(s.started_at));
    header.innerHTML = `<span><span class="caret">▸</span>${escapeHtml(label)}</span><span class="accordion-count">${sessionNotes.length} note${sessionNotes.length === 1 ? '' : 's'}</span>`;
    header.addEventListener('click', () => {
      expandedSessionId = (expandedSessionId === s.id) ? null : s.id;
      refreshAccordion();
    });

    const body = document.createElement('div');
    body.className = 'accordion-body';
    if (sessionNotes.length === 0) {
      body.innerHTML = '<p class="accordion-empty">No notes in this session yet.</p>';
    } else {
      const ul = document.createElement('ul');
      sessionNotes.forEach(n => {
        const li = document.createElement('li');
        const who = n.user ? escapeHtml(n.user.display_name) + ' · ' : '';
        li.innerHTML = `<span>${who}“${escapeHtml(n.note_text)}”</span><span>${timeLabel(n.created_at)}</span>`;
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }

    item.appendChild(header);
    item.appendChild(body);
    wrap.appendChild(item);
  });
}

document.getElementById('noteBtn').addEventListener('click', async () => {
  const input = document.getElementById('noteInput');
  const text = input.value.trim();
  if (!text || !currentSessionId) return;
  input.value = '';
  expandedSessionId = currentSessionId; // open the session your note landed in
  await supabaseClient.from('log_entries').insert({
    party_id: partyId, session_id: currentSessionId, user_id: me.id, type: 'note', note_text: text,
  });
  refreshAccordion();
});
document.getElementById('noteInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('noteBtn').click(); } });
document.getElementById('refreshBtn').addEventListener('click', () => { refreshLog(); refreshAccordion(); });
