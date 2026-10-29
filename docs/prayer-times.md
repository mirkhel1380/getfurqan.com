# Prayer times and annual calendars

`/prayer-times.html` is reachable from a visible header link, the navigation drawer and footer on all 37 pages, plus homepage service card 08. It supports 249 ISO country/territory codes, an entered city and optional state/province, and Gregorian years 1900–2100. Country names follow the selected website language through Intl.DisplayNames. English, Dari and Pashto retain the global language ordering; 70 new UI messages are translated in all 13 dictionaries.

The public AlAdhan v1 `calendarByCity/{year}` endpoint returns the complete annual calendar. A single request loads all 365 or 366 dates. The response is validated for exact year coverage, unique and valid dates, a consistent valid IANA time zone, the requested calculation method and Asr school, and well-formed ISO 8601 times. Missing events explicitly reported by the provider show a dash; no missing day or prayer time is fabricated. Following-day events carry a +1 marker. Source local clocks and their UTC offsets are preserved rather than converted into the visitor device's time zone.

The default method is Automatic by location. Changing the country resets the method to Automatic and clears city/province to avoid retaining a city from another country. Users can choose named calculation methods, Hanafi or Standard Asr, and high-latitude adjustment. The effective provider method is disclosed with source details. Default location is Kabul, Afghanistan, with Hanafi Asr; the website does not request device geolocation.

A date picker shows six daily events: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha. The full-year table can be filtered by month. A UTF-8 CSV download always contains the complete loaded year, not just the visible month, with source/settings and ISO timestamps retaining UTC offsets. CSV cells quote commas, quotes and line breaks and neutralize spreadsheet formula prefixes in entered place names.

Location/settings and the last validated calendar are saved only in browser storage, with a 24-hour cache lifetime. Changing any request setting hides previous results until a matching complete calendar is loaded. Requests have a 35-second deadline, disable duplicate submissions, and restore controls after errors. A cached response must match every request setting and pass validation again. No accounts or database schemas were changed.

The page explicitly distinguishes calculated prayer start times from congregational/Friday schedules, identifies Gregorian and calculated Hijri dates, explains method differences and asks visitors to confirm the local mosque's convention. It does not claim government or mosque certification.

Official sources consulted 2026-10-29:
- https://aladhan.com/prayer-times-api
- https://aladhan.com/calculation-methods

`docs/prayer-source-check.json` records live annual checks for Kabul 2026, daily/annual agreement for 1 January, and London 2028 leap-year coverage and summer/winter UTC offsets. This verifies source integration, not independent astronomical certification.

Run `node scripts/check-prayer-times.mjs` for year/date/offset, completeness, invalid-input, CSV and navigation checks. The existing theme, interface localization and featured-ayah action checks also pass. Generate the page from the tracked fragment and country data with `python scripts/build-prayer-page.py`.
