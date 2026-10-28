# Weekly ayah and Islamic topics

Added after the existing animated homepage hero. The weekly component rotates
through eight manually selected verse references every Monday at 00:00 UTC.
The same date selects the same verse for all visitors. After eight weeks the
selection repeats; it does not generate verses or religious prescriptions.
Without JavaScript, the initial passage is labelled a featured verse rather
than incorrectly claiming it is the current week's selection.

Arabic, English, Dari and Persian source strings are copied unchanged from
QuranEnc's published single-ayah API. The three Arabic copies for each reference
were checked for exact equality. Original translator notes are preserved, with
safe semantic rendering. The component names the publisher and source, displays
available edition versions, and records raw-response hashes and fetch date in
`dist/content/weekly-verses.json`. QuranEnc's current metadata list supplies
English v1.1.2 and Persian v1.1.3. It does not list a version for the Dari edition;
the source details say so, without inventing a version number. The Dari edition
and translator are confirmed on the publisher's old-design browse page.

QuranEnc permits republishing without changing text, with source, publisher and
version attribution, preserved transcript information and updates to published
versions: https://quranenc.com/en/home/api (Terms and Policies).

Refresh published snapshots with `python scripts/fetch-weekly-verses.py`, then
`python scripts/build-weekly.py`. Check publisher updates before republishing.
The download script never rewrites Arabic or translations. Dates and rotation
are in `dist/weekly-schedule.mjs`. Translations are selected independently of the
Quran reader's saved settings. No synthetic audio is added.

An attempted automated comparison with the Quran.com Uthmani API returned HTTP
403 from this environment. No independent automated comparison is claimed.
`scripts/check-weekly-sources.py` can perform that base-letter comparison where
API access is available; it never changes the displayed Arabic. Full specialist
proofreading of Quran display/diacritics remains outside this implementation.

## Topics

The homepage introduces four topics and links to `/topics.html`, which contains
eight complete introductions with category filtering and text search. Each topic
has its own static HTML page under `/topics/`, works without JavaScript, and
contains three sections, takeaways, references and related topics. Global menus
and full footers link to the topics hub. Public Quran references open in the
existing Al Furqan reader; Hadith source references are explicitly external.

Editorial source: `content-topics.json`.
Generator: `python scripts/build-topics.py`.
These introductions are labelled editorial summaries, separate from published
tafsir and Quran translations. They do not contain invented Hadith quotations.

Sources checked on 2026-10-28:
- Faith: Quran 2:177, 2:183, 3:97; Sahih al-Bukhari 8.
- Prayer: Quran 20:14, 2:153, 2:43.
- Quran: Quran 17:9, 38:29.
- Dhikr/dua: Quran 2:152, 13:28, 2:186.
- Giving: Quran 2:177, 2:261–262; Sahih al-Bukhari 8.
- Character: Quran 4:36, 3:134, 49:13.
- Patience: Quran 2:153, 2:155–157, 94:5–6.
- Repentance: Quran 39:53–54, 3:135.

Texts were consulted on Quran.com and Sunnah.com, with QuranEnc supplying the
unchanged weekly verse text and translations. There is no claim of scholarly
certification or new tafsir authorship.

Validation: JavaScript syntax; rotation at the Sunday/Monday boundary, equivalent
time zones, eight-week wrap, pre-anchor and invalid dates; all 24 translations
present; internal file and anchor checks; browser checks of the three language
buttons, category/search/empty results, topic article, reader reference, desktop
and 375px layouts. Existing app registration remains paused pending email setup
and owner authorization, as documented separately in accounts-setup.md.
