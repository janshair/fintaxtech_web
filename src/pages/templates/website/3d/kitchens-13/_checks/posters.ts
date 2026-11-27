// Dev-only: renders the static fallback posters and the loader line drawing
// from the live scene code. Bundled and run by posters.mjs; never shipped.
import { createKitchenScene } from '../_runtime/scene';
import { THEME, kitchensDemo as c } from '../../../../../../content/kitchens-demo';

const W = 960,
  H = 760;
(async () => {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const scene = await createKitchenScene(canvas, { mobile: false, ink: THEME.brand });
  scene.resize(W, H, 1);
  scene.frame({ left: 0, top: 0, width: W, height: H });
  const shot = (explode = 0) => {
    scene.setExplode(explode);
    for (let i = 0; i < 30; i++) scene.update(0.5);
    scene.render();
    return canvas.toDataURL('image/png');
  };
  const out: Record<string, string> = {};
  const slug = (name: string) =>
    name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z]+/g, '-');
  scene.view.azimuth = 0.62;
  scene.view.elevation = 0.42;
  for (const style of c.styles) {
    scene.setSpec(style.spec, true);
    out['style-' + slug(style.name)] = shot();
  }
  scene.setSpec(c.styles[0].spec, true);
  scene.view.azimuth = 0.48;
  scene.view.elevation = 0.5;
  scene.view.zoom = 0.84;
  out['layers'] = shot(1);
  scene.view.zoom = 1;
  // Loader drawing from the hero angle, drawn floor first.
  scene.view.azimuth = 0.62;
  scene.view.elevation = 0.42;
  shot(0);
  const parts = scene.drawing().sort((a, b) => a.y - b.y);
  const round = (n: number) => Math.round(n);
  const paths = parts
    .filter((p) => p.points.length)
    .map((p) => {
      let d = '';
      for (let i = 0; i < p.points.length; i += 4)
        d += `M${round(p.points[i])} ${round(p.points[i + 1])}L${round(p.points[i + 2])} ${round(p.points[i + 3])}`;
      return d;
    });
  (window as unknown as { result: unknown }).result = {
    posters: out,
    drawing: { width: W, height: H, paths },
  };
})();
