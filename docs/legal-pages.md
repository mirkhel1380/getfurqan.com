# Privacy policy and terms

Two public pages, `/privacy.html` and `/terms.html`, have independent canonical URLs, a revision date of 29 October 2026, shared navigation, on-page contents and links to the contact form and `contact@getfurqan.online`. Their full text follows all 13 website languages. The 54 new legal messages bring every catalog to 746 keys; shared language assets now use `20261029-legal1`.

Both pages are linked from all 39 page footers, including the smaller account-page footers. Contact-form and account privacy links now point directly to the full policy. The signup information also links the terms; no new consent claim, checkbox, authentication requirement or backend change was introduced. The About page retains its reading-data overview and adds links to the full notices.

The notices were written against existing source behavior: local notes/bookmarks/progress and preferences, Supabase account/profile/admin records, private contact inbox, weekly-ayah random view tokens and aggregates, AlAdhan city-based requests, source content delivery and public GitHub Pages hosting. Passwords are not exposed in the admin UI. Local reading data does not sync when signing in. No unsupported automatic deletion schedule, privacy certification, legal entity, court jurisdiction, physical address or service guarantee is asserted. Contact/admin records currently lack automatic expiry; users can request deletion by email. Rights and statutory protections are described subject to applicable law, without asserting universal regulatory compliance.

Drafting structure was checked against the ICO's transparency guidance (identity/contact, information categories, purposes, recipients, retention, international processing, rights and changes):
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/how-should-we-draft-our-privacy-information/

These references inform drafting, not a determination of which country's laws apply to the operator. The terms retain mandatory legal and consumer rights and distinguish published religious sources, editorial content and personal notes. They describe calculation limits of prayer times without changing the prayer feature.

The English content is maintained in `content-legal.json`; rebuild the two pages with `python scripts/build-legal-pages.py`. It reuses the current Contact header/footer. Existing page generators retain the current legal footer through shared markup from the homepage. Source text is static and readable without JavaScript; localization and theme use the existing site controls. The selected legal tab has a scoped text-color rule so the global dark-theme link palette cannot hide its label.

Validation: all legal text nodes have translations in every catalog; local anchors, unique IDs, dates, canonical URLs, cross-links and email checked; authentication inputs/buttons unchanged; interface-language, global-theme and complete-topic checks pass. The topic reference check now compares the article's main content instead of unrelated header/footer links and uses the current language asset version.
