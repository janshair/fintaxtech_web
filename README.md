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

| Location                       | Purpose                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `src/pages/`                   | Routes. `about/`, for example, is generated from the shared information-page route.   |
| `src/layouts/SiteLayout.astro` | One HTML document frame, metadata, shared header/footer/consent.                      |
| `src/components/`              | Reusable header, footer, logo, service cards, consent and questionnaire shell.        |
| `src/content/site.ts`          | Company details, navigation, homepage, shared interface and consent wording.          |
| `src/content/services.ts`      | Four service descriptions, capabilities, ownership and exclusions.                    |
| `src/content/pages.ts`         | About, process, pricing, contact, Selected Work and legal page content.               |
| `src/content/questions.ts`     | Both stages of all four approved questionnaires.                                      |
| `src/content/questionnaire.ts` | Form controls, errors, contact labels, PDF wording and extra conditional questions.   |
| `src/content/promo.ts`         | Manual promotion status and campaign wording.                                         |
| `src/styles/tokens.css`        | Light/dark colours, typefaces, type sizes, spacing and dimensions.                    |
| `postcss.config.cjs`           | Named mobile/tablet/desktop breakpoints used by the CSS.                              |
| `src/styles/site.css`          | Layout and reusable visual styles, using the tokens.                                  |
| `src/design/`                  | Shared logo path and PDF design tokens.                                               |
| `src/lib/rules.ts`             | Visibility, branching, routing, campaign gating and summary selection.                |
| `src/lib/validation.ts`        | Required answers, limits, exclusive choices and contact validation.                   |
| `src/lib/pdf.ts`               | A4 PDF layout and browser-side generation, loaded on demand.                          |
| `src/lib/storage.ts`           | Only theme, consent and one-use campaign intent. No answers.                          |
| `src/lib/analytics.ts`         | Consent gate and an allowlist of payload-free event calls.                            |
| `src/lib/sharing.ts`           | Download, mailto, WhatsApp and device-share handoffs.                                 |
| `src/scripts/`                 | Browser interaction and questionnaire screen composition.                             |
| `public/`                      | Files copied unchanged to the build, including CNAME, the social image and PDF fonts. |
| `legacy-site/`                 | Optional local archive, ignored by Git and excluded from the build.                   |
| `docs/`                        | Implementation decisions, validation results and visual comparison captures.          |

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

## Post-payment logo brief

The unlisted `/client/logo-brief/` page is for clients whose advance payment you have confirmed manually. Send its link yourself after payment. It is not access-controlled: anyone with the URL can open it. It has a self-referencing canonical and `noindex,nofollow`, and is excluded from navigation, the sitemap, Blog and RSS. The public `/start/` enquiry remains separate.

Edit logo questions and specific wording in `src/content/logo-brief.ts`; shared controls and messages live in `src/content/client-brief.ts`. `LogoBriefShell.astro` uses the same `ClientBriefShell.astro` as the website brief, inside the existing site layout. Shared branching, validation and PDF layout live in `src/lib/client-brief/`; local image processing remains in `src/lib/logo-brief/images.ts`. Both briefs use `src/scripts/client-brief.ts` and `src/styles/client-brief.css`, with the existing theme tokens. The 13 supplied illustrations live in `public/images/logo-brief/`.

Answers, image previews and resized image copies stay in page memory. Nothing is uploaded, and analytics is disabled on this route even with existing consent. Up to five PNG/JPEG/WebP files of 5 MB each are accepted; copies are reduced to a maximum 1,600-pixel side and embedded in the PDF. Very large decoded images are rejected. Downloaded files remain on the visitor's device. Refreshing or closing clears the form; the browser's leave warning is best-effort, particularly on mobile. A page restored from browser history starts empty.

The PDF generator loads only when Download PDF is selected, reuses the bundled Unicode font and colours, and does not retain the generated PDF in journey state. Password protection is deliberately absent because the current library does not provide verified modern encryption. Unsupported characters, including some emoji, produce a clear error instead of corrupt PDF text. Customers download the PDF and attach it manually in email or WhatsApp; the links do not send answers or attach a file automatically.

For a quick manual check: open the route at desktop and phone widths; use Tab/Space and Back/Next; select and deselect Other; choose five personality traits; toggle No preference; add, replace and remove an image; review the brief and download its PDF. Check captions and page breaks, then reload and confirm the form is empty. Automated coverage is in `tests/logo-brief.test.ts` and `tests/browser/logo-brief.spec.ts`; run `pnpm verify` and `pnpm exec playwright test tests/browser/logo-brief.spec.ts`.

## Post-payment website production brief

Send `/client/website-brief/` manually after confirming advance payment. Like the logo brief, it is unlisted with `noindex,nofollow`, a self-referencing canonical, and no sitemap, RSS or public navigation entry. It is not secure access control. The public `/start/` form is unchanged.

Website questions and page-specific wording live in `src/content/website-brief.ts`. The shared definition registry is `src/lib/client-brief/definitions.ts`; adding this brief did not create another form renderer or PDF layout. The redesign-only section is skipped for new websites, and deselected conditional answers are excluded from review/PDF. Other requires a short detail; None is exclusive; goals are limited to two. Users can choose listed pages and add up to ten additional pages. Added names are required and unique after normalising case, surrounding/repeated spaces and equivalent Unicode characters; standard page names must use the existing checkboxes. Purposes are optional. All requested pages appear in review and PDF.

The no-assets option opens the logo brief in a new tab, preserving this website brief. It does not add branding to scope. Accounts, online payments and complex booking are flagged for manual scope review. Domain and email costs remain the customer's responsibility. The PDF explicitly says answers do not automatically change the agreed scope or price. No payment check, uploads or backend are involved. All `/client/` routes are excluded from analytics, even after consent.

Manual check: try both project types, add duplicate and unique pages, reach the ten-page limit, then remove a page. Check Other and None, independent domain/email providers, the separate branding tab, and deadline visibility. Review and download the PDF in light/dark mode at phone width; edit the project back to New website and confirm old redesign details disappear. Refresh should clear answers. Run `pnpm verify` and `pnpm exec playwright test tests/browser/website-brief.spec.ts tests/browser/logo-brief.spec.ts`. PDFs remain unencrypted, and downloads must be attached manually by the customer; the same font and browser-leave-warning limitations as the logo brief apply.

## Analytics and consent

Without a measurement ID, no Analytics script loads even after acceptance. To enable it after approval, copy `.env.example` to `.env`, supply `PUBLIC_GA_MEASUREMENT_ID=G-…`, then rebuild. This ID is public configuration, not a secret.

Before enabling the property, disable Enhanced Measurement, Google signals and advertising features in Google Analytics so only the approved manual events are collected. Check provider disclosures and cookie wording against the actual configuration. Basic Consent Mode loads nothing before acceptance. Reject and Manage are always available; consent can be changed from the footer.

`track()` accepts only a named event and no payload. Do not extend it to receive form answers, names, contact details, filenames, prices or PDF contents. Page queries and referring URLs are excluded from our event calls. Review reporting weekly in the first month and monthly thereafter. An email-click event cannot prove that an enquiry was sent.

## Campaign changes

`src/content/promo.ts` contains one manually controlled status: `available`, `final-place` or `closed`. It defaults to `closed` because no current availability was supplied. Change it only after verifying campaign approval and accepted payments, then rebuild and publish.

The active page's action sets a one-use local campaign flag and opens the ordinary website questionnaire without a campaign URL parameter. Company fields and eligibility declarations support manual review; no eligibility or reservation is granted automatically. The questionnaire contains no price. Only its campaign PDF includes the offer. A closed build rejects stale campaign intent and prevents new campaign PDFs. Already-open older builds and already-downloaded PDFs cannot be retroactively withdrawn by a static host; the availability disclaimer applies to all of them.

Never add the campaign route to navigation, the footer or sitemap. `noindex` is present and robots.txt allows crawling so a search engine can read it. This route is unlisted, not private or access-controlled.

## GitHub Pages: preserve the current setup

The existing root `CNAME` still contains `fintaxtech.co.uk`. `public/CNAME` is an identical copy and the build puts it at `dist/CNAME`. Keep those values aligned. The original invoice and Metoni policy URLs are preserved. No DNS, Pages source branch, remote settings or production deployment was changed during implementation.

The existing `.github/workflows/deploy.yml` builds and deploys GitHub Pages on a push to `main` or a manual run. `.github/workflows/check.yml` runs validation. This SEO update does not change either workflow or the custom domain.

When an authorised release is ready, run `pnpm verify` and `pnpm test:browser`, review the changes, and use the existing release process. A push to `main` triggers deployment, so do not push merely to preview a change. Afterwards, check the production homepage, questionnaire/PDF download, Contact links, sitemap, app-policy URLs and `/promo/` noindex. Keep HTTPS and the existing Pages configuration enabled.

## Roll back

The original commit is protected by the local annotated tag `legacy-before-astro-2026-09-07`. Existing tags remain untouched. To inspect it without resetting current work:

```sh
git worktree add ../fintaxtech-legacy legacy-before-astro-2026-09-07
```

Publish that checkout's original files through the same existing Pages path if rollback is needed. Push the tag to the remote when you choose to retain the release backup there; nothing was pushed automatically.

## Content before public launch

The implementation is testable locally. Professionally approved legal text and AI-provider disclosures, confirmed campaign availability, fuller approved case-study evidence, and an optional Analytics ID remain owner-supplied inputs. The site makes no unverified work or legal-compliance claims. See `docs/implementation-plan.md` for the exact decisions and `docs/validation.md` for checks and limits.

Proprietary to Fintaxtech Ltd. Font licences are included with their packages and `public/fonts/LICENSE-DejaVu.txt`.

## SEO and social profiles

Edit page search titles and descriptions in `src/content/seo.ts`. Most information-page entries start with their title and introduction from `pages.ts`; focused overrides live in `seo.ts`. Service metadata uses `services.ts`. Keep a distinct description for each public page. The sitemap reads the same registry; utility entries marked `noindex` are excluded. A new public route needs an entry here, and `pnpm verify` catches omissions, duplicate metadata and broken links in the actual built HTML.

Edit social names and URLs in `src/content/social.ts`. The shared `SocialLinks.astro` component appears in the footer and Contact page, and the same URLs populate the Organisation’s `sameAs` data. The shared layout provides canonical URLs, sharing tags and structured data. `src/lib/seo.ts` describes the relationships between the company, website, pages, services and breadcrumbs. The existing 1200×630 `public/social.png` is the default sharing image. Theme metadata and the adaptive favicon read the central colour tokens.

The three app-policy pages now use the shared layout. Their policy wording lives in `src/content/app-policies.ts`; the root `invoice/` and `Metoni/` HTML files are retained as historical references. A small build integration preserves the exact `.html` public URLs. Output checks compare policy text against those references so a wording change must be deliberate.

`pnpm check:seo` checks a production build. `pnpm audit:lighthouse https://fintaxtech.co.uk live` runs desktop and mobile SEO checks and writes local diagnostic reports under the ignored `docs/seo-audit/` folder. Run it against a local production preview to check unreleased changes. Scores do not prove indexation or search rankings. The optional local `SEO-AUDIT.md` report and `audit/` snapshots are ignored by Git.

After an authorised deployment, select the verified `fintaxtech.co.uk` property in Google Search Console, open **Indexing → Sitemaps**, enter `https://fintaxtech.co.uk/sitemap.xml` (or just `sitemap.xml` if the prefix is displayed), and click **Submit**. Confirm **Success**. The public `/start/` sales page is indexable. Keep `/enquiry/` (including all questionnaire query URLs) and `/promo/` out of indexing requests.

## Keeping the repository light

Git ignores generated output, dependencies, local audit reports, the retired website archive and Markdown other than blog source files under `src/content/blog/`, `README.md`, `AGENTS.md` and `SKILL.md`. Ignored files can remain on your computer without entering future commits. Source code, tests, the dependency lockfile, deployment configuration, asset/font licences and the root app-policy reference files remain tracked because development or validation needs them. The previous website remains available in Git history; ignoring it does not erase that history or reduce its existing size.

The `/start/` sales page renders its explanation and four choices as static HTML. Its links open the separate, noindex `/enquiry/` questionnaire. Review and PDF screens exist only in browser memory there. Old `/start/?service=…` bookmarks redirect in the browser to the appropriate enquiry; the static sales-page canonical consolidates query aliases onto `/start/`. GitHub Pages cannot send different robots headers for different query strings.

## Adding a blog article

Create a Markdown file in `src/content/blog/`, for example `planning-your-app.md`. Markdown is plain text: `##` starts a section, a blank line starts a paragraph, and `[link text](/services/mobile-apps/)` creates a link. Start with this metadata between the two `---` lines:

```yaml
---
title: Planning your business app
description: Questions to help your business define the users, features and ongoing support its next app will need.
pubDate: 2026-09-09
author: FinTaxTech
category: Mobile App Development
tags: [App planning, Android, iOS]
draft: true
cta: mobile-apps
---
```

Write the article below it, starting with `##` headings. The layout supplies the only H1 from `title`. Use descriptive link text and standard Markdown tables; tables automatically become keyboard-scrollable on small screens. The category links back to a service when it exactly matches a service name in `src/content/services.ts`.

For a shorter search and social-sharing title, add an optional `seoTitle` without the `| FinTaxTech` suffix (the shared layout adds that). The full `title` still supplies the article heading, card title and breadcrumbs. Company authors such as `FinTaxTech` or `FinTaxTech Ltd.` use the site's Organisation structured data.

The filename becomes `/blog/planning-your-app/`. Optionally add `slug: a-different-address` to override it; use lowercase words separated by hyphens. Published slugs must be unique. Add `updatedDate: 2026-09-10` after a substantive update; it cannot precede publication. Dates are displayed consistently in UK English. `cta: mobile-apps` selects the existing mobile questionnaire; omit it or use `cta: general` for the shared project CTA.

Images are optional. If you have a real image, put it in `src/assets/blog/` and add `featuredImage: ../../assets/blog/your-image.png` and an accurate `imageAlt: ...` to the metadata. Supply both fields or neither. Astro creates optimised WebP assets for cards, the article and social sharing. Body images can use ordinary Markdown with a relative path and useful alt text. Without a featured image, sharing uses the existing FinTaxTech brand image. The first article's supplied illustrations are stored as compressed WebP files in its own folder under `src/assets/blog/`.

Run `pnpm dev` to preview and change `draft` to `false` when ready to include the post. Drafts are excluded from article routes, Blog, Latest Articles, RSS and the sitemap, including during local preview. A publication date is descriptive, not a scheduling switch: `draft: false` publishes in the next build even if the date is in the future. Never put confidential content in this public repository, including draft files.

Before releasing, run `pnpm verify` and `pnpm test:browser`. Check `/blog/` and your article in light and dark modes. The collection automatically updates the list (newest first), homepage's latest three, `/rss.xml`, and `/sitemap.xml`; there is no per-article page file or SEO registry entry to edit. Publishing still follows the existing authorised GitHub Pages release process.

Blog interface wording lives in `src/content/blog.ts`, the validated collection in `src/content.config.ts`, publishing rules in `src/lib/blog-posts.ts`, reusable components in `src/components/blog/`, and the article layout in `src/layouts/ArticleLayout.astro`. Article typography and table styling live in `src/styles/blog.css` and reuse the existing design tokens. The shared site layout provides social metadata and structured data without adding a browser runtime to the blog.

### Mobile app production brief

Send `/client/mobile-app-brief/` manually after confirming advance payment. It uses the shared client-brief shell, navigation, theme tokens, review screen and locally generated PDF. It has `noindex,nofollow`, a self-referencing canonical and no public navigation, sitemap or RSS entry. Anyone with its URL can open it: there is no access control or payment verification. The public `/start/` enquiry is unchanged.

Edit questions and wording in `src/content/mobile-app-brief.ts`. Its definition is registered in `src/lib/client-brief/definitions.ts`. Shared rules support conditional fields, dynamically selected first-release priorities and repeatable rows. Phone platforms are a single choice, with tablet support asked separately when a platform is known. Tasks are limited to three and success measures to two. Each Other choice requires detail; Other features use up to ten rows with a unique name, purpose and release priority. Feature names cannot duplicate listed standard features, including differences only in case, whitespace or equivalent Unicode characters. Connected systems have repeatable required name/purpose fields. Changing controlling answers removes hidden data from review and PDF.

Answers remain in page memory, clear on refresh/navigation and never enter analytics, browser storage or a server. This brief has no file picker: File upload is a requested app capability, not a request to upload client documents. None is exclusive for assets and information categories. The no-assets link opens the existing logo brief in another tab without adding branding to scope. Developer accounts should belong to the client. Sensitive data categories and other requirements are flagged for manual scope/privacy review; users should never enter actual customer records or credentials. The PDF says the brief does not alter the written proposal or guarantee app-store approval.

Customers download the PDF and attach it manually to their own email or WhatsApp message. Nothing sends automatically. Password protection is not offered because the shared PDF generator does not implement verified encryption; PDFs are unencrypted. The existing font-support and browser-leave-warning limitations also apply.

Run `pnpm verify` and `pnpm exec playwright test tests/browser/mobile-app-brief.spec.ts tests/browser/website-brief.spec.ts tests/browser/logo-brief.spec.ts` when changing shared brief logic. For a manual check, complete both project types, test Other, None, feature duplicates and ten-row limit, remove/edit custom features and systems, change standard features to check priorities update, and download a PDF from review. Test both themes on a phone, keyboard navigation, and refresh clearing the answers. Automated browser checks also confirm no answer-bearing requests or storage and no analytics on the route.
