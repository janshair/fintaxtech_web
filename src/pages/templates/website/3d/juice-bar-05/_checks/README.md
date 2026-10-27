# juice-bar-05 enhancement and verification

This page imports its own `_runtime/controller.ts` and `_runtime/scene.ts`. The older shared `src/scripts/juice-bar.ts` and `src/lib/juice-bar/scene.ts` remain untouched, along with all earlier work outside this template. All source edits for this enhancement are confined to this page folder and `public/templates/website/3d/juice-bar-05/`.

## Behaviour

- Coffee: 64 beans in one InstancedMesh. Flattened ellipsoid vertices include a centre crease. Seeded, scroll-keyframed paths and melt/fill transitions reverse with scrolling. Espresso shifts to latte brown under a translucent crema disc. A milk swirl and original 256px CanvasTexture leaf appear; three transparent noise planes make steam. The personalised sleeve shares the safe text-only texture with juice.
- Both stories have independent 620px timelines and 01/02/03 HTML step highlights. Progress only advances while the object is fully above the sticky bar. Before entry, the juice label resets to 01 / PICK. At 375×812, both measured 600px of interior progress, with 8–9 intermediate samples per stage in all three browsers.
- Juice has 12 larger fruit pieces and a roughly 238px cup (63.5% of a 375px viewport). Four hero fruit pieces drift once, then settle. Loyalty ink fills in ten steps on entry; reduced motion shows it filled. Menu cards lift on hover or press.
- Three explicitly tagged fictional example reviews include initials, first name plus initial, stars and relative dates. `data-sample-review` marks every card; the section has `data-capture="reviews"`. No real reviewer, Google logo or health claim is used.
- A supplied area uses “in”; the final builder link includes the business name and preserved ref.

## Rendering and fallback notes

One shared renderer/canvas is retained. Construction yields between phases. Shaders use parallel compilation only when supported, with a warning-free fallback. Coffee shaders warm as its section approaches. Geometry/material buffers are reused, the sleeve texture is 512×256, and no model, HDR, texture or extra package is downloaded.

On phone first views where the hero is mostly below the viewport/sticky bar, its real poster stays visible until at least 75% of the object can be shown. The engine prepares after first paint; this avoids spending GPU work on a clipped object. Hero drift begins with its first live view. A short scheduling preflight detects very low frame cadence, while the existing render-time FPS monitor handles sustained poor rendering. Steam only continues while the coffee stage is fully visible. Rendering pauses off-screen and in hidden tabs.

Reduced motion (including changes), Save-Data, low reported memory, no JavaScript, WebGL failure, low frame rate and context-loss posters remain supported. Each coffee stage has its own real-scene WebP poster. Posters use a neutral sleeve mark; live sleeves update from safe CanvasTexture text. Personalisation, URL-only privacy and the existing order demo are preserved.

## Final checks

- `pnpm verify`: 236/236 tests, Astro check, build, output and SEO passed. Existing unrelated Astro hints and Vite's generic raw chunk-size notice remain unchanged; no limits/checks were weakened.
- Existing `three-d-templates.spec.ts`: 30/30 passed across Chromium, Firefox and WebKit.
- Template-local checks: both stories logged every 20px, reverse paths, every coffee stage screenshot, SeJuice on sleeve, 64 beans, live cup colour, 238px juice width, labels, example reviews, ref, privacy/storage, Axe, responsive layouts and reduced-motion/WebGL-off/no-JavaScript posters passed in all three engines.
- Combined scene + loader JS: **139,031 bytes gzip**, budget ≤250,000.
- All WebP assets, including preview and every poster: **149,504 bytes**, budget ≤1,500,000. Every scene poster is below 120,000 bytes. Generated runtime textures have zero network-transfer bytes.
- At 390px and 4× CPU slowdown: juice **60.02 fps**, coffee **59.99 fps**; p95 frame intervals 17.4/17.5ms. Actual rendered-frame counters were checked; this measures live 3D, not only browser animation callbacks.
- Lighthouse initial mobile view: Performance **100**, Accessibility **100**, LCP **1.43s**, CLS **0**. The initial phone view uses the poster while the object is clipped; live rendering performance is measured separately above.
- Off-screen frame counters stopped. Context loss/restoration evidence is in the report folder.

Chromium may emit its known screenshot-compositor “GPU stall due to ReadPixels” message. It is preserved as capture evidence; other warnings and application errors fail the checks. CPU slowdown is desktop emulation, not a physical mid-range handset or native Safari test. No enquiry, order, payment, deployment or commit was made.

## Reproduce

Run from the repository root, with a static preview on 4324:

```sh
pnpm verify
pnpm preview --host 127.0.0.1 --port 4324
# Separate terminal:
node src/pages/templates/website/3d/juice-bar-05/_checks/capture.mjs
pnpm build
node src/pages/templates/website/3d/juice-bar-05/_checks/verify.mjs
pnpm exec playwright test tests/browser/three-d-templates.spec.ts
node src/pages/templates/website/3d/juice-bar-05/_checks/lighthouse.mjs
```

These template-local runners supersede the older root-level capture/audit helpers for this enhanced lazy-rendering page. Capture regenerates public posters and preview; rebuild afterward. All helpers stay in Astro-ignored `_checks/`, so no test/debug routes are published. Reports/screenshots are in ignored `docs/juice-bar-05-enhancement/`: `report.json`, per-engine progress/reverse logs, three coffee-stage PNGs per engine, fallback PNGs, `existing-browser-results.json`, `lighthouse.json` and `context-restore.json`.

Preview: http://localhost:4324/templates/website/3d/juice-bar-05/?name=SeJuice&area=Dundee&ref=L-TEST
