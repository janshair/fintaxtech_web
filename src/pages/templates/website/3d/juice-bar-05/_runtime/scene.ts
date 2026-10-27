// Original procedural meshes and CanvasTexture artwork, authored for this project.
// No third-party models, photographs, HDRs, fonts or texture downloads. Three.js: MIT.
import {
  Scene,
  InstancedMesh,
  Object3D,
  DynamicDrawUsage,
  CircleGeometry,
  RepeatWrapping,
  Vector3,
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

export async function createDrinkScene(canvas: HTMLCanvasElement) {
  // Yield between independent construction phases so scrolling/input can run
  // while the poster is visible, even on a throttled phone CPU.
  const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const initStarted = performance.now();
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  canvas.dataset.rendererInitMs = (performance.now() - initStarted).toFixed(1);
  await breathe();
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
  labelCanvas.width = 512;
  labelCanvas.height = 256;
  const context = labelCanvas.getContext('2d')!;
  context.scale(0.5, 0.5);
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
    const bead = new Mesh(beadGeometry, cream),
      a = i * 2.399,
      y = ((i % 7) / 7) * 1.75 - 0.8,
      r = 0.5 + (y + 1) * 0.065;
    bead.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    cup.add(bead);
  }
  // Reuse fruit buffers/materials across all 12 pieces; only transforms differ.
  const peelGeo = new CylinderGeometry(0.37, 0.37, 0.09, 32),
    fleshGeo = new CylinderGeometry(0.325, 0.325, 0.097, 32),
    centreGeo = new CylinderGeometry(0.045, 0.045, 0.105, 12),
    dividerGeo = new BoxGeometry(0.012, 0.101, 0.58);
  const peelMat = mat('#f58429'),
    fleshMat = mat('#ffbe58');
  const berryGeo = new SphereGeometry(0.21, 16, 12),
    berryMat = mat('#cf5269'),
    berryLeafGeo = new SphereGeometry(0.12, 8, 6);
  function orangeSlice() {
    const group = new Group();
    const peel = new Mesh(peelGeo, peelMat);
    group.add(peel);
    const flesh = new Mesh(fleshGeo, fleshMat);
    group.add(flesh);
    const centre = new Mesh(centreGeo, cream);
    group.add(centre);
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
  for (let i = 0; i < 12; i++) {
    const piece = i % 2 === 0 ? orangeSlice() : new Group();
    if (i % 2) {
      const berry = new Mesh(berryGeo, berryMat);
      berry.scale.y = 1.25;
      piece.add(berry);
      const leaf = new Mesh(berryLeafGeo, green);
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
  canvas.dataset.juiceInitMs = (performance.now() - initStarted).toFixed(1);
  await breathe();
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
        new Vector2(0, -0.57),
      ],
      48,
    ),
    cream,
  );
  coffee.add(mug);
  const espressoMaterial = mat('#32180d', 0.3);
  const coffeeLiquid = new Mesh(new CylinderGeometry(0.65, 0.46, 0.98, 48), espressoMaterial);
  coffee.add(coffeeLiquid);
  const streamMaterial = mat('#542710', 0.25);
  streamMaterial.transparent = true;
  const espressoStream = new Mesh(new CylinderGeometry(0.015, 0.024, 1, 12), streamMaterial);
  coffee.add(espressoStream);
  const cremaMaterial = mat('#d6a15b');
  cremaMaterial.transparent = true;
  cremaMaterial.opacity = 0.3;
  const crema = new Mesh(new CylinderGeometry(0.65, 0.65, 0.014, 48), cremaMaterial);
  coffee.add(crema);
  const handle = new Mesh(new TorusGeometry(0.32, 0.09, 12, 24, Math.PI), cream);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.66, -0.02, 0);
  coffee.add(handle);
  const saucer = new Mesh(new CylinderGeometry(1.06, 1, 0.08, 48), cream);
  saucer.position.y = -0.72;
  coffee.add(saucer);
  // Share the exact text-only CanvasTexture with the juice cup.
  const coffeeSleeve = new Mesh(
    new CylinderGeometry(0.68, 0.61, 0.38, 48, 1, true, -0.95, 1.9),
    labelMat,
  );
  coffeeSleeve.position.y = -0.03;
  coffee.add(coffeeSleeve);
  const coffeeSleeveBack = new Mesh(
    new CylinderGeometry(0.678, 0.608, 0.38, 48, 1, true, 0.95, Math.PI * 2 - 1.9),
    green,
  );
  coffeeSleeveBack.position.y = -0.03;
  coffee.add(coffeeSleeveBack);

  // 64 beans, one draw call. The flattened ellipsoid has an actual indented
  // crease along its front, cut into the vertices; no model/normal-map request.
  const beanGeometry = new SphereGeometry(0.115, 16, 12);
  const positions = beanGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) * 0.78,
      y = positions.getY(i) * 1.2;
    let z = positions.getZ(i) * 0.52;
    if (z > 0) z -= Math.exp(-Math.pow((x + 0.007 * Math.sin(y * 25)) / 0.014, 2)) * 0.027;
    positions.setXYZ(i, x, y, z);
  }
  beanGeometry.computeVertexNormals();
  const beans = new InstancedMesh(beanGeometry, mat('#59301c', 0.6), 64);
  beans.instanceMatrix.setUsage(DynamicDrawUsage);
  beans.frustumCulled = false;
  coffee.add(beans);
  const beanPose = new Object3D();
  const seed = (i: number) => {
    const n = Math.sin(i * 78.233 + 17.31) * 43758.5453;
    return n - Math.floor(n);
  };
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const ease = (n: number) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };

  function surfaceTexture(kind: 'leaf' | 'swirl') {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = '#fff4dc';
    ctx.fillStyle = '#fff4dc';
    ctx.lineCap = 'round';
    if (kind === 'leaf') {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(128, 202);
      ctx.bezierCurveTo(118, 154, 138, 112, 128, 57);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const y = 180 - i * 16,
          w = 36 - i * 3;
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(128, y + 9);
          ctx.bezierCurveTo(128 + sign * w, y + 7, 128 + sign * (w + 11), y - 15, 128, y - 4);
          ctx.fill();
        }
      }
    } else {
      ctx.lineWidth = 14;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const angle = (i / 120) * Math.PI * 4.5,
          r = 8 + i * 0.58;
        const x = 128 + Math.cos(angle) * r,
          y = 128 + Math.sin(angle) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }
  const leafTexture = surfaceTexture('leaf'),
    swirlTexture = surfaceTexture('swirl');
  const artMaterial = new MeshBasicMaterial({
    map: leafTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
  });
  const swirlMaterial = new MeshBasicMaterial({
    map: swirlTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
  });
  const latteArt = new Mesh(new CircleGeometry(0.59, 48), artMaterial),
    milkSwirl = new Mesh(new CircleGeometry(0.6, 48), swirlMaterial);
  latteArt.rotation.x = milkSwirl.rotation.x = -Math.PI / 2;
  coffee.add(latteArt, milkSwirl);

  // Three inexpensive alpha planes, with deterministic scrolling noise.
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 64;
  noiseCanvas.height = 128;
  const nc = noiseCanvas.getContext('2d')!,
    pixels = nc.createImageData(64, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 64; x++) {
      const centre = 32 + Math.sin(y * 0.07) * 8;
      const envelope =
        Math.exp(-Math.pow((x - centre) / 12, 2)) * Math.pow(Math.sin((y / 128) * Math.PI), 2);
      const alpha = envelope * (0.35 + 0.65 * seed(y * 64 + x));
      const j = (y * 64 + x) * 4;
      pixels.data[j] = 255;
      pixels.data[j + 1] = 250;
      pixels.data[j + 2] = 235;
      pixels.data[j + 3] = alpha * 175;
    }
  nc.putImageData(pixels, 0, 0);
  const steam: Mesh[] = [];
  const steamTextures: CanvasTexture[] = [];
  for (let i = 0; i < 3; i++) {
    const texture = new CanvasTexture(noiseCanvas);
    texture.wrapT = RepeatWrapping;
    texture.colorSpace = SRGBColorSpace;
    steamTextures.push(texture);
    const plane = new Mesh(
      new PlaneGeometry(0.42, 1.25),
      new MeshBasicMaterial({
        map: texture,
        color: '#9d9d96',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    plane.position.set((i - 1) * 0.27, 1.12, 0);
    plane.rotation.y = (i - 1) * 0.3;
    coffee.add(plane);
    steam.push(plane);
  }
  canvas.dataset.totalInitMs = (performance.now() - initStarted).toFixed(1);
  await breathe();
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
  function render(mode: string, progress: number, lean = 0, time = 0, entry = 1) {
    const isCoffee = mode === 'coffee';
    const storyMode = mode === 'story';
    // Look into the cup before pouring starts, then ease back to the sleeve
    // view through the finishing stage. At p=.5, the half-height surface is
    // visible above the near rim from the visitor's viewpoint.
    const pourView = isCoffee
      ? ease((progress - 0.2) / (1 / 3 - 0.2)) * (1 - ease((progress - 2 / 3) * 3))
      : 0;
    camera.position.set(
      0,
      isCoffee ? 3.5 + 2.4 * pourView : storyMode ? 1.6 : 1.5,
      isCoffee ? 5.1 - 2.1 * pourView : storyMode ? 6.4 : 8.3,
    );
    camera.lookAt(0, isCoffee ? 0.2 : storyMode ? 0.6 : 0.4, 0);
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
    root.scale.set(storyMode ? 1.8 : 1, storyMode ? 0.95 : 1, storyMode ? 1.3 : 1);
    coffee.scale.setScalar(1.35);
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
        const local = clamp(progress * 3);
        const drop = ease((local - seed(i) * 0.35) / 0.65);
        const angle = i * 2.399,
          radius = 0.22 + seed(i + 9) * 0.17;
        piece.position.set(
          Math.cos(angle) * ((1 - drop) * 0.65 + radius),
          2.5 + seed(i) * 0.7 - drop * (2.15 + seed(i) * 0.7),
          Math.sin(angle) * radius,
        );
        piece.rotation.set(drop * 4 + i, drop * 3 + i, drop * 2);
        piece.scale.setScalar(1.1 * (1 - ease((progress - 0.32) * 9)));
        piece.visible = progress < 0.44;
      } else {
        const hero = mode === 'hero',
          angle = i * 2.399;
        const drift = hero ? 1 - ease(entry) : 0;
        piece.position.set(
          Math.cos(angle) * (1.02 + (i % 3) * 0.16) + Math.sin(entry * 5 + i) * drift * 0.15,
          -0.78 + (i % 3) * 0.15 + drift * (0.55 + Math.sin(entry * 6 + i) * 0.2),
          Math.sin(angle) * 0.5,
        );
        piece.rotation.set(0.3 + i + drift * 0.6, 0.5 + drift, i * 0.7 + drift * 0.2);
        piece.scale.setScalar(hero ? 0.78 : 0.85);
        piece.visible =
          mode === 'hero'
            ? i < 4
            : mode !== 'builder' ||
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
    if (isCoffee) {
      const pour = ease((progress - 1 / 3) * 3),
        coffeeFinish = ease((progress - 2 / 3) * 3);
      const coffeeFill = mode === 'coffee' ? pour : 1;
      coffeeLiquid.scale.y = Math.max(0.001, coffeeFill);
      coffeeLiquid.position.y = -0.54 + 0.49 * coffeeFill;
      espressoMaterial.color
        .set('#32180d')
        .lerp(new Color('#b67949'), clamp(pour * 0.7 + coffeeFinish * 0.3));
      const surface = -0.54 + 0.98 * coffeeFill;
      const flow = ease((progress - 1 / 3) / 0.035) * (1 - ease((progress - 0.63) / 0.0367));
      espressoStream.visible = flow > 0.001;
      streamMaterial.opacity = flow;
      const streamTop = 3.2;
      espressoStream.scale.y = streamTop - surface;
      espressoStream.position.set(-0.12, (streamTop + surface) / 2, 0.025);
      crema.position.y = surface + 0.008;
      crema.visible = coffeeFill > 0.015;
      crema.scale.setScalar(0.98);
      latteArt.position.y = surface + 0.025;
      milkSwirl.position.y = surface + 0.018;
      latteArt.scale.setScalar(0.55 + 0.45 * coffeeFinish);
      artMaterial.opacity = ease((coffeeFinish - 0.28) / 0.72);
      milkSwirl.rotation.z = (1 - coffeeFinish) * 2.8;
      swirlMaterial.opacity = Math.sin(coffeeFinish * Math.PI) * 0.85;
      beans.visible = progress < 2 / 3;
      for (let i = 0; i < 64; i++) {
        const r = seed(i),
          angle = i * 2.399;
        const drop = ease((progress * 3 - r * 0.45) / 0.55);
        beanPose.position.set(
          Math.cos(angle) * (0.18 + r * 0.35) * (1 + 0.5 * (1 - drop)),
          (2.3 + r * 1.4) * (1 - drop) + (-0.47 + Math.floor(i / 12) * 0.055) * drop - pour * 0.2,
          Math.sin(angle) * (0.16 + r * 0.26),
        );
        beanPose.rotation.set(i * 0.7 + drop * 4, i * 0.4 + drop * 3, drop * 5 + i);
        beanPose.scale.setScalar(Math.max(0.001, 1 - pour));
        beanPose.updateMatrix();
        beans.setMatrixAt(i, beanPose.matrix);
      }
      beans.instanceMatrix.needsUpdate = true;
      steam.forEach((plane, i) => {
        (plane.material as MeshBasicMaterial).opacity = coffeeFinish * 0.64;
        steamTextures[i].offset.y = -(time * 0.000085 + i * 0.27);
        plane.position.x = (i - 1) * 0.27 + Math.sin(time * 0.0008 + i) * 0.025;
      });
      coffee.rotation.y = (1 - coffeeFinish) * 0.65;
      canvas.dataset.coffeeLabel = lastName;
      canvas.dataset.beans = '64';
      canvas.dataset.coffeeFill = coffeeFill.toFixed(4);
      canvas.dataset.coffeePourView = pourView.toFixed(4);
      canvas.dataset.latteArt = artMaterial.opacity.toFixed(4);
    }
    if (storyMode) {
      root.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const left = new Vector3(-0.67, 0, 0).applyMatrix4(root.matrixWorld).project(camera);
      const right = new Vector3(0.67, 0, 0).applyMatrix4(root.matrixWorld).project(camera);
      canvas.dataset.cupWidth = String(((right.x - left.x) * canvas.clientWidth) / 2);
    }
    const beforeDraw = performance.now();
    renderer.render(scene, camera);
    if (!canvas.dataset.firstDrawMs)
      canvas.dataset.firstDrawMs = (performance.now() - beforeDraw).toFixed(1);
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
    leafTexture.dispose();
    swirlTexture.dispose();
    steamTextures.forEach((t) => t.dispose());
    beans.dispose();
    renderer.dispose();
  }
  // KHR_parallel_shader_compile avoids blocking the first live frame while
  // the lit / instancing / alpha-plane variants are compiled by the GPU.
  const compilePart = async (part: Object3D) => {
    if (renderer.extensions.has('KHR_parallel_shader_compile'))
      await renderer.compileAsync(part, camera, scene);
    else {
      renderer.compile(part, camera, scene);
      await breathe();
    }
  };
  const prepare = async () => {
    const before = performance.now();
    await compilePart(root);
    await compilePart(shadow);
    canvas.dataset.prepareMs = (performance.now() - before).toFixed(1);
  };
  const prepareCoffee = () => compilePart(coffee);
  return { name, mix, render, resize, dispose, canvas, prepare, prepareCoffee };
}
