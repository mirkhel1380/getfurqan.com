# Al Furqan

Buildless Quran website. Static output is in `dist/`; GitHub Pages serves the
same files at repository root. The Sites manifest preserves the existing Site.
The configured custom domain is `getfurqan.online`; direct browser availability
could not be verified from this environment.

Features include Uthmani/IndoPak/Tajweed Quran reading, translations in 13 languages,
recitation, published tafsir, adhkar, search, local study notes and progress.
The home page adds a weekly ayah and an eight-topic Islamic learning section.
See `docs/topics-and-weekly.md` for sources and reproduction steps.

Optional verified accounts and private user administration use a separate
Supabase project. Registration is paused pending email delivery configuration
and explicit owner-email approval. See `docs/accounts-setup.md`.
Bookmarks, notes and reading progress remain browser-local; sign-in does not
provide cross-device synchronization.

Published Quran and translation text is never generated or manually rewritten.
Qualified full-corpus Quran proofreading remains pending; this is not a
certified Mushaf. External providers and fonts require network access.

The auth SDK is pinned and locally vendored with its license. To reproduce:
`npm ci`, then `npm run vendor:auth`.
