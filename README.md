# FinTaxTech website

An Astro + TypeScript website that builds into ordinary HTML, CSS, JavaScript, images and fonts. GitHub Pages serves those files. Website demo/production brief delivery additionally requires the separate Node service and same-origin proxy described below. There is no enquiry database, upload endpoint or payment system.

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

Website questions and page-specific wording live in `src/content/website-brief.ts`. The shared definition registry is `src/lib/client-brief/definitions.ts`; shared identity, approval and website-direction fields live in `src/content/client-brief-fields.ts`. The redesign-only section is skipped for new websites, and deselected conditional answers are excluded from review/PDF. Other requires a short detail; None is exclusive. The primary goal is one choice, with up to two optional secondary goals. Users confirm launch pages, add up to ten additional launch pages, and list later pages separately. Added names are required and unique after normalising case, surrounding/repeated spaces and equivalent Unicode characters; standard page names must use the existing checkboxes. Purposes are optional. All applicable answers appear in review and PDF.

New production questions are optional: business-name confirmation, priority services/products, differentiators, up to three reference URL/explanation pairs, design preferences, source-material descriptions, asset permission, later features, content updates and launch/approval confirmation. Conditional details distinguish a catalogue from checkout/payments and a third-party booking integration from custom booking. Language requirements and existing URLs/redirect instructions appear only when applicable. Domain names, domain providers, email providers and business email addresses are separate fields; hosting/DNS responsibility is recorded without credentials. Clients approve business facts and claims, and selected pages/features do not expand the agreed scope.

The no-assets option opens the logo brief in a new tab, preserving this website brief. It does not add branding to scope. Accounts, online payments and complex booking are flagged for manual scope review. Domain and email costs remain the customer's responsibility. The PDF explicitly says answers do not automatically change the agreed scope or price. Payment and approval are not verified by submission; additional work and deployment still require agreement/authorization. All `/client/` routes are excluded from analytics, even after consent.

Manual check: try both project types, add duplicate and unique pages, reach the ten-page limit, then remove a page. Check primary/secondary goals, Other and None, reference URLs and explanations, conditional payment/booking/language details, independent domain/email fields, the separate branding tab, and deadline visibility. Review and download the PDF in light/dark mode at phone width; edit the project back to New website and confirm old redesign details disappear. Refresh should clear answers. Run `pnpm verify` and `pnpm exec playwright test tests/browser/website-brief.spec.ts tests/browser/website-demo-brief.spec.ts tests/browser/logo-brief.spec.ts`. PDFs remain unencrypted, and downloads must be attached manually by the customer; the same font and browser-leave-warning limitations as the logo brief apply.

## Free website demo brief

Send `/client/website-demo-brief/` for the separate free demo stage. Its five sections cover business identity/service area, customers and website focus, one to three reference URLs with specific explanations, homepage content/assets, and demo approval/success criteria. Assets are described and shared manually; provisional styling and placeholder-image permission are recorded separately from production scope. The optional deadline is a review preference that must be confirmed manually.

Towns/regions and optional postcode lists use separate 2,000-character fields. The former service-area control had a 240-character HTML `maxlength`, which could cut off a paste before validation. Shared brief text controls now retain the entire input, display character counts/limits and reject over-limit answers before continuing; validation, review, PDF and Slack do not silently shorten them. Accepted coverage lists retain their internal text and line breaks, with the same surrounding-whitespace trimming used by all three outputs.

Primary customers and customer need are separate. Clients must list one to three services/products or explicitly ask for help choosing from an existing website, which requires its URL. The form does not fetch the website; service suggestions remain provisional until approved. A booking goal or Book action asks for the intended demo behaviour, and an existing-service link requires a URL. Reference explanations mentioning price, prices or pricing reveal a per-reference pricing preference; another reason requires a short explanation. Pricing direction is explicit: approved client prices, Request a quote, or labelled provisional content. Competitor prices are not adopted. Available assets and provisional styling/imagery permission are separate choices; Please ask me first grants no such permission. Design preferences, differentiators, homepage sections, source facts, asset descriptions and review deadline remain optional.

Demo Slack messages group approver name/email, omit empty optional fields, and finish with Needs clarification and Provisional choices permitted. Only explicitly selected provisional choices are listed. Missing facts, unresolved asset choices and service/price material awaiting approval are summarized once; the free demo does not imply an agreed proposal. The production brief keeps its agreed-scope notes. Conditional row details are excluded consistently from validation, review, PDF and Slack when hidden.

Edit `src/content/website-demo-brief.ts`; it uses the same form, validation, review and PDF exporter as the production brief. Reference rows require valid HTTP(S) URLs and explanations, and the shared row renderer supports URL and longer-text inputs. Approval and public business email fields reuse email validation. The demo establishes design direction and does not include a full production website, live transactions or deployment unless separately agreed. After demo approval, scope and payment are agreed before production; deployment requires authorization.

Like the other client briefs, this route is unlisted, `noindex,nofollow`, excluded from analytics and has no access gate. Draft answers remain in page memory; refreshing, closing or returning from the browser history cache clears them. After review, existing final actions send the reviewed text through the server to Slack. Clients can still download `FinTaxTech-free-website-demo-brief.pdf` and attach it manually. No uploads or save-and-resume have been added. Coverage lives in `tests/website-demo-brief.test.ts` and `tests/browser/website-demo-brief.spec.ts`.

## Website brief delivery and hosting setup

Only `/client/website-brief/` and `/client/website-demo-brief/` use Slack delivery. The review screen explains that **Download PDF**, **Open email** and **Open WhatsApp** send the reviewed text to FinTaxTech. Entering review, editing, Back, theme changes and other incidental actions do not submit. PDF generation/download runs independently: a Slack failure never prevents the download or clears answers, and a PDF font error never cancels Slack delivery. Slack receives structured plain text, not the PDF file. Email/WhatsApp still open blank messages for manual attachments. Logo, mobile-app and AI Automation production briefs retain their local-only behaviour.

Astro exposes `PUBLIC_` configuration to browser code. The retired `PUBLIC_SLACK_WEBHOOK` environment variable is rejected at build/dev startup, and output checks reject webhook URLs in static bundles. The ignored local `.env` has been migrated without changing its value. The **GitHub secret can retain the name `PUBLIC_SLACK_WEBHOOK`**: the deploy workflow references that existing secret as `SLACK_WEBHOOK`, so no GitHub secret rename or deletion is needed. Only the environment variable name passed to Astro changes. The static build does not embed or use this private value for delivery, and GitHub Pages does not retain it as runtime configuration. Separately configure **`SLACK_WEBHOOK` in the delivery service's runtime secret store**. Rotate the webhook in Slack before deploying: the previous contact/enquiry implementation exposed it to browsers. Those direct browser Slack notifications have been removed; contact/enquiry Web3Forms behaviour is retained. The new secure endpoint handles the two website client briefs only.

GitHub Pages serves static files and cannot execute this endpoint. Keep the static build if desired, but put a capable edge/reverse proxy in front of the same public origin, routing `/api/website-brief/*` to a Node service and other paths to the static site. Alternatively move the frontend to hosting that can route both. A GitHub Pages deployment alone leaves Slack unavailable; the PDF remains usable and the interface reports unavailable online delivery. No production hosting, DNS or proxy configuration is changed by this implementation.

For **local development**, `pnpm dev` now serves the API on the same port as the website (normally `http://localhost:4321`). `pnpm preview` also serves it through the preview launcher. Both load the ignored `.env` on the server and use its `SLACK_WEBHOOK`; an existing process environment value takes precedence. No extra service, proxy or `BRIEF_ORIGIN` is needed locally. Restart the dev/preview process after changing secrets or adding the integration, then reload the page. During development, changes to the brief schema, shared rules or server code now restart the local API along with the page; otherwise Astro page hot reload can leave the API validating an older questionnaire. A restart clears in-memory delivery tickets and may reload open forms, so finish or download drafts before editing questionnaire code. Preview and deployed services still need a restart after rebuilding. Local final review actions send to the configured webhook, so use the test suite's mock when testing. The middleware accepts only loopback website hosts on its actual port. PDF dependencies are prebundled during development to avoid a first-download dependency reload clearing page-memory answers.

Build the server separately using Node 22.12+:

```sh
pnpm build:brief-server
pnpm start:brief-server
```

Supply these runtime settings (see `.env.example`):

- `SLACK_WEBHOOK`: the existing Slack incoming webhook, configured as a secret.
- `BRIEF_ORIGIN`: the exact frontend origin, e.g. `https://fintaxtech.co.uk`, without a path or trailing slash. Requests from other origins are rejected; no cross-origin CORS is enabled.
- `BRIEF_API_HOST` / `BRIEF_API_PORT`: default `127.0.0.1` / `4324`. Keep the service private behind the proxy and expose the API through HTTPS on the frontend origin.
- `BRIEF_TRUSTED_PROXIES`: comma-separated, exact proxy socket IP addresses. Leave empty when connecting directly. A trusted proxy must **overwrite** `X-Forwarded-For` with one verified client IP; forwarded lists or invalid addresses are rejected. Untrusted forwarded headers are ignored. Configure the proxy's body cap at 256 KiB and request timeout above 45 seconds. Disable API request-body logging, and apply the host's rate/WAF controls as well.

The standalone production service uses environment variables supplied by its host; it does not load `.env` automatically. For local manual use of that standalone service, Node supports `node --env-file=.env server-dist/website-brief.mjs`; do not do a real submission during tests. The integrated dev/preview API is for local testing, not a replacement for the production Node service and same-origin proxy.

Run **one long-lived service process**, with no replicas or serverless cold starts. In-memory tickets and delivery acknowledgements last one hour, so concurrent/repeated final actions share one submission ID and retries resume after the last acknowledged part. Changed reviewed answers receive a new ID; returning to already delivered answers in the same page does not resend them. There is no database or browser persistence. The process keeps temporary hashes, opaque tickets, counters and acknowledgements; it retains answer text only while handling a request. Slack stores delivered text according to the workspace's retention/access settings. Clearing the local form does not delete Slack messages.

Input uses the shared questionnaire rules, server-side conditional filtering and strict field/row limits. The endpoint rejects oversized bodies, credentials it recognises, malformed/unrecognised fields and incomplete applicable answers. It uses exact-origin checks, expiring random tickets, a honeypot and bounded per-client/global request, ticket and message limits. Clients should supply only needed business/approval information, never credentials or sensitive records. This is a public endpoint: rate limits reduce abuse but are not authentication. Message text escapes mentions/formatting and disables Slack parsing/unfurls. Long answers are preserved in numbered parts with a common ID/time, without silent truncation.

Transient definite rejections have bounded retries. If a webhook times out after possibly delivering a part, Slack offers no receipt lookup or idempotency key: the service reports **unconfirmed delivery** and does not risk repeating that part. The client can retry an existing action to recover a lost browser response; it cannot force an uncertain Slack part to resend. On process restart or ticket expiry, it reports expired tracking rather than starting another possibly duplicate submission. Use the submission ID to check Slack, or share the PDF manually. Deploying/restarting during an active delivery can lose acknowledgement state, so arrange restarts when no submissions are running.

Run `pnpm verify`, `pnpm build:brief-server` and `pnpm test:browser`. Focused delivery coverage is in `tests/website-submission.test.ts`, `tests/website-server.test.ts` and `tests/browser/website-delivery.spec.ts`. `tests/browser/website-delivery-http.spec.ts` exercises the actual preview HTTP endpoint without intercepting API requests; only the server's outbound Slack transport is mocked. Run that same test against development using `BRIEF_BROWSER_SERVER=dev pnpm exec playwright test tests/browser/website-delivery-http.spec.ts`. Test processes use a dummy webhook and never contact real Slack. Do not send live test messages unless explicitly authorized.

## Analytics and consent

Without a measurement ID, no Analytics script loads even after acceptance. To enable it after approval, copy `.env.example` to `.env`, supply `PUBLIC_GA_MEASUREMENT_ID=G-…`, then rebuild. This ID is public configuration, not a secret.

Before enabling the property, disable Enhanced Measurement, Google signals and advertising features in Google Analytics so only the approved manual events are collected. Check provider disclosures and cookie wording against the actual configuration. Basic Consent Mode loads nothing before acceptance. Reject and Manage are always available; consent can be changed from the footer.

`track()` accepts only a named event and no payload. Do not extend it to receive form answers, names, contact details, filenames, prices or PDF contents. Page queries and referring URLs are excluded from our event calls. Review reporting weekly in the first month and monthly thereafter. An email-click event cannot prove that an enquiry was sent.

## Campaign changes

`src/content/promo.ts` contains one manually controlled status: `available`, `final-place` or `closed`. The owner confirmed on 20 September 2026 that the promotion is ongoing, with no scheduled expiry. The current status is `available`, meaning applications can be reviewed, not that places are verified to remain. The published £999 allocation is still limited to the first five eligible customers accepted. Confirm availability manually before accepting payment; update the price, allocation terms, payment amounts and PDF wording together before publishing any future offer. If an allocation closes or its terms cease to apply, set `closed` and rebuild/publish promptly. There is no automatic expiry or live capacity counter.

The active page's action sets a one-use local campaign flag and opens the ordinary website questionnaire without a campaign URL parameter. Company fields and eligibility declarations support manual review; no eligibility or reservation is granted automatically. The questionnaire contains no price. Only its campaign PDF includes the offer. A closed build rejects stale campaign intent and prevents new campaign PDFs. Already-open older builds and already-downloaded PDFs cannot be retroactively withdrawn by a static host; the availability disclaimer applies to all of them.

The campaign route is now a public, indexable offer page with a self-referencing canonical, a sitemap entry and an internal link from Pricing. This reverses the earlier hidden-promotion policy. Its terms remain readable in the generated HTML even when the current allocation is closed; the closed page clearly stops applications and links to a standard enquiry. Keep robots.txt crawlable. No live availability or appraised customer count is advertised.

## GitHub Pages: preserve the current setup

The existing root `CNAME` still contains `fintaxtech.co.uk`. `public/CNAME` is an identical copy and the build puts it at `dist/CNAME`. Keep those values aligned. The original invoice and Metoni policy URLs are preserved. No DNS, Pages source branch, remote settings or production deployment was changed during implementation.

The existing `.github/workflows/deploy.yml` builds and deploys GitHub Pages on a push to `main` or a manual run. `.github/workflows/check.yml` runs validation. This SEO update does not change either workflow or the custom domain.

When an authorised release is ready, run `pnpm verify` and `pnpm test:browser`, review the changes, and use the existing release process. A push to `main` triggers deployment, so do not push merely to preview a change. Afterwards, check the production homepage, questionnaire/PDF download, Contact links, sitemap, app-policy URLs and `/promo/` indexability and current offer status. Keep HTTPS and the existing Pages configuration enabled.

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

After an authorised deployment, select the verified `fintaxtech.co.uk` property in Google Search Console, open **Indexing → Sitemaps**, enter `https://fintaxtech.co.uk/sitemap.xml` (or just `sitemap.xml` if the prefix is displayed), and click **Submit**. Confirm **Success**. The public `/start/` sales page is indexable. Request indexing for the canonical `/promo/` offer page as well. Keep `/enquiry/` (including all questionnaire query URLs) and `/client/` production briefs out of indexing requests. Those utility routes deliberately remain noindex.

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

### Indexing investigation (20 September 2026)

Direct HTTP checks of the deployed `/start/`, Blog and all 14 published articles found 200 responses, self-referencing HTTPS canonical URLs, crawlable HTML content, no robots/header indexing blocks and canonical sitemap entries. All articles were linked from the static Blog listing; the Start page and Blog have shared navigation links. HTTP, www and slashless Start variants resolve to the canonical origin/path. `/start/index.html` is a duplicate with the correct canonical, not another landing page. No speculative copy or schema changes were made to those pages. The four supplied social profiles already match both the footer and Organization `sameAs`; the existing genuine GitHub profile is retained.

This cannot determine Google’s current exclusion reason. For `/start/` and two or three affected canonical article URLs, collect URL Inspection’s exact indexing reason, last crawl, crawl/fetch/indexing permissions, referring page/sitemap, user-declared canonical and Google-selected canonical. Compare **Test live URL** with the indexed/crawled result; inspect the tested HTML if Google sees different content. Include any manual-action or security warnings. Sitemap inclusion and valid HTML do not guarantee indexing.

The base `/enquiry/` is a JavaScript questionnaire shell, not a distinct search landing page. Indexing it would add little value alongside `/start/` and the service pages. Preserve `noindex,follow`, the query-free `/enquiry/` canonical and sitemap exclusion for all service query variants.

### AI Automation production brief

Send `/client/prompt-brief/` manually after confirming advance payment. The customer-facing title is **AI Automation Production Brief**. Like the other client briefs, it uses the shared shell, conditional validation, review screen and lazy-loaded local PDF generator. It is unlisted, has `noindex,nofollow`, is excluded from analytics and does not appear in the public navigation, sitemap or RSS. An unlisted URL is not access control.

Edit its copy and questions in `src/content/prompt-brief.ts`; registration lives in `src/lib/client-brief/definitions.ts`. All Other choices require short details, another language requires a language name, and a fixed deadline requires a valid date and reason. Tone allows up to three choices, or FinTaxTech to recommend alone. Source formats are optional when no material is available or formats are unknown. Reviewer and approver identities are agreed separately, so customers need not enter personal details.

No source documents are uploaded or stored. Answers stay in page memory and clear on refresh or leaving. Customers download `FinTaxTech-ai-automation-production-brief.pdf` and manually share it and their sources separately through the agreed channel. The PDF includes permissions/sensitivity notes and the scope disclaimer. The existing PDF is unencrypted; no password-protection control or security claim is added. The public enquiry is unchanged.

Run `pnpm verify` and `pnpm test:browser`. New coverage lives in `tests/prompt-brief.test.ts` and `tests/browser/prompt-brief.spec.ts`, with a reusable sample in `tests/fixtures/prompt-brief.ts`. It covers required conditional details, tone limits, review/editing, local downloads, mobile keyboard access, both themes, reload clearing, and absence of answer-bearing requests or storage.

### AI Automation and compatibility

The fourth service is defined in `src/content/services.ts`, with shared positioning and workflow questions in `src/content/ai-automation.ts`. Its public route is `/services/ai-automation/`. The old `/services/prompt-services/` route is a static, noindex redirect with the new canonical and a clickable fallback. JavaScript uses `location.replace()` and preserves query parameters and fragments. GitHub Pages serves this fallback with HTTP 200; it is not an HTTP 301 redirect. The old route is excluded from the sitemap.

New enquiry links use `service=ai-automation`. Both `/start/` legacy links and `/enquiry/` also accept `service=prompt-services`, normalising it to the current service before rendering. Enquiry URLs remain noindex. Existing content articles retain their original URLs and wording; their category is AI Automation.

The unlinked `/client/prompt-brief/` route remains available, now titled AI Automation Production Brief. Both public enquiry stages and the production brief first ask what should be automated. Content/document projects retain the existing content questions. Other projects collect process, trigger, inputs, steps, systems/access, output, frequency, volume, approvals, exceptions and sensitivity, with extra assistant-knowledge or system-connection details when relevant. Switching project type removes hidden answers from review and PDF. No documents, credentials or actual customer records should be entered. Answers stay local; PDFs are downloaded and shared manually.

### Metoni marketing and support

- Marketing URL: `https://fintaxtech.co.uk/metoni/`
- Support URL: `https://fintaxtech.co.uk/metoni/support/`
- Existing policies remain at `/metoni/privacy.html` and `/metoni/terms.html`.

Edit the product wording, FAQs and store links in `src/content/metoni.ts`. The shared site layout supplies the header, footer, themes, SEO and breadcrumbs. The two pages are registered in `src/content/seo.ts`, so the existing static sitemap includes them automatically. Selected Work links to the marketing page and keeps a secondary Google Play action.

The App Store link is deliberately absent until `metoni.appStoreURL` has a real public URL. Set that field only after the iOS release is available, then rebuild; the download component, support availability copy and application schema use that setting. Do not use a placeholder App Store URL.

`src/assets/metoni/` contains optimised WebP images from the supplied Android Play Store material. `src/content/metoni-media.ts` imports those images and holds their alt text and captions. Astro produces responsive image sizes with explicit dimensions; screenshots are not cropped or stretched. The product social image is also reused on support.

The promotional video is hosted on YouTube. Set `metoniMedia.video.youtubeId` in `src/content/metoni-media.ts` to change it. The page initially loads only a small local WebP poster. Choosing “Load YouTube video” inserts a privacy-enhanced YouTube player; there are no YouTube requests before that choice and no autoplay. A direct YouTube link remains available when JavaScript or embedding is blocked. The player preserves the HTTP referrer required by YouTube. No local MP4 or caption file is shipped; manage video captions in YouTube Studio.

The old 9.79 MiB MP4 was removed from the website assets. This reduces future builds and checkouts, but does not erase the file from past Git commits.

Run `pnpm verify` and `pnpm test:browser`. Metoni tests cover public routes, the portfolio link, policy compatibility, sitemap, application metadata, contact actions, keyboard focus, both themes and narrow screens. The existing app privacy policy describes Firebase analytics and diagnostics; do not change the marketing into a blanket “no data collected” claim without verifying the released app and store declarations.

### Careers and vacancies

Vacancies live in `src/content/jobs/*.md`. The file name becomes the URL: `frontend-developer.md` is published at `/careers/frontend-developer/`. Use lower-case words separated by hyphens. The careers index and footer link use the existing shared layout; shared careers labels live in `src/content/careers.ts`.

Start a new file with this frontmatter, followed by the job description in Markdown:

```yaml
---
title: Front-End Developer
summary: Help build accessible, fast static websites with Astro and TypeScript.
location: Remote or Dundee, Scotland
active: true
publishedDate: 2026-10-07
---
```

`active` is a required Boolean: use `true` or `false` without quotes. Only `active: true` jobs appear in the listing, sitemap and generated detail pages. They are sorted newest first. When a role closes, set `active: false`, rebuild and deploy: its old detail URL then returns the site's 404 page. If all roles are inactive, `/careers/` shows “There are currently no active vacancies”. Publication and closing dates are descriptive; they do not replace the active flag or schedule a deployment.

Optional fields are `department`, `employmentType` and `closingDate`. Employment types use `FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `TEMPORARY`, `INTERN`, `VOLUNTEER`, `PER_DIEM` or `OTHER`; the page displays readable labels. A closing date cannot precede the publication date. Omit unknown details rather than guessing them.

For a known physical location, optional `jobLocation` fields `locality`, `region` and a two-letter `country` code provide structured address data. The first vacancy uses Dundee, Scotland, GB. No remote applicant-country restrictions or fully remote classification are inferred from the display location. Confirm these details before adding more specific remote-job search metadata.

Start Markdown headings at `##`: the layout supplies the only H1, metadata and final plain-text CV email instruction. Do not add an application form or repeat that instruction in each Markdown file. Active detail pages receive JobPosting data from the rendered description; the index does not. The existing SEO output checks validate the generated HTML and schema.

Run `pnpm verify` and `pnpm test:browser`. Unit tests validate the schema and active-job filter. A separate build test copies the site into a temporary directory, tests active/inactive fixtures and the no-vacancies state, then removes the copy. It never changes real vacancies or the normal build output. Job Markdown is explicitly allowed by `.gitignore` so new vacancies can be committed.
