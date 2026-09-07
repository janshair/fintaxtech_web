# FinTaxTech website

An Astro + TypeScript website that builds into ordinary HTML, CSS, JavaScript, images and fonts. GitHub Pages serves those files. There is no application server, enquiry database, upload endpoint or payment system.

For a mobile developer: an Astro component is similar to a reusable view. A layout is the shared screen frame. TypeScript content files are the equivalent of your strings/resources. The build creates one HTML file for each page; the browser only runs JavaScript for interactive features.

## Run it on your computer

Install Node.js 22.12 or newer (Node 24 LTS recommended) and pnpm 11.19.0. From this repository:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by the command, usually `http://localhost:4321`. Changes to source files appear automatically. Stop the server with Control+C.

```sh
pnpm check          # Astro and TypeScript diagnostics
pnpm test           # Business rules, validation and questionnaire branching
pnpm build          # Generate the publishable dist folder
pnpm preview        # Open the actual built website locally
pnpm verify         # Check, unit tests, build and output-integrity check
```

To run browser checks:

```sh
pnpm exec playwright install chromium firefox webkit
pnpm test:browser
```

On Linux CI use `pnpm exec playwright install --with-deps chromium firefox webkit`. Browser tests build and serve the actual static output on port 4323, then exercise all services, PDF downloads, conditional editing, the separate branding tab, consent, accessibility, themes and small screens. WebKit emulates the Safari engine; it is not a substitute for physical iPhone testing. Safari may use Option+Tab for full keyboard navigation, depending on the user's keyboard settings.

## Find things quickly

| Location                       | Purpose                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `src/pages/`                   | Routes. `about/`, for example, is generated from the shared information-page route. |
| `src/layouts/SiteLayout.astro` | One HTML document frame, metadata, shared header/footer/consent.                    |
| `src/components/`              | Reusable header, footer, logo, service cards, consent and questionnaire shell.      |
| `src/content/site.ts`          | Company details, navigation, homepage, shared interface and consent wording.        |
| `src/content/services.ts`      | Four service descriptions, capabilities, ownership and exclusions.                  |
| `src/content/pages.ts`         | About, process, pricing, contact, Selected Work and legal page content.             |
| `src/content/questions.ts`     | Both stages of all four approved questionnaires.                                    |
| `src/content/questionnaire.ts` | Form controls, errors, contact labels, PDF wording and extra conditional questions. |
| `src/content/promo.ts`         | Manual promotion status and campaign wording.                                       |
| `src/styles/tokens.css`        | Light/dark colours, typefaces, type sizes, spacing and dimensions.                  |
| `postcss.config.cjs`           | Named mobile/tablet/desktop breakpoints used by the CSS.                            |
| `src/styles/site.css`          | Layout and reusable visual styles, using the tokens.                                |
| `src/design/`                  | Shared logo path and PDF design tokens.                                             |
| `src/lib/rules.ts`             | Visibility, branching, routing, campaign gating and summary selection.              |
| `src/lib/validation.ts`        | Required answers, limits, exclusive choices and contact validation.                 |
| `src/lib/pdf.ts`               | A4 PDF layout and browser-side generation, loaded on demand.                        |
| `src/lib/storage.ts`           | Only theme, consent and one-use campaign intent. No answers.                        |
| `src/lib/analytics.ts`         | Consent gate and an allowlist of payload-free event calls.                          |
| `src/lib/sharing.ts`           | Download, mailto, WhatsApp and device-share handoffs.                               |
| `src/scripts/`                 | Browser interaction and questionnaire screen composition.                           |
| `public/`                      | Files copied unchanged to the build, including CNAME, icons and app policies.       |
| `legacy-site/`                 | Previous website, kept for reference and excluded from the build.                   |
| `docs/`                        | Implementation decisions, validation results and visual comparison captures.        |

`dist/` is generated output. Do not edit it to change website content; the next build overwrites it.

## Change words or add a page

Edit the corresponding TypeScript content file, keeping the quotes and commas. Components render those values; do not add business copy directly to a component. Questions use stable IDs so business rules and tests can refer to them. Change a question's wording freely, but review its rules and tests before changing its ID or option values.

An information page is an entry in `src/content/pages.ts` with a title, introduction and sections. The shared page route renders it, and the sitemap includes it automatically. Legal entries appear in the legal footer. Service pages follow one shared template. Add a main navigation link separately in `site.ts` when appropriate.

The homepage and `/start` render the same `ServiceSelector.astro`, `ServiceCards.astro`, `ServiceCard.astro`, and `ServiceHelp.astro`. The `mode` property changes navigation behaviour only. Keep card markup in those components; the questionnaire controller enhances their links instead of rebuilding cards. See `docs/service-selector-refactor.md` for the visual regression checks.

Stage 1 is the default enquiry. Stage 2 is linked from each service page for customers ready to provide a detailed brief. A no-assets website answer offers a separate short branding questionnaire in a new tab. The original page retains its answers; the branding PDF stays separate.

## Change colours, type or spacing

Edit the custom properties in `src/styles/tokens.css`. The `:root` block is light mode and `[data-theme=dark]` supplies dark values. Both use the BRD palette. `--space-*` values are the spacing scale, and `--h1`, `--h2`, `--lead` and font tokens control type. Fonts are installed locally with Fontsource; visitors do not contact Google Fonts.

Responsive thresholds live in `postcss.config.cjs`. CSS uses names such as `@media (--tablet)`, which the build turns into real browser media queries. PDF dimensions and its fixed light colours are in `src/design/pdf-tokens.ts`.

The F/π vector path lives in `src/design/brand.ts`. After editing it run `pnpm assets` to regenerate the favicon, print mark and social-sharing image. Generated brand assets are committed so a normal build does not need to regenerate them. Customer-facing brand wording comes from `site.ts`.

## Answers, PDF files and privacy

Answers and generated PDF blobs stay in this page's memory. Refreshing or closing clears answers; a browser warning protects unfinished work where supported. “Save PDF for later” downloads an unfinished summary. It does not create a resumable account or store an enquiry. Downloaded files remain on the user's device until they delete them.

The PDF package, font and print logo load only when PDF creation is requested. The PDF is always light A4, includes visible answers only and never includes a standard price or reference number. The font supports many scripts but not every Unicode character; unsupported characters cause an explicit failure rather than a silently corrupted PDF. The readable HTML review remains available. Generated PDFs are not fully tagged accessible PDFs; the accessibility page explains the alternative.

Password protection is deliberately unavailable. The installed jsPDF encryption implementation uses legacy 40-bit RC4. A disabled, unchecked option explains that downloads are unprotected. Do not enable it merely because a library exposes a `password` setting. A future implementation must demonstrate modern encryption, reject wrong passwords, open with the correct password in real readers, and keep passwords out of persistent state, analytics and the PDF text.

Email and WhatsApp links prepare generic messages with the approved contact details. The visitor attaches the PDF themselves. Device file sharing appears only if supported. The site never claims a message was sent.

## Analytics and consent

Without a measurement ID, no Analytics script loads even after acceptance. To enable it after approval, copy `.env.example` to `.env`, supply `PUBLIC_GA_MEASUREMENT_ID=G-…`, then rebuild. This ID is public configuration, not a secret.

Before enabling the property, disable Enhanced Measurement, Google signals and advertising features in Google Analytics so only the approved manual events are collected. Check provider disclosures and cookie wording against the actual configuration. Basic Consent Mode loads nothing before acceptance. Reject and Manage are always available; consent can be changed from the footer.

`track()` accepts only a named event and no payload. Do not extend it to receive form answers, names, contact details, filenames, prices or PDF contents. Page queries and referring URLs are excluded from our event calls. Review reporting weekly in the first month and monthly thereafter. An email-click event cannot prove that an enquiry was sent.

## Campaign changes

`src/content/promo.ts` contains one manually controlled status: `available`, `final-place` or `closed`. It defaults to `closed` because no current availability was supplied. Change it only after verifying campaign approval and accepted payments, then rebuild and publish.

The active page's action sets a one-use local campaign flag and opens the ordinary website questionnaire without a campaign URL parameter. Company fields and eligibility declarations support manual review; no eligibility or reservation is granted automatically. The questionnaire contains no price. Only its campaign PDF includes the offer. A closed build rejects stale campaign intent and prevents new campaign PDFs. Already-open older builds and already-downloaded PDFs cannot be retroactively withdrawn by a static host; the availability disclaimer applies to all of them.

Never add the campaign route to navigation, the footer or sitemap. `noindex` is present and robots.txt allows crawling so a search engine can read it. This route is unlisted, not private or access-controlled.

## GitHub Pages: preserve the current setup

The existing root `CNAME` still contains `fintaxtech.co.uk`. `public/CNAME` is an identical copy and the build puts it at `dist/CNAME`. Keep those values aligned. The original invoice and Reprocket policy URLs are preserved. No DNS, Pages source branch, remote settings or production deployment was changed during implementation.

The repository had no tracked deployment workflow. The new `check.yml` only checks and builds; it uploads `github-pages-static-site` as a downloadable artifact on pull requests or a manual run. It cannot deploy. This avoids silently changing the existing branch-based Pages setup.

To publish when ready:

1. Run `pnpm verify` and `pnpm test:browser`. Resolve the launch content items in `docs/implementation-plan.md`.
2. Inspect **GitHub → repository Settings → Pages** and record the existing source branch/folder, custom domain and HTTPS settings. These remote settings cannot be inferred from CNAME alone.
3. Keep that source selection. In a separate checkout of the existing publication branch, place the **contents** of `dist/` in the currently configured Pages folder. Include `.nojekyll`, `CNAME`, the 404, `_astro` assets and preserved app-policy folders. Do not publish `src/`, `node_modules/` or `legacy-site/`.
4. Review and commit the publication changes, then push that publication branch when authorised. If the source and publication branch are currently the same, decide explicitly how to keep Astro source outside the published folder before publishing; do not overwrite this working tree with generated files.
5. Check `https://fintaxtech.co.uk/`, its 404, both themes, a PDF download, contact links, sitemap, app-policy URLs and the campaign's noindex. Confirm **Enforce HTTPS** is enabled and the custom-domain certificate is valid. Submit the sitemap in the existing Search Console account if one is available.

If you later choose GitHub Actions as the Pages source, use Astro's [official GitHub Pages instructions](https://docs.astro.build/en/guides/deploy/github/). That is an explicit hosting-settings change, not part of this implementation. GitHub Pages needs the built files; it does not run Astro itself.

## Roll back

The original commit is protected by the local annotated tag `legacy-before-astro-2026-09-07`. Existing tags remain untouched. To inspect it without resetting current work:

```sh
git worktree add ../fintaxtech-legacy legacy-before-astro-2026-09-07
```

Publish that checkout's original files through the same existing Pages path if rollback is needed. Push the tag to the remote when you choose to retain the release backup there; nothing was pushed automatically.

## Content before public launch

The implementation is testable locally. Professionally approved legal text and AI-provider disclosures, confirmed campaign availability, fuller approved case-study evidence, and an optional Analytics ID remain owner-supplied inputs. The site makes no unverified work or legal-compliance claims. See `docs/implementation-plan.md` for the exact decisions and `docs/validation.md` for checks and limits.

Proprietary to Fintaxtech Ltd. Font licences are included with their packages and `public/fonts/LICENSE-DejaVu.txt`.
