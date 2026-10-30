# Website language

The header globe sets the interface language in place. The footer language section was removed at the owner’s request. Language controls no longer link to Al-Fatihah or the translations page. English, Dari and Pashto remain the first choices; Other languages expands the remaining choices without navigation. All 39 HTML pages load the same controller and locale styles. The globe is available on small screens, too.

`af-site-language` stores the interface language in this browser. It is independent of Quran translation, tafsir edition, reciter, passage, reading progress and account state. No URL or passage change is performed. Other open tabs update through the storage event. A failed or invalid language pack leaves the previous language active.

The 13 checked-in JSON catalogs contain 1,225 matching interface messages per language: common menus, actions, page headings, homepage text, reading controls, account forms and key loading/error messages. Runtime UI changes are localized without replacing DOM controls or their event handlers. Existing source prose and metadata without a catalog entry are retained, rather than translated automatically or misrepresented as a published edition. Further editorial text can be added to these catalogs without changing the selection mechanism.

Published Arabic, verse translations, translator notes, tafsir bodies, word meanings, Hadith excerpts/text/grades, source edition names, personal notes, emails and user names are excluded from interface translation. No remote translation service or generated religious translation is used. Source editions remain independently selected through their existing controls.

RTL applies to Dari, Pashto, Persian and Urdu. Explicit source-language direction attributes are preserved. Returning to English restores the original interface strings; client-rendered labels also update. The page builders include the shared controller and stylesheet.

Validation: `node scripts/check-site-language.mjs`, existing auth form/callback checks, JavaScript syntax and `git diff --check`. Browser checks cover language selection without navigation, remembered choice across pages, English/Pashto/Dari/German switching, source protection and RTL layout.

## Interface completion, 30 October 2026

Added 383 messages per language for reader/study controls, listening, source/status help, Hadith navigation, About, translation choices and reading progress. `interface-message-keys.json` records this bounded addition. Dynamic message patterns preserve verse references, coverage ranges, source names and counter values. Composite labels and page titles reuse translated parts. Fields localize only their placeholders/accessibility labels; entered values are untouched.

Source texts remain excluded. Only explicitly marked translator-note buttons and disclosure headings inside a source block are treated as interface controls. The footnote itself, Arabic ayah, translation, tafsir, word meaning and personal note are not translated. External edition selectors keep their source-language labels and selected values. The interface choice does not navigate or reload content from another edition. Source metadata such as externally supplied surah meanings remains in its source form.

Progress date labels use the chosen interface locale. Invalid/missing catalogs or mismatched placeholder names retain the previous language. Catalog version: `20261030-interface2`. Tests cover counter formatting, source protection, field-value preservation, English restoration and existing source/control invariants.

The discovery update adds three 404 interface messages per language (1,225 total). Shared catalog/controller version: `20261030-seo1`.
