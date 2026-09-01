# FE QUEST v351 — Progress / Settings Layout Audit

Status: **PASS — RESPONSIVE LAYOUT REPAIR VALIDATED**  
Previous production: **v345**  
Target production: **v351**  
Profile schema: **v5**

## Observed problem

Desktop screenshots showed that the 330px settings rail was too narrow for the cloud-sync heading, status chip, email form, PWA install guidance, and application-health tiles. Japanese copy wrapped into many short lines, the email field was compressed by its button, and the right rail became visually much taller than the learning-progress rail.

## Repair

- At viewports 1450px and wider, the active Plan screen expands to a 1180px main area and reserves at least 390px for the settings rail.
- At intermediate desktop/tablet widths, the two plan columns stack instead of preserving an unreadably narrow rail.
- The cloud heading and status are separated into stable rows.
- The email field uses the full card width and its action no longer compresses the input.
- The PWA install card uses an explicit icon/copy/action grid.
- Application-health tiles use 2 columns in the wide settings rail, 3 columns in a stacked desktop card, and 1 column on mobile.

## Automated evidence

Static release contract: **25 / 25 PASS**

Browser preflight:

| Case | Layout contract | Result |
|---|---|---|
| Chromium 1920 × 1080 | 610px / 476px columns; cloud heading 1 line; email field 434px | PASS |
| Chromium 1366 × 900 | safe 1-column stack; cloud heading 1 line; email field 866px | PASS |
| Mobile Chromium 390 × 844 | 1-column stack; email field/button 326px; no horizontal overflow | PASS |

The pull-request workflow repeats the mobile case with Playwright WebKit. All cases require no document/card overflow, no asset-recovery overlay, and no uncaught page error.

## Safety boundary

- v345 assets remain unchanged and available for rollback.
- v351 JavaScript differs from v345 only in `APP_VERSION`.
- v351 shell differs from v345 only in versioned title, asset references, and recovery-bootstrap identifier.
- Question content, answer keys, adaptive logic, profile schema, saved learning data, Recovery Center, JSON backup, and cloud runtime are unchanged.
- The v342 cloud runtime stays optional and local-first.
