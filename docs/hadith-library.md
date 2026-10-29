# Hadith library

The library exposes all ten available collections from fawazahmed0/hadith-api at
revision `df57907be35291c91ad6a6691180e22ca9920784`, supplied under The Unlicense.
The complete Arabic and English editions were downloaded to a reproducible
scratch cache and inventoried before implementation. The source strings are
never generated, corrected or translated by Al Furqan.

Coverage: 36,512 numbered source entries; 36,108 have Arabic and/or English text;
404 have neither. Repeated narrations/versions remain distinct. This does not
claim to contain every hadith in existence, or to certify every report as sahih.
Per-collection counts, raw input hashes, source book assignments and edition
attributions are in `dist/content/hadith/catalog.json`.

Collections: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Muwatta Malik,
Nawawi's Forty (42 numbered reports in the source), Forty Hadith Qudsi, and the
Forty Hadith of Shah Waliullah Dehlawi. The last three are curated collections;
they must not be presented as the traditional Nine Books.

## Pages and content delivery

- `/hadiths.html`: complete collection catalogue and source-number lookup.
- `/hadith/{collection}.html`: separate static collection pages, with all indexed
  book/source groups and title filtering.
- `/hadith-book.html?collection=bukhari&book=1`: individual book page with
  pagination, source-language selection and text search inside that book.
- `/hadith.html?collection=bukhari&hadith=1`: permanent individual-report page,
  with Arabic, available source translations, complete source reference,
  reported grades/evaluator names, text-size controls and citation copying.

All reading stays inside Al Furqan. Published report text loads on demand from
pinned raw GitHub resources, with jsDelivr as a second source URL. Individual
endpoints missing upstream fall back to the published book or complete edition;
reference checks apply to every result, including fallbacks. The local index
contains all IDs and assignments, not an invented title for every narration.
Blank source entries are explicitly marked; no replacement text is generated.

Some source records have book 0/unassigned metadata. A blank book title is
labelled 'Book not assigned in source', rather than falsely assigning a chapter.
Numbering includes decimal IDs and can differ between printed editions. Each
Arabic and English report's book/report reference was checked to agree in the
complete source inventory. A translation with a mismatched reference is rejected
at runtime. Search normalizes Arabic diacritics/alif for matching only; displayed
source strings are unchanged.

Available translation languages depend on the collection. The interface offers
only editions listed by the source, and distinguishes the source's author/
attribution field from a verified translator identity. If no individual grade is
supplied, the page says so. It does not infer a grade from a collection name.

## Reproduction and validation

Run `python scripts/import-hadith-catalog.py` to inventory the pinned source
editions and generate the index, then `python scripts/build-hadith-pages.py`.
The importer caches full source inputs in `../hadith-source`. Source text remains
external at reading time; this is not a fully offline hadith archive.

Validation completed: all 36,512 unique IDs, per-book/per-collection counts,
36,108 nonempty records, Arabic/English reference agreement, decimal/Arabic-digit
lookup, wrong-reference rejection, missing-single-endpoint fallback, Arabic
search normalization and all local page/anchor targets. Browser QA covered the
Arabic/English reader, Urdu translation, source grading, source-number lookup,
book search/empty results, book navigation and 375px library/reader layouts.
This is implementation/data-integrity validation, not specialist hadith review.

`scripts/check-hadith-endpoints.py` samples first/last/fractional numbered source
endpoints and records missing individual routes separately. It checks their
cached full-edition source hashes rather than treating a missing single route
as a missing narration. It does not assign religious authenticity.
