// Dev-only: renders the static fallback posters from the live scene code.
// Bundled and run by posters.mjs; never shipped to visitors.
import { createCupScene, type FruitKind } from '../_runtime/scene';
import { juiceBarDemo as c } from '../../../../../../content/juice-bar-demo';
import { THEME } from '../../../../../../content/juice-bar-demo';

const W = 720,
  Hgt = 900;
(async () => {
  const canvas = document.createElement('canvas');
  canvas.style.width = W + 'px';
  canvas.style.height = Hgt + 'px';
  document.body.append(canvas);
  const scene = await createCupScene(canvas, {
    mobile: false,
    ink: THEME.brand,
    accent: THEME.accent,
  });
  scene.resize(W, Hgt, 1);
  // A neutral mark, so a personalised link never shows the wrong name.
  scene.setName('✳');
  const out: Record<string, string> = {};
  const settle = (explode: number) => {
    const [bottom, top] = explode ? [-0.4, 4.6] : [-0.1, 4.5];
    const s = Math.min(Hgt / (top - bottom), W / (explode ? 3.4 : 4.9));
    const target = {
      x: 0,
      y: -(s * (top + bottom)) / 2,
      scale: s,
      spin: explode ? 0.12 : 0,
      tilt: 0.14,
      sway: 0,
      visible: 1,
    };
    Object.assign(scene.pose, target);
    scene.look.explode = explode;
    scene.look.sleeve = !explode;
    scene.look.orbit = !explode;
    for (let i = 0; i < 40; i++) scene.update(0.5, target, 9);
    scene.render();
    return canvas.toDataURL('image/png');
  };
  for (const drink of c.menu) {
    scene.setBands([{ colour: drink.colour, height: 2 }], true);
    scene.setOrbit(drink.fruit as FruitKind[]);
    scene.setExplodeColour(drink.colour);
    out['cup-' + drink.name.split(' ').at(-1)!.toLowerCase()] = settle(0);
  }
  scene.setExplodeColour(c.menu[0].colour);
  out['cup-layers'] = settle(1);
  (window as unknown as { posters: Record<string, string> }).posters = out;
})();
