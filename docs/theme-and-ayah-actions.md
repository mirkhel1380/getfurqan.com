# Theme and featured ayah actions

All 36 pages load the synchronous theme bootstrap before paint and share Light, Dark, System controls under Preferences. `af-theme` persists the preference. System follows live OS changes; tabs synchronize via the storage event. Existing reader dark preferences migrate once, and the reader opens the same global controls. Its Tajweed font selection reloads when the resolved theme changes, preserving its existing light/dark font palettes. No CSS inversion is used on Quran text or imagery.

The existing Monday/UTC weekly selection and all pinned Arabic, translations and translator notes remain unchanged. Its three actions:

- Views: public aggregate Supabase RPC `af_ayah_views`, with one random browser token per verse per UTC day. Only count after the Arabic enters the viewport. Repeated requests with that token are idempotent. Counts are recorded visits, not verified people or fraud-resistant analytics. Browser storage failure leaves the count read-only and explains why a visit was not recorded. No emails, IPs or account IDs are stored. Tokens are inaccessible to clients, with bounded pruning after 30 days. A 100,000-per-verse daily ceiling bounds abuse.
- Reflections: explicitly personal notes, stored only in the current browser, keyed by verse under `af-ayah-reflections-v1`. Save/Delete work independently per verse. Failure preserves the draft. They are not published tafsir or community comments. Browser data deletion removes notes.
- Share: native share sheet where supported; otherwise copy the canonical `https://getfurqan.online/reader.html` URL with the current verse and translation. If clipboard access fails, a selectable URL is shown. No outbound messages are sent automatically.

13 interface catalogs now contain 479 identical keys. User note values and source scripture are excluded from localization.

Backend definition: `backend/ayah-views.sql`; rollback-only integration checks: `backend/ayah-views-check.sql`. The two private metric tables deliberately have RLS enabled with no direct policies/grants; only a non-exposed definer function with empty search_path returns aggregate counts through an invoker public wrapper. Anonymous execution is intentional for this non-sensitive, public reading metric. No auth authorization code was changed.

Security advisor: INFO for private tables with no RLS policies is intentional deny-all, see https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy . Existing unrelated leaked-password-protection warning remains unchanged, see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

Verification: theme state tests, featured-action tests, database rollback integration checks, localization checks and existing contact/auth/password regressions. Browser QA covers theme persistence, per-ayah note saving, sharing and actual view count response. Managed local preview is used for UI verification; the native deployment remains owner-private.
