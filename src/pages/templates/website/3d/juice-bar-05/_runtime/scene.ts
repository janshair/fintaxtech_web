// Original procedural meshes and CanvasTexture artwork, authored for this project.
// No third-party models, photographs, HDRs, fonts or texture downloads. Three.js: MIT.
import { layoutSleeveName, SLEEVE_ARC, SLEEVE_WIDTH } from './sleeve-layout';
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
  PlaneGeometry,
  CanvasTexture,
  SRGBColorSpace,
  LinearMipmapLinearFilter,
  LinearFilter,
  HemisphereLight,
  DirectionalLight,
  MeshMatcapMaterial,
  NeutralToneMapping,
  DoubleSide,
  AdditiveBlending,
  BufferGeometry,
  BufferAttribute,
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
  // Neutral tone mapping keeps the fruit and brand colours true to the page palette.
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  const styles = getComputedStyle(document.documentElement);
  const themed = (value: string) =>
    styles.getPropertyValue('--tone-' + value.slice(1)).trim() || value;
  const sleeveColour = styles.getPropertyValue('--sleeve').trim() || '#174c38';
  const labelColour = styles.getPropertyValue('--on-sleeve').trim() || '#fff8df';
  const scene = new Scene();
  scene.background = new Color(themed('#e8e8c9'));
  const camera = new PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 1.5, 8.3);
  camera.lookAt(0, 0.4, 0);
  // Soft sky/ground light with one key and one rim light. Glossy surfaces get
  // their reflections from small drawn studio textures below, which cost one
  // texture lookup per pixel: no environment map, prefiltering or HDR download.
  scene.add(new HemisphereLight('#fffaf0', '#d8cba8', 2.1));
  for (const [x, y, z, power] of [
    [-3, 5, 4, 2.6],
    [3, 2.5, -4, 1.2],
  ]) {
    const light = new DirectionalLight('#ffffff', power);
    light.position.set(x, y, z);
    scene.add(light);
  }
  const root = new Group();
  scene.add(root);
  const mat = (colour: string, roughness = 0.45) =>
    new MeshStandardMaterial({ color: colour, roughness, metalness: 0.03 });
  // Small locally drawn textures: no image downloads.
  const paint = (size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d')!, size);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  };
  const seed = (i: number) => {
    const n = Math.sin(i * 78.233 + 17.31) * 43758.5453;
    return n - Math.floor(n);
  };
  // Join simple parts into one buffer: one draw call per fruit detail.
  const merge = (parts: BufferGeometry[]) => {
    const flat = parts.map((part) => (part.index ? part.toNonIndexed() : part));
    const merged = new BufferGeometry();
    for (const [name, size] of [
      ['position', 3],
      ['normal', 3],
      ['uv', 2],
    ] as const) {
      const array = new Float32Array(flat.reduce((n, g) => n + g.attributes[name].array.length, 0));
      let offset = 0;
      for (const g of flat) {
        array.set(g.attributes[name].array, offset);
        offset += g.attributes[name].array.length;
      }
      merged.setAttribute(name, new BufferAttribute(array, size));
    }
    [...flat, ...parts].forEach((g) => g.dispose());
    return merged;
  };
  // Studio reflections, drawn as they appear on a sphere facing the camera
  // (left to right, top to bottom): a tall key window on the left, a softer
  // strip on the right and a bright rim at glancing angles.
  const softLight = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
  ) => {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
    glow.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.55})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(w, h);
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  };
  const reflections = paint(256, (ctx, size) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const rim = ctx.createRadialGradient(128, 128, 96, 128, 128, 128);
    rim.addColorStop(0, 'rgba(255,255,255,0)');
    rim.addColorStop(1, 'rgba(255,255,255,.5)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, size, size);
    softLight(ctx, 60, 118, 12, 104, 0.62);
    softLight(ctx, 199, 132, 20, 96, 0.26);
    softLight(ctx, 128, 26, 80, 16, 0.4);
  });
  const glaze = paint(256, (ctx, size) => {
    const body = ctx.createRadialGradient(92, 78, 10, 128, 128, 150);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.5, '#f4efe2');
    body.addColorStop(0.85, '#d9d1bd');
    body.addColorStop(1, '#c2b9a3');
    ctx.fillStyle = body;
    ctx.fillRect(0, 0, size, size);
    softLight(ctx, 76, 66, 30, 44, 0.9);
    softLight(ctx, 206, 150, 14, 60, 0.45);
  });
  const cream = new MeshMatcapMaterial({ matcap: glaze, color: '#fffdf6' }),
    ceramic = new MeshMatcapMaterial({ matcap: glaze }),
    sleeveGreen = mat(sleeveColour, 0.8),
    // A faint flat tint: the reflections come from the gloss layer below.
    glass = new MeshBasicMaterial({ color: '#ffffff' }),
    juice = mat('#ee9239', 0.3),
    foam = mat('#f6b56f', 0.62);
  glass.transparent = true;
  glass.opacity = 0.1;
  glass.depthWrite = false;
  // Reflections only, added over the clear wall: transparency would dim them.
  const gloss = new MeshMatcapMaterial({
    matcap: reflections,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  // The deeper drink is slightly richer than the surface.
  juice.map = paint(64, (ctx, size) => {
    const shade = ctx.createLinearGradient(0, 0, 0, size);
    shade.addColorStop(0, '#ffffff');
    shade.addColorStop(0.2, '#fbf6f1');
    shade.addColorStop(1, '#e9dccf');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, size, size);
  });
  const cup = new Group();
  root.add(cup);
  // Clear cup: the wall radii are unchanged (the sleeve and liquid depend on
  // them); the base and rolled lip are thicker, as on a real cup.
  const shellGeometry = new LatheGeometry(
    [
      new Vector2(0, -1),
      new Vector2(0.45, -1),
      new Vector2(0.485, -0.985),
      new Vector2(0.49, -0.96),
      new Vector2(0.64, 1),
      new Vector2(0.655, 1.03),
      new Vector2(0.64, 1.05),
      new Vector2(0.615, 1.03),
      new Vector2(0.61, 1.0),
      new Vector2(0.47, -0.94),
      new Vector2(0, -0.94),
    ],
    96,
  );
  const shell = new Mesh(shellGeometry, glass);
  cup.add(shell);
  // Reflections sit on the outer wall only: one additive layer, not three.
  const shellGloss = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0.485, -0.985),
        new Vector2(0.49, -0.96),
        new Vector2(0.64, 1),
        new Vector2(0.655, 1.03),
      ],
      64,
    ),
    gloss,
  );
  cup.add(shellGloss);
  const liquid = new Mesh(new CylinderGeometry(1, 1, 1, 96), [juice, foam, juice]);
  liquid.position.y = -0.02;
  cup.add(liquid);
  // A flat lid with a raised ring and a skirt that clips over the lip.
  const lid = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0, 0.03),
        new Vector2(0.5, 0.03),
        new Vector2(0.535, 0.012),
        new Vector2(0.57, 0.012),
        new Vector2(0.6, 0.045),
        new Vector2(0.655, 0.045),
        new Vector2(0.685, 0.022),
        new Vector2(0.692, -0.03),
        new Vector2(0.68, -0.055),
      ],
      72,
    ),
    cream,
  );
  cream.side = DoubleSide;
  lid.position.y = 1.06;
  cup.add(lid);
  // The straw reaches down into the drink; its top end is where it always was.
  const straw = new Mesh(new CylinderGeometry(0.043, 0.043, 2.6, 24), sleeveGreen);
  straw.position.set(0.177, 1.007, 0.02);
  straw.rotation.z = -0.16;
  cup.add(straw);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 2048;
  labelCanvas.height = 512;
  const context = labelCanvas.getContext('2d')!;
  // Logical 1024×512 artwork, with two physical pixels horizontally.
  context.setTransform(2, 0, 0, 1, 0, 0);
  const texture = new CanvasTexture(labelCanvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const labelMat = new MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    side: DoubleSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const sleeve = new Mesh(
    new CylinderGeometry(0.593, 0.546, 0.62, 96, 1, true, -SLEEVE_ARC / 2, SLEEVE_ARC),
    labelMat,
  );
  // UV u=.5 lies on local +Z: the camera-facing side at the final pose.
  // Both label panels use the same centred 120° arc with safe text insets.
  sleeve.rotation.y = 0;
  sleeve.position.y = -0.05;
  cup.add(sleeve);
  const backSleeve = new Mesh(
    new CylinderGeometry(0.593, 0.546, 0.62, 96, 1, true, SLEEVE_ARC / 2, Math.PI * 2 - SLEEVE_ARC),
    sleeveGreen,
  );
  backSleeve.position.y = -0.05;
  cup.add(backSleeve);
  // Opaque sleeves write depth before the transparent shell. The shell tests
  // that depth and cannot tint the name; the liquid remains inside the wall.
  sleeve.renderOrder = backSleeve.renderOrder = 3;
  shell.renderOrder = 1;
  shellGloss.renderOrder = 2;
  // Rounded, translucent ice: a sphere pushed out toward a cube.
  const iceGeometry = new SphereGeometry(1, 14, 10);
  {
    const p = iceGeometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k =
        Math.pow(Math.max(Math.abs(p.getX(i)), Math.abs(p.getY(i)), Math.abs(p.getZ(i))), 0.74) /
        0.1;
      p.setXYZ(i, p.getX(i) / k, p.getY(i) / k, p.getZ(i) / k);
    }
    iceGeometry.computeVertexNormals();
  }
  const iceMaterial = new MeshMatcapMaterial({ matcap: glaze, color: '#eaf7fb' });
  iceMaterial.transparent = true;
  iceMaterial.opacity = 0.62;
  const ice: Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const cube = new Mesh(iceGeometry, iceMaterial);
    cube.position.set(Math.sin(i * 2.4) * 0.34, 0.9 + (i % 2) * 0.03, Math.cos(i * 2.4) * 0.32);
    cube.rotation.set(i, 0.4 * i, i * 0.6);
    cup.add(cube);
    ice.push(cube);
  }
  // Clear condensation droplets on the wall, merged into one small static
  // buffer (instancing proved slow on software renderers); none on the sleeve.
  const dropMaterial = new MeshMatcapMaterial({ matcap: glaze, transparent: true, opacity: 0.4 });
  dropMaterial.depthWrite = false;
  const dropParts: BufferGeometry[] = [];
  for (let i = 0; i < 40; i++) {
    const a = i * 2.399 + seed(i) * 0.5;
    let y = seed(i + 40) * 1.75 - 0.86;
    // Keep condensation off the paper sleeve and its lettering.
    if (y > -0.41 && y < 0.31) y = y < -0.05 ? -0.45 - seed(i + 7) * 0.4 : 0.34 + seed(i + 7) * 0.5;
    const r = 0.49 + ((y + 0.96) * 0.15) / 1.96 + 0.002,
      size = 0.007 + seed(i + 90) * 0.009;
    const drop = new SphereGeometry(1, 6, 4);
    drop.scale(size, size * (1.2 + seed(i + 3) * 0.7), size * 0.5);
    drop.rotateY(a);
    drop.translate(Math.sin(a) * r, y, Math.cos(a) * r);
    dropParts.push(drop);
  }
  const drops = new Mesh(merge(dropParts), dropMaterial);
  drops.renderOrder = 2;
  cup.add(drops);
  // Fruit buffers, textures and materials are shared by all 12 pieces.
  // Orange slice: a drawn cut face (rind, pith, ten segments, juice sacs).
  const sliceFace = paint(512, (ctx, size) => {
    const c = size / 2;
    const ring = (radius: number, fill: string | CanvasGradient) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(c, c, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    ring(c, '#f28a1e');
    ring(c * 0.9, '#ffe2a6');
    const flesh = ctx.createRadialGradient(c, c, c * 0.1, c, c, c * 0.84);
    flesh.addColorStop(0, '#ffc45c');
    flesh.addColorStop(1, '#fb9a24');
    ring(c * 0.84, flesh);
    ctx.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const angle = seed(i) * Math.PI * 2,
        from = c * (0.14 + seed(i + 500) * 0.5),
        length = c * (0.06 + seed(i + 900) * 0.14);
      ctx.strokeStyle = seed(i + 300) > 0.5 ? 'rgba(255,226,150,.5)' : 'rgba(226,120,10,.3)';
      ctx.lineWidth = 2 + seed(i + 700) * 3;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle) * from, c + Math.sin(angle) * from);
      ctx.lineTo(c + Math.cos(angle) * (from + length), c + Math.sin(angle) * (from + length));
      ctx.stroke();
    }
    ctx.strokeStyle = '#ffe9bb';
    ctx.lineWidth = 7;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle) * c * 0.07, c + Math.sin(angle) * c * 0.07);
      ctx.lineTo(c + Math.cos(angle) * c * 0.85, c + Math.sin(angle) * c * 0.85);
      ctx.stroke();
    }
    ring(c * 0.075, '#fff0cd');
  });
  const peelMat = mat('#f28a1e', 0.55),
    fleshMat = mat('#ffffff', 0.34);
  fleshMat.map = sliceFace;
  const sliceGeo = new CylinderGeometry(0.37, 0.37, 0.075, 56);
  // Strawberry: a tapered body with seeds, and a leafy top with a short stem.
  const berryGeo = new LatheGeometry(
    [
      new Vector2(0, -0.27),
      new Vector2(0.05, -0.245),
      new Vector2(0.11, -0.17),
      new Vector2(0.165, -0.06),
      new Vector2(0.2, 0.06),
      new Vector2(0.2, 0.14),
      new Vector2(0.165, 0.2),
      new Vector2(0.09, 0.232),
      new Vector2(0, 0.238),
    ],
    28,
  );
  const berryMat = mat('#ffffff', 0.3);
  berryMat.map = paint(256, (ctx, size) => {
    const skin = ctx.createLinearGradient(0, 0, 0, size);
    skin.addColorStop(0, '#e2483f');
    skin.addColorStop(0.25, '#d92b3a');
    skin.addColorStop(1, '#bf1f33');
    ctx.fillStyle = skin;
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < 9; row++)
      for (let col = 0; col < 12; col++) {
        const x = ((col + (row % 2) * 0.5) / 12) * size,
          y = ((row + 0.9) / 10) * size;
        ctx.fillStyle = 'rgba(120,10,25,.45)';
        ctx.beginPath();
        ctx.ellipse(x, y, 4.2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f4d88c';
        ctx.beginPath();
        ctx.ellipse(x, y - 0.6, 2.2, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
  });
  const leafParts: BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const leaf = new SphereGeometry(0.06, 8, 5);
    leaf.scale(0.85, 0.2, 1.75);
    leaf.translate(0, 0, 0.115);
    leaf.rotateX(0.16);
    leaf.rotateY((i / 6) * Math.PI * 2);
    leaf.translate(0, 0.252, 0);
    leafParts.push(leaf);
  }
  const stem = new CylinderGeometry(0.012, 0.017, 0.1, 6);
  stem.translate(0, 0.3, 0);
  leafParts.push(stem);
  const berryTopGeo = merge(leafParts),
    berryTopMat = mat('#4c9a3f', 0.6);
  const fruit = new Group();
  root.add(fruit);
  const pieces: Group[] = [];
  for (let i = 0; i < 12; i++) {
    const piece = new Group();
    if (i % 2) piece.add(new Mesh(berryGeo, berryMat), new Mesh(berryTopGeo, berryTopMat));
    else piece.add(new Mesh(sliceGeo, [peelMat, fleshMat, fleshMat]));
    fruit.add(piece);
    pieces.push(piece);
  }
  // Baked soft contact shadows, drawn locally; no real-time shadow maps. The
  // cup has a tight core and a wide soft edge; resting fruit gets small ones.
  const shadowHex = styles.getPropertyValue('--brand').trim() || '#163f33';
  const shadowRGB = [1, 3, 5].map((i) => parseInt(shadowHex.slice(i, i + 2), 16)).join(',');
  const shadowTexture = paint(256, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${shadowRGB},.42)`);
    gradient.addColorStop(0.28, `rgba(${shadowRGB},.26)`);
    gradient.addColorStop(0.62, `rgba(${shadowRGB},.08)`);
    gradient.addColorStop(1, `rgba(${shadowRGB},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
  const shadowMaterial = new MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
  });
  const shadowPlane = new PlaneGeometry(1, 1);
  shadowPlane.rotateX(-Math.PI / 2);
  const shadow = new Mesh(shadowPlane, shadowMaterial);
  shadow.position.set(0, -1.01, 0);
  scene.add(shadow);
  const pieceShadows = pieces.slice(0, 4).map(() => {
    const blob = new Mesh(shadowPlane, shadowMaterial);
    root.add(blob);
    return blob;
  });
  // The hero still life: [x, y, z, rotX, rotY, rotZ, shadow size] for the four
  // pieces resting beside the cup (slice, berry, slice, berry).
  // Six resting places for the mix preview: [x, -, z, slice pose, berry pose],
  // each pose being [y, rotX, rotY, rotZ].
  const restLayout = [
    [-1.02, 0, -0.1, [-0.68, 1.3, -0.4, -0.12], [-0.78, 0.1, 0.5, 0.2]],
    [1.04, 0, -0.15, [-0.68, 1.28, 0.42, 0.16], [-0.78, -0.1, 2, -0.25]],
    [-0.92, 0, 0.6, [-0.975, 0, 0.3, 0], [-0.84, 0.25, 0.6, 1.72]],
    [0.94, 0, 0.62, [-0.975, 0, 0.5, 0], [-0.84, -0.2, 2.2, -1.5]],
    [-1.5, 0, 0.2, [-0.69, 1.35, 0.5, 0.3], [-0.78, 0, 1.2, 0.15]],
    [1.5, 0, 0.18, [-0.69, 1.3, -0.5, -0.25], [-0.84, 0.3, -0.7, 1.6]],
  ];
  const heroLayout = [
    [1.06, -0.66, -0.2, 1.28, 0.42, 0.16, 0.95],
    [-0.98, -0.83, 0.42, 0.25, 0.6, 1.72, 0.75],
    [0.98, -0.962, 0.62, 0, 0.5, 0, 1.15],
    [-1.3, -0.83, -0.22, -0.2, 2.2, -1.45, 0.75],
  ];
  canvas.dataset.juiceInitMs = (performance.now() - initStarted).toFixed(1);
  await breathe();
  const coffee = new Group();
  scene.add(coffee);
  // Glazed cup with a rounded lip; the wall radii are unchanged.
  const mug = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0, -0.65),
        new Vector2(0.46, -0.65),
        new Vector2(0.5, -0.625),
        new Vector2(0.72, 0.5),
        new Vector2(0.728, 0.54),
        new Vector2(0.705, 0.566),
        new Vector2(0.678, 0.55),
        new Vector2(0.47, -0.57),
        new Vector2(0, -0.57),
      ],
      96,
    ),
    ceramic,
  );
  coffee.add(mug);
  const espressoMaterial = mat('#32180d', 0.22);
  const coffeeLiquid = new Mesh(new CylinderGeometry(1, 1, 1, 96), espressoMaterial);
  coffee.add(coffeeLiquid);
  const streamMaterial = mat('#542710', 0.2);
  streamMaterial.transparent = true;
  const espressoStream = new Mesh(new CylinderGeometry(0.015, 0.024, 1, 16), streamMaterial);
  coffee.add(espressoStream);
  // Crema gathers into a golden ring at the edge of the cup.
  const cremaMaterial = mat('#ffffff', 0.5);
  cremaMaterial.map = paint(256, (ctx, size) => {
    const c = size / 2,
      ring = ctx.createRadialGradient(c, c, 0, c, c, c);
    ring.addColorStop(0, 'rgba(214,161,91,.22)');
    ring.addColorStop(0.72, 'rgba(214,161,91,.34)');
    ring.addColorStop(0.93, 'rgba(236,196,128,.95)');
    ring.addColorStop(1, 'rgba(196,140,74,.9)');
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, size, size);
  });
  cremaMaterial.transparent = true;
  cremaMaterial.opacity = 0.75;
  const crema = new Mesh(new CylinderGeometry(1, 1, 0.014, 96), cremaMaterial);
  coffee.add(crema);
  const handle = new Mesh(new TorusGeometry(0.3, 0.078, 18, 40, Math.PI), ceramic);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.665, -0.02, 0);
  coffee.add(handle);
  // Saucer with a raised rim and a shallow well for the cup.
  const saucer = new Mesh(
    new LatheGeometry(
      [
        new Vector2(0, -0.765),
        new Vector2(0.6, -0.765),
        new Vector2(0.98, -0.715),
        new Vector2(1.075, -0.672),
        new Vector2(1.07, -0.652),
        new Vector2(0.98, -0.682),
        new Vector2(0.62, -0.722),
        new Vector2(0.54, -0.705),
        new Vector2(0, -0.705),
      ],
      96,
    ),
    ceramic,
  );
  coffee.add(saucer);
  const coffeeShadow = new Mesh(shadowPlane, shadowMaterial);
  coffeeShadow.position.y = -0.77;
  coffeeShadow.scale.set(3, 1, 3);
  coffee.add(coffeeShadow);
  // Share the exact text-only CanvasTexture with the juice cup.
  const coffeeSleeve = new Mesh(
    new CylinderGeometry(0.664, 0.591, 0.38, 96, 1, true, -SLEEVE_ARC / 2, SLEEVE_ARC),
    labelMat,
  );
  coffeeSleeve.position.y = -0.03;
  coffee.add(coffeeSleeve);
  const coffeeSleeveBack = new Mesh(
    new CylinderGeometry(0.664, 0.591, 0.38, 96, 1, true, SLEEVE_ARC / 2, Math.PI * 2 - SLEEVE_ARC),
    sleeveGreen,
  );
  coffeeSleeveBack.position.y = -0.03;
  coffee.add(coffeeSleeveBack);
  coffeeSleeve.renderOrder = coffeeSleeveBack.renderOrder = 3;

  // Rebuild the two radii at the actual surface height. Scaling a tapered
  // cylinder vertically alone makes its top intersect the narrower lower cup.
  function taperedFill(
    mesh: Mesh<CylinderGeometry>,
    bottom: number,
    height: number,
    radiusAt: (y: number) => number,
    diagnostic: string,
  ) {
    const unit = mesh.geometry.attributes.position.array.slice();
    let previous = -1;
    return (fill: number) => {
      if (fill === previous) return;
      previous = fill;
      const positions = mesh.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = bottom + (unit[i * 3 + 1] + 0.5) * height * fill;
        const radius = radiusAt(y) - 0.018;
        positions.setXYZ(i, unit[i * 3] * radius, y, unit[i * 3 + 2] * radius);
      }
      let clearance = Infinity;
      for (let i = 0; i < positions.count; i++)
        clearance = Math.min(
          clearance,
          radiusAt(positions.getY(i)) - Math.hypot(positions.getX(i), positions.getZ(i)),
        );
      canvas.dataset[diagnostic] = clearance.toFixed(5);
      positions.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
      mesh.position.y = 0;
    };
  }
  const juiceFill = taperedFill(
    liquid,
    -0.91,
    1.78,
    (y) => 0.47 + (y + 0.94) / 14,
    'juiceClearance',
  );
  const espressoFill = taperedFill(
    coffeeLiquid,
    -0.54,
    0.98,
    (y) => 0.47 + (y + 0.57) / 5.6,
    'coffeeClearance',
  );

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
  const beans = new InstancedMesh(beanGeometry, mat('#ffffff', 0.42), 64);
  beans.instanceMatrix.setUsage(DynamicDrawUsage);
  beans.frustumCulled = false;
  // Slightly different roasts, so the pile does not look stamped out.
  const roast = new Color();
  for (let i = 0; i < 64; i++)
    beans.setColorAt(i, roast.set('#4a2615').lerp(new Color('#74401f'), seed(i + 200)));
  coffee.add(beans);
  const beanPose = new Object3D();
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const ease = (n: number) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };

  function surfaceTexture(kind: 'leaf' | 'swirl') {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.scale(2, 2);
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
      // Blend four coarse noise cells so the wisps are soft, not speckled.
      const gx = x / 9,
        gy = y / 14,
        fx = gx - Math.floor(gx),
        fy = gy - Math.floor(gy),
        cell = (cx: number, cy: number) =>
          seed(Math.floor(gx + cx) * 57 + Math.floor(gy + cy) * 131);
      const soft =
        (cell(0, 0) * (1 - fx) + cell(1, 0) * fx) * (1 - fy) +
        (cell(0, 1) * (1 - fx) + cell(1, 1) * fx) * fy;
      const alpha = envelope * (0.3 + 0.7 * soft);
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
    context.fillStyle = sleeveColour;
    context.fillRect(0, 0, 1024, 512);
    context.fillStyle = labelColour;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // Measure real font widths; wrap only at spaces, never squash or split words.
    const layout = layoutSleeveName(value, (text, size) => {
      context.font = `900 ${size}px Arial`;
      return context.measureText(text).width;
    });
    context.font = `900 ${layout.fontSize}px Arial`;
    layout.lines.forEach((line, i) =>
      context.fillText(
        line,
        512,
        223 + (i - (layout.lines.length - 1) / 2) * (layout.fontSize + 14),
      ),
    );
    canvas.dataset.labelLines = JSON.stringify(layout.lines);
    canvas.dataset.labelFont = String(layout.fontSize);
    canvas.dataset.labelTruncated = String(layout.truncated);
    canvas.dataset.labelWidths = JSON.stringify(
      layout.lines.map((line) => context.measureText(line).width),
    );
    canvas.dataset.labelMaxWidth = String(SLEEVE_WIDTH);
    canvas.dataset.labelArc = '120';
    context.font = 'bold 38px Arial';
    context.fillText('A LITTLE SUNSHINE, TO GO', 512, 448);
    texture.needsUpdate = true;
    canvas.dataset.labelTexture = '2048x512';
    canvas.dataset.anisotropy = String(texture.anisotropy);
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
    // The surface is a lighter, frothier tint of the same drink.
    foam.color.set(colour).lerp(new Color('#fff6e6'), 0.3);
    canvas.dataset.colour = colour;
  }
  function render(mode: string, progress: number, lean = 0, time = 0, entry = 1) {
    const isCoffee = mode === 'coffee';
    const storyMode = mode === 'story';
    const finish = storyMode ? Math.max(0, Math.min(1, (progress - 2 / 3) * 3)) : 1;
    const settle = storyMode ? ease(finish) : 0;
    // Look into the cup before pouring starts, then ease back to the sleeve
    // view through the finishing stage. At p=.5, the half-height surface is
    // visible above the near rim from the visitor's viewpoint.
    const pourView = isCoffee
      ? ease((progress - 0.2) / (1 / 3 - 0.2)) * (1 - ease((progress - 2 / 3) * 3))
      : 0;
    camera.position.set(
      0,
      isCoffee ? 3.5 + 2.4 * pourView : storyMode ? 1.7 : 1.5,
      isCoffee ? 5.1 - 2.1 * pourView : storyMode ? 7.6 : 7.5,
    );
    camera.lookAt(0, isCoffee ? 0.2 : storyMode ? 0.95 : 0.56, 0);
    coffee.visible = isCoffee;
    root.visible = !isCoffee;
    (scene.background as Color).set(
      themed(isCoffee ? '#d8e2b9' : mode === 'story' ? '#e7edda' : '#e8e8c9'),
    );
    cup.rotation.set(
      0.02 * (1 - settle),
      mode === 'story' ? (1 - progress) * 0.55 : lean * 0.15,
      -0.08 * (1 - settle) + lean * 0.035,
    );
    cup.position.y = 0;
    // One uniform scale: the cup, fruit and lettering keep their true proportions.
    root.scale.setScalar(storyMode ? 1.22 : 1);
    root.position.y = storyMode ? 0.22 : 0;
    shadow.visible = !isCoffee;
    shadow.scale.set(storyMode ? 3.7 : 2.9, 1, storyMode ? 2.3 : 1.8);
    coffee.scale.setScalar(1.35);
    const fill = mode === 'story' ? Math.max(0.03, Math.min(1, (progress - 1 / 3) * 3)) : 1;
    juiceFill(fill);
    lid.position.y = 1.06 + (1 - finish) * 1.4;
    straw.position.y = 1.007 + (1 - finish) * 2.3;
    lid.visible = mode !== 'story' || progress >= 2 / 3;
    straw.visible = lid.visible;
    pieces.forEach((piece, i) => {
      if (mode === 'story') {
        const local = clamp(progress * 3);
        const drop = ease((local - seed(i) * 0.35) / 0.65);
        const angle = i * 2.399,
          radius = 0.055 + seed(i + 9) * 0.07;
        piece.position.set(
          Math.cos(angle) * ((1 - drop) * 0.65 + radius),
          2.5 + seed(i) * 0.7 - drop * (2.15 + seed(i) * 0.7),
          Math.sin(angle) * radius,
        );
        piece.rotation.set(drop * 4 + i, drop * 3 + i, drop * 2);
        piece.scale.setScalar(1.1 * (1 - ease((progress - 0.32) * 9)));
        piece.visible = progress < 0.44;
      } else if (mode === 'hero') {
        // Four pieces settle into a still life beside the cup.
        const drift = 1 - ease(entry);
        const [x, y, z, rx, ry, rz] = heroLayout[i] || heroLayout[0];
        piece.position.set(
          x + Math.sin(entry * 5 + i) * drift * 0.15,
          y + drift * (0.55 + Math.sin(entry * 6 + i) * 0.2),
          z,
        );
        piece.rotation.set(rx + drift * 0.6, ry + drift, rz + drift * 0.2);
        piece.scale.setScalar(1);
        piece.visible = i < 4;
      } else {
        // The mix preview: six pieces of the chosen fruit rest either side of the cup.
        const slot = restLayout[i >> 1],
          pose = slot[3 + (i % 2)] as number[];
        piece.position.set(slot[0] as number, pose[0], slot[2] as number);
        piece.rotation.set(pose[1], pose[2], pose[3]);
        piece.scale.setScalar(0.92);
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
    // Resting fruit casts a small contact shadow that tightens as it lands.
    pieceShadows.forEach((blob, i) => {
      blob.visible = mode === 'hero';
      if (!blob.visible) return;
      const piece = pieces[i],
        size = heroLayout[i][6] * (1 + (piece.position.y - heroLayout[i][1]) * 0.8);
      blob.position.set(piece.position.x, -1.008 + i * 0.001, piece.position.z);
      blob.scale.set(size, 1, size * 0.72);
    });
    ice.forEach((cube) => (cube.visible = mode !== 'story' || fill > 0.9));
    canvas.dataset.looseObjects = '0';
    if (isCoffee) {
      const pour = ease((progress - 1 / 3) * 3),
        coffeeFinish = ease((progress - 2 / 3) * 3);
      const coffeeFill = mode === 'coffee' ? pour : 1;
      espressoFill(Math.max(0.001, coffeeFill));
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
      const surfaceRadius = 0.47 + (surface + 0.57) / 5.6 - 0.02;
      crema.scale.set(surfaceRadius, 1, surfaceRadius);
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
    if (storyMode || isCoffee) {
      const panel = isCoffee ? coffeeSleeve : sleeve;
      panel.updateWorldMatrix(true, false);
      camera.updateMatrixWorld(true);
      const centre = new Vector3(0, 0, isCoffee ? 0.6275 : 0.5695)
        .applyMatrix4(panel.matrixWorld)
        .project(camera);
      canvas.dataset.labelCentreX = (((centre.x + 1) * canvas.clientWidth) / 2).toFixed(2);
      canvas.dataset.labelScene = mode;
      canvas.dataset.finalYaw = String(isCoffee ? coffee.rotation.y : cup.rotation.y);
      canvas.dataset.lidOn = String(storyMode && finish === 1 && lid.position.y === 1.06);
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
  // Capture-only sleeve masks let build-time themes recolour fallback posters
  // without tinting fruit, beans or ceramics. No extra pass runs for visitors.
  function posterMask(kind: 'sleeve' | 'text') {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = labelCanvas.width;
    maskCanvas.height = labelCanvas.height;
    const ctx = maskCanvas.getContext('2d')!;
    const pixels = context.getImageData(0, 0, 2048, 512);
    const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const bg = rgb(sleeveColour),
      fg = rgb(labelColour);
    const channel = bg
      .map((v, i) => Math.abs(v - fg[i]))
      .indexOf(Math.max(...bg.map((v, i) => Math.abs(v - fg[i]))));
    for (let i = 0; i < pixels.data.length; i += 4) {
      const text = clamp((pixels.data[i + channel] - bg[channel]) / (fg[channel] - bg[channel]));
      const value = (kind === 'text' ? text : 1 - text) * 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    }
    ctx.putImageData(pixels, 0, 0);
    const maskTexture = new CanvasTexture(maskCanvas);
    maskTexture.colorSpace = SRGBColorSpace;
    const black = new MeshBasicMaterial({ color: '#000000' });
    const white = new MeshBasicMaterial({
      color: kind === 'text' ? '#000000' : '#ffffff',
      side: DoubleSide,
    });
    const mapped = new MeshBasicMaterial({ map: maskTexture, side: DoubleSide });
    const saved: [Mesh, Material | Material[]][] = [];
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        saved.push([node, node.material]);
        node.material =
          node === sleeve || node === coffeeSleeve
            ? mapped
            : node === backSleeve || node === coffeeSleeveBack || node === straw
              ? white
              : black;
      }
    });
    const background = scene.background;
    const toneMapping = renderer.toneMapping;
    scene.background = new Color('#000000');
    renderer.toneMapping = 0;
    renderer.render(scene, camera);
    scene.background = background;
    renderer.toneMapping = toneMapping;
    for (const [node, material] of saved) node.material = material;
    maskTexture.dispose();
    black.dispose();
    white.dispose();
    mapped.dispose();
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
    materials.forEach((material) => {
      (material as MeshStandardMaterial).map?.dispose();
      material.dispose();
    });
    reflections.dispose();
    glaze.dispose();
    texture.dispose();
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
  return { name, mix, render, resize, dispose, canvas, prepare, prepareCoffee, posterMask };
}
