// Original procedural meshes and CanvasTexture artwork, authored for this project.
// No third-party models, photographs, HDRs, fonts or texture downloads. Three.js: MIT.
import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LatheGeometry,
  Vector2,
  CylinderGeometry,
  TorusGeometry,
  SphereGeometry,
  BoxGeometry,
  PlaneGeometry,
  CanvasTexture,
  SRGBColorSpace,
  AmbientLight,
  DirectionalLight,
  ACESFilmicToneMapping,
  DoubleSide,
  type BufferGeometry,
  type Material,
} from 'three';

export function createDrinkScene(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  scene.background = new Color('#e8e8c9');
  const camera = new PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 1.5, 8.3);
  camera.lookAt(0, 0.4, 0);
  scene.add(new AmbientLight('#fff5de', 1.7));
  for (const [x, y, z, power] of [
    [-3, 5, 4, 2.5],
    [4, 2, 1, 1],
    [-2, 1, -3, 1.6],
  ]) {
    const light = new DirectionalLight('#ffffff', power);
    light.position.set(x, y, z);
    scene.add(light);
  }
  const root = new Group();
  scene.add(root);
  const mat = (colour: string, roughness = 0.45) =>
    new MeshStandardMaterial({ color: colour, roughness, metalness: 0.03 });
  const cream = mat('#fffae8'),
    green = mat('#174c38'),
    glass = mat('#f5eed9', 0.22),
    juice = mat('#ee9239', 0.32);
  glass.transparent = true;
  glass.opacity = 0.18;
  glass.depthWrite = false;
  const cup = new Group();
  root.add(cup);
  const shell = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0.45, -1),
        new Vector2(0.49, -0.98),
        new Vector2(0.64, 1),
        new Vector2(0.61, 1.02),
        new Vector2(0.47, -0.94),
      ],
      48,
    ),
    glass,
  );
  cup.add(shell);
  const liquid = new Mesh(new CylinderGeometry(0.605, 0.455, 1.78, 48), juice);
  liquid.position.y = -0.02;
  cup.add(liquid);
  const rim = new Mesh(new TorusGeometry(0.635, 0.035, 8, 48), cream);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.04;
  cup.add(rim);
  const lid = new Mesh(new CylinderGeometry(0.67, 0.67, 0.08, 48), cream);
  lid.position.y = 1.06;
  cup.add(lid);
  const straw = new Mesh(new CylinderGeometry(0.035, 0.035, 1.3, 12), green);
  straw.position.set(0.28, 1.65, 0.02);
  straw.rotation.z = -0.16;
  cup.add(straw);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 512;
  const context = labelCanvas.getContext('2d')!;
  const texture = new CanvasTexture(labelCanvas);
  texture.colorSpace = SRGBColorSpace;
  const labelMat = new MeshStandardMaterial({ map: texture, roughness: 0.8, side: DoubleSide });
  const sleeve = new Mesh(
    new CylinderGeometry(0.595, 0.55, 0.62, 48, 1, true, -0.95, 1.9),
    labelMat,
  );
  // Cylinder UVs keep the literal text on the front of the cup.
  sleeve.rotation.y = 0;
  sleeve.position.y = -0.05;
  cup.add(sleeve);
  const backSleeve = new Mesh(
    new CylinderGeometry(0.593, 0.548, 0.62, 48, 1, true, 0.95, Math.PI * 2 - 1.9),
    green,
  );
  backSleeve.position.y = -0.05;
  cup.add(backSleeve);
  const ice: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const cube = new Mesh(new BoxGeometry(0.19, 0.15, 0.18), cream);
    cube.position.set(Math.sin(i * 2.4) * 0.35, 0.88, Math.cos(i * 2.4) * 0.33);
    cube.rotation.set(i, 0.4 * i, i * 0.6);
    cup.add(cube);
    ice.push(cube);
  }
  // Small surface beads suggest condensation without transparency or a shader pass.
  const beadGeometry = new SphereGeometry(0.017, 5, 4);
  for (let i = 0; i < 23; i++) {
    const bead = new Mesh(beadGeometry, cream);
    const a = i * 2.399;
    const y = ((i % 7) / 7) * 1.75 - 0.8;
    const r = 0.5 + (y + 1) * 0.065;
    bead.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    cup.add(bead);
  }
  function orangeSlice() {
    const group = new Group();
    const peel = new Mesh(new CylinderGeometry(0.37, 0.37, 0.09, 32), mat('#f58429'));
    group.add(peel);
    const flesh = new Mesh(new CylinderGeometry(0.325, 0.325, 0.097, 32), mat('#ffbe58'));
    group.add(flesh);
    const centre = new Mesh(new CylinderGeometry(0.045, 0.045, 0.105, 12), cream);
    group.add(centre);
    const dividerGeo = new BoxGeometry(0.012, 0.101, 0.58);
    for (let i = 0; i < 4; i++) {
      const div = new Mesh(dividerGeo, cream);
      div.rotation.y = (i * Math.PI) / 4;
      group.add(div);
    }
    return group;
  }
  const fruit = new Group();
  root.add(fruit);
  const pieces: Group[] = [];
  for (let i = 0; i < 4; i++) {
    const piece = i % 2 === 0 ? orangeSlice() : new Group();
    if (i % 2) {
      const berry = new Mesh(new SphereGeometry(0.21, 16, 12), mat('#cf5269'));
      berry.scale.y = 1.25;
      piece.add(berry);
      const leaf = new Mesh(new SphereGeometry(0.12, 8, 6), green);
      leaf.scale.set(1, 0.15, 1.5);
      leaf.position.y = 0.25;
      piece.add(leaf);
    }
    fruit.add(piece);
    pieces.push(piece);
  }
  const leaf = new Mesh(new SphereGeometry(0.3, 16, 8), green);
  leaf.scale.set(0.5, 0.1, 1.5);
  leaf.position.set(1, -0.6, 0.3);
  root.add(leaf);
  // Baked soft contact shadow, generated locally at 128px; no real-time shadow maps.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sc = shadowCanvas.getContext('2d')!;
  const gradient = sc.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(22,63,51,.24)');
  gradient.addColorStop(1, 'rgba(22,63,51,0)');
  sc.fillStyle = gradient;
  sc.fillRect(0, 0, 128, 128);
  const shadowTexture = new CanvasTexture(shadowCanvas);
  const shadow = new Mesh(
    new PlaneGeometry(3.6, 2.1),
    new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.12, 0);
  scene.add(shadow);
  const coffee = new Group();
  scene.add(coffee);
  const mug = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0, -0.65),
        new Vector2(0.5, -0.65),
        new Vector2(0.72, 0.5),
        new Vector2(0.67, 0.55),
        new Vector2(0.47, -0.57),
      ],
      48,
    ),
    cream,
  );
  coffee.add(mug);
  const coffeeSurface = new Mesh(new CylinderGeometry(0.65, 0.65, 0.03, 48), mat('#774521'));
  coffeeSurface.position.y = 0.46;
  coffee.add(coffeeSurface);
  const foam = new Mesh(new TorusGeometry(0.29, 0.05, 8, 40), mat('#dfb582'));
  foam.rotation.x = Math.PI / 2;
  foam.position.y = 0.49;
  coffee.add(foam);
  const handle = new Mesh(new TorusGeometry(0.32, 0.09, 12, 24), cream);
  handle.position.set(0.72, -0.02, 0);
  coffee.add(handle);
  const saucer = new Mesh(new CylinderGeometry(1.06, 1, 0.08, 48), cream);
  saucer.position.y = -0.72;
  coffee.add(saucer);
  const steam: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const wisp = new Mesh(
      new TorusGeometry(0.22, 0.015, 5, 20, Math.PI * 1.1),
      new MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0.65 }),
    );
    wisp.rotation.set(0, i * 0.6, 0.3);
    wisp.position.set((i - 1) * 0.25, 0.95 + i * 0.15, 0);
    coffee.add(wisp);
    steam.push(wisp);
  }
  let lastName = '';
  function name(value: string) {
    if (lastName === value) return;
    lastName = value;
    context.fillStyle = '#174c38';
    context.fillRect(0, 0, 1024, 512);
    context.fillStyle = '#fff8df';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // Text only, never HTML or an SVG string. Wrap/fit even a 100-character token.
    const chars = Array.from(value);
    const lines = [];
    for (let i = 0; i < chars.length; i += 24) lines.push(chars.slice(i, i + 24).join(''));
    const size = Math.min(76, 260 / Math.max(1, lines.length));
    context.font = `bold ${size}px Arial`;
    lines.forEach((line, i) =>
      context.fillText(line, 512, 240 + (i - (lines.length - 1) / 2) * (size + 8), 940),
    );
    context.font = '23px Arial';
    context.fillText('A LITTLE SUNSHINE, TO GO', 512, 435);
    texture.needsUpdate = true;
    canvas.dataset.label = value;
  }
  let colour = '#ee9239',
    selectedFruit = 'orange',
    drinkType = 'smoothie';
  function mix(next: { colour: string; fruit: string; type: string }) {
    colour = next.colour;
    selectedFruit = next.fruit;
    drinkType = next.type;
    juice.color.set(colour);
    canvas.dataset.colour = colour;
  }
  function render(mode: string, progress: number, lean = 0, time = 0) {
    const isCoffee = mode === 'coffee';
    coffee.visible = isCoffee;
    root.visible = !isCoffee;
    (scene.background as Color).set(
      isCoffee ? '#d8e2b9' : mode === 'story' ? '#e7edda' : '#e8e8c9',
    );
    cup.rotation.set(
      0.02,
      mode === 'story' ? (1 - progress) * 0.55 : lean * 0.15,
      -0.08 + lean * 0.035,
    );
    cup.position.y = mode === 'hero' ? 0.02 : 0;
    root.scale.setScalar(mode === 'story' ? 0.92 : 1);
    const fill = mode === 'story' ? Math.max(0.03, Math.min(1, (progress - 1 / 3) * 3)) : 1;
    liquid.scale.y = fill;
    liquid.position.y = -0.91 + 0.89 * fill;
    const finish = mode === 'story' ? Math.max(0, Math.min(1, (progress - 2 / 3) * 3)) : 1;
    lid.position.y = 1.06 + (1 - finish) * 1.4;
    straw.position.y = 1.65 + (1 - finish) * 2.3;
    lid.visible = mode !== 'story' || progress >= 2 / 3;
    straw.visible = lid.visible;
    pieces.forEach((piece, i) => {
      if (mode === 'story') {
        const drop = Math.min(1, Math.max(0, progress * 3));
        piece.position.set(
          (i - 1.5) * (0.55 * (1 - drop) + 0.16),
          2.6 + i * 0.16 - drop * (2.4 + i * 0.13),
          Math.sin(i) * 0.25,
        );
        piece.rotation.set(drop * 3 + i, drop * 4 + i, drop * 2);
        piece.scale.setScalar(0.8);
        piece.visible = progress < 0.48;
      } else {
        piece.position.set(
          i < 2 ? -0.9 - i * 0.15 : 0.9 + (i - 2) * 0.25,
          -0.85 + (i % 2) * 0.22,
          i % 2 ? -0.2 : 0.45,
        );
        piece.rotation.set(0.3 + i, 0.5, i * 0.7);
        piece.scale.setScalar(0.85);
        piece.visible =
          mode !== 'builder' ||
          (drinkType !== 'coffee' &&
            (selectedFruit === 'berry'
              ? i % 2 === 1
              : selectedFruit === 'green'
                ? false
                : i % 2 === 0));
      }
    });
    ice.forEach((cube) => (cube.visible = mode !== 'story' || fill > 0.9));
    leaf.visible = mode !== 'story' || progress > 0.45;
    steam.forEach((wisp, i) => {
      wisp.position.y = 0.95 + i * 0.15 + Math.sin(time * 0.002 + i) * 0.035;
    });
    coffee.rotation.y = -0.25 + lean * 0.1;
    renderer.render(scene, camera);
  }
  let lastWidth = 0,
    lastHeight = 0,
    lastRatio = 0;
  function resize(width: number, height: number) {
    const ratio = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2);
    if (width === lastWidth && height === lastHeight && ratio === lastRatio) return;
    lastWidth = width;
    lastHeight = height;
    if (ratio !== lastRatio) {
      renderer.setPixelRatio(ratio);
      lastRatio = ratio;
    }
    renderer.setSize(width, height, false);
    // Three floors the drawing buffer but rounds its viewport. Match them for
    // fractional CSS dimensions (notably the small dialog preview in Firefox).
    renderer.setViewport(0, 0, canvas.width / ratio, canvas.height / ratio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function dispose() {
    const geometries = new Set<BufferGeometry>(),
      materials = new Set<Material>();
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        geometries.add(node.geometry);
        (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) =>
          materials.add(material),
        );
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    texture.dispose();
    shadowTexture.dispose();
    renderer.dispose();
  }
  return { name, mix, render, resize, dispose, canvas };
}
