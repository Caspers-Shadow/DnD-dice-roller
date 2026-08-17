# The Faerie's Fortune - Setup Guide

This site works with **zero setup** - open `index.html` and it plays fine,
saving each party to whichever browser created it (via `localStorage`).

This guide covers the two optional upgrades: turning on **accounts** (so a
party follows you across devices), and **publishing** the site.

---

## Files in this project

| File          | What it does                                                    |
|---------------|-------------------------------------------------------------------|
| `index.html`  | Page structure only                                              |
| `styles.css`  | All visual styling and themes                                    |
| `dice.js`     | The 3D dice, rolling, table themes, and fantasy backgrounds       |
| `party.js`    | Parties, sessions, notes, and accounts                           |
| `config.js`   | **The one file you edit** - your Supabase project keys go here   |

All five files need to be uploaded together and kept in the same folder -
`index.html` loads the others by filename.

---

## Part 1 - Turn on accounts (optional)

Skip this section if you're happy with party data staying on one browser.

### 1. Create a free Supabase project
Go to [supabase.com](https://supabase.com), sign up, and create a new
project (pick any name/region, and save the database password it gives
you somewhere safe - you won't need it for this setup, but Supabase asks
you to set one).

### 2. Create the parties table
In your new project, open the **SQL Editor** (left sidebar) → **New query**,
paste this in, and click **Run**:

```sql
create table parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  members jsonb not null default '[]',
  active_member text,
  log jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table parties enable row level security;

create policy "Users manage their own party"
  on parties for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

This creates one table, turns on row-level security, and adds a policy so
each person can only ever see and edit their own party - Supabase enforces
this at the database level, not just in the site's code.

### 3. Copy your API keys
Go to **Project Settings** (gear icon) → **API**. You need two values:
- **Project URL**
- **anon public** key (NOT the `service_role` key - that one must stay secret and never go in a public file)

### 4. Paste them into `config.js`
Open `config.js` and replace the placeholders:

```js
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-long-anon-key';
```

Save the file. That's it - reload the site and you'll see email/password
sign-in appear above the party panel.

### 5. (Recommended) Turn off email confirmation for testing
By default, Supabase makes new users confirm their email before they can
log in. That's good for a real launch, but if you just want to try things
out immediately: **Authentication → Providers → Email**, and toggle off
**"Confirm email"**. Turn it back on before sharing the site with anyone
else.

### A note on what "accounts" means here
This uses Supabase's own hosted auth and database - there's no server for
you to run or maintain. The anon key is safe to expose in a public file by
design (that's what row-level security in step 2 is for); it can only ever
act as whichever user is currently logged in, never as anyone else.

---

## Part 2 - Publish with GitHub Pages

1. Create a free GitHub account at [github.com](https://github.com) if you
   don't have one.
2. Click **+** (top right) → **New repository**. Give it a name (this
   becomes part of your URL), set it to **Public**, and don't add a
   README.
3. On the repository page, **Add file → Upload files**, and drag in **all
   five files** (`index.html`, `styles.css`, `dice.js`, `party.js`,
   `config.js`) at once, keeping them all at the top level of the repo.
   Commit to `main`.
4. Go to **Settings → Pages**. Under "Build and deployment", set **Source**
   to "Deploy from a branch", branch **main**, folder **/ (root)**, then
   **Save**.
5. Wait about a minute, refresh that settings page, and your live URL will
   appear - something like `https://yourusername.github.io/your-repo/`.

If you update `config.js` (or any file) later, just upload the new version
over the old one in the repo and Pages will redeploy automatically within
a minute or so.
