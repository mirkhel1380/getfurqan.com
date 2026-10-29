# Complete topic article localization

All eight existing Islamic topic introductions now use the site's 13 interface languages: English, Dari, Pashto, Persian, German, Dutch, French, Italian, Urdu, Turkish, Spanish, Portuguese and Indonesian.

The shared dictionaries cover the article lead, three sections, headings, takeaways, reference descriptions, narration summaries, action links, article metadata, sidebar, related-topic descriptions and hub introduction. There are 135 unique content strings across the eight source records; new article and supporting messages expand each catalog from 549 to 692 entries. Existing English source content stays unchanged in `content-topics.json` and static HTML. This extends the existing reversible DOM localization instead of creating a separate language selector or navigating away.

These are translations of the site's editorial introductions. They are not newly published Quran translations, scholarly tafsir, verbatim Hadith quotations or independently certified religious texts. Arabic badges, Quran/tafsir/translation source text, proper source names, reference numbers, anchor IDs and destination URLs remain unchanged. All Quran references inside translated paragraphs were compared with their English source. The UI label `Quran 2:177` can localize the word Quran while retaining `2:177` exactly.

The topic filter re-runs after a website language change so visibility and result counts reflect the current translated card text. User-entered searches are retained, not automatically translated. The existing English/Dari/Pashto-first language order, global light/dark/system theme and prayer timetable are preserved.

All 37 pages and source generators use the new `20261029-topics1` language cache version. No database, authentication, Quran source snapshots, weekly schedule or prayer calculation changes are part of this update.

Verification:
- `node scripts/check-topic-languages.mjs`: all topic content in all 13 languages; reference preservation, English restoration, stable source URLs/anchors/Arabic language attributes.
- Existing interface-language, global-theme and prayer-calendar checks.
- Browser QA: full article switches in place between Dari, German and Dutch; localized hub search and RTL/LTR behavior.
