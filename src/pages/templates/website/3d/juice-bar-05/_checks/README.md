# juice-bar-05 (Tumble Cup) developer notes

## Posters

The static fallbacks (`cup-*.webp`) are rendered from the live scene code, so
they always match the 3D cup. After changing `_runtime/scene.ts` or the drinks in
`src/content/juice-bar-demo.ts`, re-render them:

```bash
node src/pages/templates/website/3d/juice-bar-05/_checks/posters.mjs
```

The sleeve shows a neutral mark (✳) on posters, so a personalised preview link
never shows the wrong business name when WebGL is unavailable.

## How the page fits together

- `_runtime/page.ts` owns the menu, builder, collection ticket, loader and the
  juice-wave transitions. It works without WebGL.
- `_runtime/controller.ts` runs one fixed canvas. The cup follows whichever
  `[data-anchor]` box is most in view, so HTML layout decides where the 3D goes.
  It pauses when idle, off screen or in a hidden tab, and falls back to the
  posters for reduced motion, no WebGL2, a lost context or under 24 fps.
- `_runtime/scene.ts` builds every object in code (no downloaded models,
  textures or HDRIs). The camera is orthographic in CSS pixels.
