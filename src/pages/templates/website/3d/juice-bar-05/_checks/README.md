# juice-bar-05 labels and all-template theme handover

## Latest sleeve-name follow-up

This follow-up changes only this `juice-bar-05` page folder and its public assets. All prior work outside those folders was preserved byte-for-byte; changes remain uncommitted.

`_runtime/sleeve-layout.ts` now measures the real 900-weight Arial text width. It first reduces a single line from 176 to a readable floor of 128 logical canvas units; if that is insufficient, it fits at most two whole-word lines at the largest suitable size. At the floor, remaining complete words are replaced by an ellipsis. An over-wide unbroken token becomes `…`, rather than being sliced or wrapped mid-word. There is no forced horizontal `fillText` compression. Full names remain in the HTML and URL.

Both sleeves use the same 120° front panel, centred at texture u=0.5/local +Z. Text occupies at most 900/1024 logical pixels, leaving an inset inside that panel. Both final story poses have zero yaw; the juice cup also settles out of its small initial tilt. All measured final label centres coincide with the canvas centre. The name is still redrawn on edits using the shared 2048×512 mipmapped, anisotropic CanvasTexture.

The loose dark-green disc was a decorative leaf, not the lid. That standalone object was removed from the scene and refreshed posters. The actual cream lid still descends onto the juice cup, followed by the straw. No loose decorative object remains beside the finished drink.

| Requested name                                | Final sleeve lines      | Font | Ellipsis |
| --------------------------------------------- | ----------------------- | ---- | -------- |
| Jay's Juice & Co                              | Jay's / Juice & Co      | 174  | No       |
| SeJuice                                       | SeJuice                 | 176  | No       |
| The Highland Morning Juice and Coffee Company | The Highland / Morning… | 128  | Yes      |

Verified at **375×812 and 1440×1000** in **Chromium, Firefox and WebKit**: 36 final-stage scene/name captures passed, with whole-word boundaries, a maximum of two lines, measured text widths within the front panel, correctly centred labels, the lid on and no loose object. Repeated captures of each sleeve had **zero changed pixel channels** (steam remains animated above the cup).

- `pnpm verify`: **248/248 tests**, build, output and SEO checks passed.
- Existing `three-d-templates.spec.ts`: **30/30 passed** across the three engines.
- Updated scene + loader: **140,687 bytes gzip / 250,000 budget**; all WebP assets including masks and preview: **194,852 bytes / 1,500,000 budget**.
- Evidence: `docs/juice-bar-05-sleeve-names/report.json`, `verify.log`, `browser.log`, `budgets.json`, all per-engine final-stage and name-zoom PNGs.
- Comparison PNGs: `names-375.png` and `names-1440.png`; columns are Jay's, SeJuice, Highland, with juice above coffee.
- Reproduce after building and starting the static preview: `node src/pages/templates/website/3d/juice-bar-05/_checks/sleeve-names.mjs`. Use `PREVIEW_ORIGIN` to override the default localhost:4324.

The sections below retain the preceding theme/label handover and its earlier measurements.

Template ID remains globally unique **juice-bar-05**, design **Daybreak Blend**. Nothing was committed or deployed. The unrelated pre-existing `src/.DS_Store` change was preserved. No dependencies were added or changed for this work.

## Change colours

Edit only the two `THEME` values at the start of the relevant content file, save and rebuild. Use opaque six-digit `#RRGGBB` colours. There is no visitor colour control, URL parameter, storage or network service for colours.

| Template      | Content file under `src/content/` | Original brand | Original accent |
| ------------- | --------------------------------- | -------------- | --------------- |
| barber-01     | barber-demo.ts                    | #171916        | #c4a46d         |
| tailoring-02  | tailoring-demo.ts                 | #24372f        | #97472f         |
| automotive-03 | automotive-demo.ts                | #111e26        | #efc36c         |
| cleaning-04   | cleaning-demo.ts                  | #224f42        | #f09473         |
| juice-bar-05  | juice-bar-demo.ts                 | #163f33        | #fa733d         |

Astro calls `src/lib/template-theme.ts` and writes the validated `--brand`/`--accent`, derived tints/shades and foregrounds on the document before first paint. Authored reference palettes live in `src/content/template-palettes.ts`. Their tints/shades are rebased by mixing the new primary colours toward white/black at the original relative brightness. The unchanged theme returns each original colour exactly. Invalid values independently fall back to the relevant original colour with a `[template-theme]` build warning. Validation also prevents CSS injection.

Existing CSS aliases such as `--ink`, `--brass`, `--rust`, `--amber`, `--coral` and `--orange` resolve to the theme. Decorative SVG marks follow the same variables. Physical fruit, botanical leaves, beans, coffee, milk, skin/hair, wood, metal and other material colours remain separate. Both 3D sleeve materials and the CanvasTexture use the validated CSS theme; the branded straw and contact shadow follow it too.

Primary brand/accent surfaces keep their authored foreground when it meets 4.5:1, otherwise use black or white. Theme text derivatives and the custom barber secondary-copy rules keep the supplied blue/red test palette readable. In the original barber design, 18 small-print nodes on the pale services/visit sections already fail AA (approximately 3.17–4.29:1). They were preserved to satisfy the identical-default requirement; the test theme has no contrast violations. All five templates' primary buttons pass AA in both tested themes. Future palette choices still warrant the supplied rendered-page contrast check, especially for secondary copy on mixed surfaces.

Default motion-template captures at 390px were pixel-identical to before this work: zero changed colour channels for all four complete page screenshots. The juice demo intentionally differs through the requested geometry, label, padding and text-sharpness improvements. All original theme values were restored after the tests.

## Cup, label and text fixes

The active code is `_runtime/scene.ts` and `_runtime/controller.ts` beside this file. The older `src/lib/juice-bar/scene.ts` and `src/scripts/juice-bar.ts` are not used by this demo and were left untouched.

- The liquid is rebuilt at its actual height, with both radii following the cup's inner taper and a 0.018 scene-unit clearance. Vertically scaling a fixed tapered cylinder previously made its wide top intersect the narrower lower wall. Both juice and coffee now use the corrected taper; crema follows the actual espresso surface radius.
- Sleeves sit about 0.009 units outside the wall, write opaque depth, use render order 3 and a small polygon offset. The transparent juice wall has depth writing disabled and render order 1, so it depth-tests behind the sleeve. Condensation is kept off the lettering. Front/back sleeve edges meet without overlapping faces.
- Cups, sleeves, rims, liquid and crema use 96 radial segments where applicable. Existing physically based materials, antialiasing and the baked contact shadow remain. Phone DPR is capped at 1.5 below 768px, desktop at 2.
- Shared label artwork is 2048×512, sRGB, mipmapped with linear filtering and maximum hardware anisotropy (16 in these captures). Large 900-weight Arial names redraw on edits and remain text-only, with safe wrapping/fitting of long names. No HTML/SVG interpretation or new font download is involved.
- Every step card has 14px vertical padding, with 18px horizontal padding on desktop and 16px on phones, in every active/inactive state. Highlighting changes colour only.
- Text-bearing stamps/cards no longer rotate or scale. Menu lift uses whole-pixel translations without interpolating a transform; only its shadow eases. Coffee heading and every ancestor have `transform:none` and `will-change:auto` at 1440px. Decorative loyalty glyphs retain their original isolated stamp animation.
- Existing coffee pour camera/stream, visible warm-grey steam, safe personalisation, 620px reversible story timelines, review labels, demo ordering, responsive layouts, fallback handling, SEO and privacy behaviour remain.

## Posters, image sources and optional cut-outs

No strawberry/orange/leaf/bean/ice raster cut-outs were present. The existing procedural objects were retained, including 64 deterministic coffee beans in one InstancedMesh, with geometry crease details. `public/templates/website/3d/juice-bar-05/images/SOURCES.md` records original assets and the complete optional generation brief.

Generate these 13 isolated objects only if realistic cut-outs are wanted later. Each should be 1024×1024 PNG or lossless WebP, transparent background, generous clear margins, studio light from upper left, no lettering or ground shadow; downsize to 256–512px and compress before shipping:

- `strawberry-1..3`: one ripe strawberry with calyx; front three-quarter, side three-quarter, top/calyx view.
- `orange-slice-1..3`: one circular slice; face-on, tilted 25° left, tilted 25° right with rind thickness.
- `leaf-1..2`: one mint leaf; face-on with veins, curled three-quarter view.
- `coffee-bean-1..3`: one roasted bean; crease face-on, crease three-quarter, rounded reverse.
- `ice-1..2`: one clear rounded cube; front three-quarter, rotated 45° three-quarter; translucent edges on true transparency.

Record the final files' generator/source, date and licence in SOURCES.md before adoption. No generated cut-outs or third-party imagery were added here.

The WebP posters and preview were refreshed from the actual renderer. `JuicePoster.astro` supplies selective sleeve/straw and lettering masks: custom themes recolour fallback cups without tinting fruit, beans or ceramics, and apply the automatically readable mark colour. The original theme has no mask overlay. Masks also work with JavaScript or WebGL disabled. The 16 small masks are generated by capture-only render passes; visitors never perform those extra GPU passes. The fallback posters retain a neutral sleeve mark rather than an unrelated business name. Physical background lighting in those raster illustrations remains baked into the posters.

## Verification and evidence

Run from the repository root. Default preview origin is http://localhost:4324; use `PREVIEW_ORIGIN` to override it. The theme-file edit check uses a dev server at http://localhost:4322 by default, overridden by `THEME_ORIGIN`.

```sh
pnpm verify
pnpm preview --host 127.0.0.1 --port 4324
# In another terminal:
node src/pages/templates/website/3d/juice-bar-05/_checks/capture.mjs
pnpm build # copy regenerated posters/masks into dist
node src/pages/templates/website/3d/juice-bar-05/_checks/labels.mjs
JUICE_REPORT_DIR=docs/juice-bar-05-labels/runtime node src/pages/templates/website/3d/juice-bar-05/_checks/verify.mjs
# Separately, with the dev server running; do not build concurrently:
node scripts/check-template-themes.mjs
```

The theme check edits the actual content files to brand `#1E3A8A`, accent `#E11D48`, checks Astro's rendered variables, page/button contrast, including hover states and captures all five complete pages at 390×844, then restores the exact original source bytes in `finally`. It fails on custom-theme contrast regressions and checks the default pages too, retaining the documented original barber secondary-copy finding. `tests/template-theme.test.ts` covers current palettes, changed variables, invalid input warnings/fallbacks and primary-surface contrast, including extreme colours.

The label runner checks Chromium, Firefox and WebKit at 390×844 and 1440×1000, DPR 2 with the renderer caps enforced. It captures both stories at progress 0.15, 0.5, 0.85 and 1, and samples both sides of 1/3 and 2/3. It verifies measured wall clearance, equal padding, 2048×512 artwork, anisotropy, name edits/redraw and the coffee heading's untransformed ancestors. Captures wait after real scroll progress settles. Coffee steam naturally changes between frames; its offscreen pause is checked separately.

Reports and screenshots are local, ignored artefacts:

- `docs/template-themes/`: default/test PNGs for all five templates, original before PNGs, `theme-comparison.png` (columns barber, tailoring, automotive, cleaning, juice; default row then test row), `theme-results.json`, `pixel-diff.json`, restored theme values, `verify.log`, browser regression logs/results and budgets.
- `docs/juice-bar-05-labels/`: per-engine/per-width story PNGs, enlarged name crops and 1440px coffee heading captures, `report.json`; `runtime/` holds 20px scroll logs, fallback captures, size/frame-rate results.
- Earlier unchanged baseline evidence: `docs/juice-bar-05/baseline-regression.log` and `motion-regression.log` reproduce the automotive/cleaning failures before this work.

Final results on the restored original themes:

- `pnpm verify`: **248/248 tests, 28 files**, Astro check, production build, internal output and SEO checks passed (92 HTML files, 74 canonical sitemap URLs). Only the two existing unrelated Astro hints and generic raw chunk-size notice remain.
- Existing selected-template browser suites: **328 passed, 15 existing failures, 2 skipped**, out of 345 cases. Within that run, `three-d-templates.spec.ts` passed **30/30** across Chromium, Firefox and WebKit.
- New label runner: **all six engine/viewport combinations passed**, 96 measured stage/transition samples, minimum measured clearance **0.01800**, consistent step padding, maximum anisotropy **16**, texture **2048×512**, DPR caps, heading sharpness and name redraw checks passed.
- Rendered content-file theme edits: all five default/test captures completed and originals restored. Custom palette page contrast: **zero violations for all five**, including normal and hover button foreground checks; the lowest tested button contrast is **4.697:1**. The original barber small-print finding is described above.
- Runtime/fallback runner: **all three engines passed**, including every-20px progress logs, reverse scrolling, three stages per story, responsiveness, personalisation/ref/privacy, Axe and reduced-motion, WebGL-off and no-JavaScript posters.
- Scene + loader: **139,969 bytes gzip** against **250,000**. All 25 WebP assets, including preview and 16 masks: **191,606 bytes** against **1,500,000**. Every scene poster/mask is under 120,000 bytes; preview is under 200,000.
- At 390×844 and **4× CPU slowdown**, juice **59.99 fps**, coffee **60.01 fps**, p95 intervals **17.5/17.7ms**. Actual rendered-frame counters advanced **179/180**; neither fell back. Offscreen counters stopped.
- Lighthouse mobile: **100 performance / 100 accessibility**, **1,427.882ms LCP**, **0 CLS**, **1,053.603ms FCP**. The initial phone view uses a poster while most of the hero object is clipped; live drawing begins at 75% visibility. This initial-load score is separate from the live-render frame-rate measurement.

The 15 broader-suite failures are the existing automotive quote focus/number and road-phase expectations plus cleaning's 1440px scroll-progress expectation, in all three engines. The original application scripts and scroll behaviour in those templates were not changed. Two existing browser cases were skipped. The 3D suite passes in all three engines. No tests or budgets were loosened.

Chromium may record its known screenshot compositor “GPU stall due to ReadPixels” diagnostic; other application errors/warnings fail the 3D checks. Desktop CPU throttling and Playwright WebKit are emulations, not physical handset/native Safari validation. No order, enquiry, payment, deployment or commit was made.
