/* =========================================================================
   CONFIG — the only file you need to edit to turn on accounts.
   -------------------------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. In the project, go to Project Settings → API and copy:
        - "Project URL"        → paste as SUPABASE_URL below
        - "anon public" key    → paste as SUPABASE_ANON_KEY below
   3. Run the SQL in SETUP.md once, in Supabase's SQL editor, to create the
      table your parties are stored in.
   Full walkthrough: see SETUP.md in this same folder.

   Leaving these as-is is fine — the site still works, it just keeps each
   party on the browser that created it instead of syncing to an account.
   ========================================================================= */

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdGJpdWhocXpjcnhkbmx6bHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTM3NzgsImV4cCI6MjEwMjU2OTc3OH0.gEzap0G2hkFZUzQBwAJSLWkK1vJWEQYt1cD4SxGCwu8';
