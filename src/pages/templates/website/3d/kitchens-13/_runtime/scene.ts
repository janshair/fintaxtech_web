// Plinth & Plumb: a small architectural-model kitchen (and bathroom), built
// entirely in code. No models, textures or HDRIs are downloaded: materials are
// flat colours or canvas drawings, reflections come from three.js's own
// procedural RoomEnvironment.
import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { doors, taps, type Spec } from '../../../../../../content/kitchens-demo';

export type Room = 'kitchen' | 'bathroom';
const METAL: Record<Spec['tap'], { metalness: number; roughness: number }> = {
  brass: { metalness: 1, roughness: 0.3 },
  chrome: { metalness: 1, roughness: 0.08 },
  steel: { metalness: 1, roughness: 0.38 },
  black: { metalness: 0.55, roughness: 0.45 },
};
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
const W = 4.4,
  D = 3.4,
  WALL = 2.5,
  T = 0.1;
// Centre and radius of the whole model, for framing.
const CENTRE = new Vector3(0, 0.95, 0);
const RADIUS = 3.15;

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
function drawn(draw: (g: CanvasRenderingContext2D, s: number) => void, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

export async function createKitchenScene(
  canvas: HTMLCanvasElement,
  { mobile, ink }: { mobile: boolean; ink: string },
) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = PCFShadowMap;
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.32;
  const camera = new PerspectiveCamera(22, 1, 0.5, 60);
  const sun = new DirectionalLight('#fff4e4', 2.8);
  sun.position.set(-3.5, 6, 4.5);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun, new HemisphereLight('#f4f6f8', '#b9b0a2', 0.55));

  const disposables: { dispose(): void }[] = [environment];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const std = (o: ConstructorParameters<typeof MeshStandardMaterial>[0]) =>
    keep(new MeshStandardMaterial({ roughness: 0.6, ...o }));
  const inkColour = new Color(ink);

  // Materials that the builder changes.
  const oakMap = keep(
    drawn((g, s) => {
      g.fillStyle = '#b98a5c';
      g.fillRect(0, 0, s, s);
      const r = seeded(7);
      for (let i = 0; i < 90; i++) {
        g.strokeStyle = `rgba(${90 + r() * 40},${55 + r() * 25},30,${0.12 + r() * 0.18})`;
        g.lineWidth = 1 + r() * 3;
        const y = r() * s;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 20, s * 0.7, y + (r() - 0.5) * 20, s, y);
        g.stroke();
      }
    }),
  );
  const terrazzoMap = keep(
    drawn((g, s) => {
      g.fillStyle = '#efe9e1';
      g.fillRect(0, 0, s, s);
      const r = seeded(11);
      const chips = ['#d9826b', '#2b48d8', '#8fa58c', '#c9a45c', '#9aa1a6'];
      for (let i = 0; i < 420; i++) {
        g.fillStyle = chips[i % chips.length];
        g.beginPath();
        const x = r() * s,
          y = r() * s,
          k = 2 + r() * 7;
        g.moveTo(x, y);
        for (let j = 0; j < 5; j++) g.lineTo(x + (r() - 0.5) * k * 2, y + (r() - 0.5) * k * 2);
        g.fill();
      }
    }),
  );
  const tiles = (colour: string, line: string, n: number) =>
    keep(
      drawn((g, s) => {
        g.fillStyle = colour;
        g.fillRect(0, 0, s, s);
        g.strokeStyle = line;
        g.lineWidth = 3;
        for (let i = 0; i <= n; i++) {
          g.beginPath();
          g.moveTo((i * s) / n, 0);
          g.lineTo((i * s) / n, s);
          g.stroke();
          g.beginPath();
          g.moveTo(0, (i * s) / n);
          g.lineTo(s, (i * s) / n);
          g.stroke();
        }
      }),
    );
  const floorMap = tiles('#cfc8bb', 'rgba(80,70,60,0.22)', 4);
  floorMap.repeat.set(2.2, 1.7);
  const wallTiles = tiles('#e9ebe8', 'rgba(70,80,85,0.2)', 8);
  wallTiles.repeat.set(3, 1);
  const WORKTOP: Record<Spec['top'], { color: string; roughness: number; map?: CanvasTexture }> = {
    oak: { color: '#ffffff', roughness: 0.55, map: oakMap },
    quartz: { color: '#f1efea', roughness: 0.2 },
    oat: { color: '#e3d9c6', roughness: 0.3 },
    slate: { color: '#2c3033', roughness: 0.45 },
    terrazzo: { color: '#ffffff', roughness: 0.3, map: terrazzoMap },
  };
  const mats = {
    floor: std({ map: floorMap, roughness: 0.75 }),
    wall: std({ color: '#e6e3dc', roughness: 0.95 }),
    tiles: std({ map: wallTiles, roughness: 0.4 }),
    cut: std({ color: inkColour, roughness: 0.9 }),
    carcass: std({ color: '#ece8e1' }),
    plinth: std({ color: '#3a3f43' }),
    door: std({ color: '#8fa58c', roughness: 0.45 }),
    top: std({ color: '#f1efea' }),
    metal: std({ color: '#c9a45c', metalness: 1, roughness: 0.3 }),
    glass: std({ color: '#1a1d1f', roughness: 0.12, metalness: 0.2 }),
    sink: std({ color: '#55595c', metalness: 0.7, roughness: 0.3 }),
    oak: std({ map: oakMap, roughness: 0.55 }),
    ceramic: std({ color: '#f7f6f2', roughness: 0.25 }),
    shade: std({ color: '#f3efe6', roughness: 0.5, side: DoubleSide }),
    screen: std({ color: '#dfe9ec', roughness: 0.05, transparent: true, opacity: 0.28 }),
    mirror: std({ color: '#c9d3d6', roughness: 0.05, metalness: 0.9 }),
    bulb: keep(new MeshBasicMaterial({ color: '#fff3d6' })),
    window: keep(new MeshBasicMaterial({ color: '#dfe8ec' })),
  };
  const geometry = new Map<string, BufferGeometry>();
  const cached = (key: string, make: () => BufferGeometry) => {
    if (!geometry.has(key)) geometry.set(key, make());
    return geometry.get(key)!;
  };
  const boxGeo = (w: number, h: number, d: number) =>
    cached(`b${w}|${h}|${d}`, () => new BoxGeometry(w, h, d));
  function box(
    w: number,
    h: number,
    d: number,
    mat: Material,
    x: number,
    y: number,
    z: number,
    parent: Object3D,
    shadow = true,
  ) {
    const m = new Mesh(boxGeo(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow && !mobile;
    m.receiveShadow = !mobile;
    parent.add(m);
    return m;
  }
  const seg = mobile ? 12 : 20;

  const model = new Group();
  scene.add(model);
  // The room: floor slab and two walls with charcoal "cut" edges, like an architect's model.
  const shell = new Group();
  model.add(shell);
  const floor = box(W, 0.14, D, mats.floor, 0, -0.07, 0, shell, false);
  box(W + 0.002, 0.03, D + 0.002, mats.cut, 0, -0.155, 0, shell, false);
  box(W, WALL, T, mats.wall, 0, WALL / 2, -D / 2 + T / 2, shell);
  box(W, 0.02, T + 0.002, mats.cut, 0, WALL + 0.01, -D / 2 + T / 2, shell, false);
  box(T, WALL, D - T, mats.wall, -W / 2 + T / 2, WALL / 2, T / 2, shell, false);
  box(T + 0.002, 0.02, D - T, mats.cut, -W / 2 + T / 2, WALL + 0.01, T / 2, shell, false);
  box(0.02, 0.9, 1.1, mats.window, -W / 2 + T + 0.005, 1.55, 0.5, shell, false);
  box(0.05, 0.05, 1.2, mats.oak, -W / 2 + T + 0.02, 1.08, 0.5, shell);

  // Exploded-view groups. Each part is parented to one of these.
  type Part = 'carcass' | 'doors' | 'tops' | 'fittings';
  const makeParts = () =>
    Object.fromEntries(
      (['carcass', 'doors', 'tops', 'fittings'] as Part[]).map((k) => [k, new Group()]),
    ) as Record<Part, Group>;

  // Doors are rebuilt when the door style or handle changes.
  const doorSlots: Group[] = [];
  function slot(parent: Group, w: number, h: number, x: number, y: number, z: number, ry = 0) {
    const g = new Group();
    g.userData = { w, h };
    g.position.set(x, y, z);
    g.rotation.y = ry;
    parent.add(g);
    doorSlots.push(g);
    return g;
  }
  function buildDoor(g: Group, style: Spec['doorStyle'], handle: Spec['handle']) {
    g.clear();
    const { w, h } = g.userData as { w: number; h: number };
    const t = 0.02;
    if (style === 'shaker') {
      const f = 0.07;
      box(w, f, t, mats.door, 0, h / 2 - f / 2, 0, g);
      box(w, f, t, mats.door, 0, -h / 2 + f / 2, 0, g);
      box(f, h - 2 * f, t, mats.door, -w / 2 + f / 2, 0, 0, g);
      box(f, h - 2 * f, t, mats.door, w / 2 - f / 2, 0, 0, g);
      box(w - 2 * f, h - 2 * f, t * 0.5, mats.door, 0, 0, -t * 0.25, g);
    } else box(w, h, t, mats.door, 0, 0, 0, g);
    const hy = h / 2 - 0.08;
    if (handle === 'bar') {
      const length = Math.min(0.28, w * 0.6);
      const bar = new Mesh(
        cached(`bar${length}`, () => new CylinderGeometry(0.008, 0.008, length, 8)),
        mats.metal,
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, hy, 0.045);
      g.add(bar);
      for (const s of [-1, 1])
        box(0.012, 0.012, 0.035, mats.metal, s * Math.min(0.12, w * 0.26), hy, 0.025, g, false);
    } else if (handle === 'cup') {
      const cup = new Mesh(
        cached('cup', () => new CylinderGeometry(0.035, 0.035, 0.03, 14, 1, false, 0, Math.PI)),
        mats.metal,
      );
      cup.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      cup.position.set(0, hy, 0.02);
      g.add(cup);
    } else if (handle === 'knob') {
      const knob = new Mesh(
        cached('knob', () => new SphereGeometry(0.022, 14, 10)),
        mats.metal,
      );
      knob.position.set(0, hy, 0.04);
      g.add(knob);
    } else box(w * 0.98, 0.018, 0.01, mats.plinth, 0, h / 2 + 0.005, 0, g, false);
  }
  function tapMesh() {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0, 0.3, 0),
      new Vector3(0, 0.38, 0.08),
      new Vector3(0, 0.3, 0.17),
    ]);
    const tap = new Mesh(
      cached('tap', () => new TubeGeometry(curve, 20, 0.014, 8)),
      mats.metal,
    );
    tap.castShadow = !mobile;
    return tap;
  }

  // KITCHEN
  const kitchen = new Group();
  model.add(kitchen);
  const kp = makeParts();
  Object.values(kp).forEach((g) => kitchen.add(g));
  const backZ = -D / 2 + T + 0.3;
  const baseH = 0.78,
    plinthH = 0.1,
    topY = plinthH + baseH + 0.02;
  for (const x of [-1.85, -1.25, -0.65, -0.05, 0.55]) {
    box(0.6, baseH, 0.56, mats.carcass, x + 0.3, plinthH + baseH / 2, backZ - 0.02, kp.carcass);
    box(0.6, plinthH, 0.5, mats.plinth, x + 0.3, plinthH / 2, backZ - 0.04, kp.carcass);
    slot(kp.doors, 0.592, baseH - 0.01, x + 0.3, plinthH + baseH / 2, backZ + 0.27);
  }
  box(0.62, 2.2, 0.58, mats.carcass, 1.5, 1.1, backZ - 0.01, kp.carcass);
  for (const [y, h] of [
    [0.55, 0.9],
    [1.47, 0.46],
    [2.0, 0.42],
  ])
    slot(kp.doors, 0.6, h - 0.01, 1.5, y, backZ + 0.29);
  box(0.52, 0.4, 0.02, mats.glass, 1.5, 1.24, backZ + 0.3, kp.fittings);
  box(3.05, 0.04, 0.62, mats.top, -0.025, topY, backZ, kp.tops);
  box(0.5, 0.012, 0.36, mats.sink, -0.95, topY + 0.021, backZ + 0.02, kp.fittings, false);
  const kTap = tapMesh();
  kTap.position.set(-0.95, topY + 0.02, backZ - 0.2);
  kp.fittings.add(kTap);
  box(0.56, 0.008, 0.5, mats.glass, 0.25, topY + 0.024, backZ, kp.fittings, false);
  const wallY = 1.62,
    wallH = 0.66;
  for (const x of [-1.85, -1.25]) {
    box(0.6, wallH, 0.32, mats.carcass, x + 0.3, wallY + wallH / 2, -D / 2 + T + 0.16, kp.carcass);
    slot(kp.doors, 0.592, wallH - 0.01, x + 0.3, wallY + wallH / 2, -D / 2 + T + 0.33);
  }
  box(1.15, 0.04, 0.24, mats.oak, 0.2, 1.75, -D / 2 + T + 0.12, kp.fittings);
  const jar = cached('jar', () => new CylinderGeometry(0.05, 0.05, 0.16, seg));
  ['#d9826b', '#f7f6f2', '#8fa58c'].forEach((c, i) => {
    const m = new Mesh(jar, i === 1 ? mats.ceramic : std({ color: c, roughness: 0.4 }));
    m.position.set([-0.2, -0.06, 0.32][i] + 0.2, 1.85, -D / 2 + T + 0.12);
    m.castShadow = !mobile;
    kp.fittings.add(m);
  });
  // Island with waterfall ends and stools.
  const island = new Vector3(-0.15, 0, 0.55);
  box(1.8, 0.86, 0.86, mats.carcass, island.x, 0.45, island.z, kp.carcass);
  for (const x of [-0.6, 0, 0.6])
    slot(kp.doors, 0.592, 0.76, island.x + x, 0.48, island.z - 0.44, Math.PI);
  box(2.0, 0.04, 0.96, mats.top, island.x, 0.92, island.z, kp.tops);
  box(0.04, 0.9, 0.96, mats.top, island.x - 0.98, 0.45, island.z, kp.tops);
  box(0.04, 0.9, 0.96, mats.top, island.x + 0.98, 0.45, island.z, kp.tops);
  const legMat = std({ color: inkColour, metalness: 0.5, roughness: 0.4 });
  for (const x of [-0.45, 0.35]) {
    const seat = new Mesh(
      cached('seat', () => new CylinderGeometry(0.17, 0.17, 0.05, seg)),
      mats.oak,
    );
    seat.position.set(island.x + x, 0.72, island.z + 0.68);
    const leg = new Mesh(
      cached('leg', () => new CylinderGeometry(0.018, 0.018, 0.7, 8)),
      legMat,
    );
    leg.position.set(island.x + x, 0.35, island.z + 0.68);
    seat.castShadow = leg.castShadow = !mobile;
    kp.fittings.add(seat, leg);
  }
  // Oak beam from the side wall carries the pendant lights.
  box(3.2, 0.1, 0.12, mats.oak, -W / 2 + T + 1.6, 2.4, 0.55, kp.fittings);
  const shadePoints: Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI * 0.5;
    shadePoints.push(new Vector2(Math.sin(a) * 0.16 + 0.01, Math.cos(a) * 0.12));
  }
  for (const x of [-0.65, 0, 0.65]) {
    const g = new Group();
    g.position.set(island.x + x, 1.78, island.z);
    const cord = new Mesh(
      cached('cord', () => new CylinderGeometry(0.004, 0.004, 0.5, 5)),
      mats.plinth,
    );
    cord.position.y = 0.36;
    const shade = new Mesh(
      cached('shade', () => new LatheGeometry(shadePoints, seg)),
      mats.shade,
    );
    shade.castShadow = !mobile;
    const bulb = new Mesh(
      cached('bulb', () => new SphereGeometry(0.04, 10, 6)),
      mats.bulb,
    );
    bulb.position.y = -0.02;
    g.add(cord, shade, bulb);
    kp.fittings.add(g);
  }

  // BATHROOM: a wall-hung vanity, mirror, walk-in shower and towel rail.
  const bathroom = new Group();
  model.add(bathroom);
  const bp = makeParts();
  Object.values(bp).forEach((g) => bathroom.add(g));
  box(W - T - 0.02, 1.25, 0.02, mats.tiles, T / 2, 0.625, -D / 2 + T + 0.011, bp.fittings, false);
  const vx = -0.35,
    vz = -D / 2 + T + 0.25,
    vy = 0.62;
  box(1.2, 0.5, 0.46, mats.carcass, vx, vy, vz - 0.01, bp.carcass);
  for (const x of [-0.3, 0.3]) slot(bp.doors, 0.592, 0.48, vx + x, vy, vz + 0.23);
  box(1.24, 0.04, 0.5, mats.top, vx, vy + 0.27, vz, bp.tops);
  const bowlPoints = [0, 0.4, 0.8, 1].map(
    (t) => new Vector2(0.06 + Math.sin((t * Math.PI) / 2) * 0.16, t * 0.13),
  );
  bowlPoints.unshift(new Vector2(0.001, 0));
  const bowl = new Mesh(
    cached('bowl', () => new LatheGeometry(bowlPoints, seg * 2)),
    mats.ceramic,
  );
  bowl.position.set(vx, vy + 0.29, vz + 0.02);
  bowl.castShadow = !mobile;
  bp.fittings.add(bowl);
  const bTap = tapMesh();
  bTap.scale.setScalar(0.9);
  bTap.position.set(vx, vy + 0.29, vz - 0.17);
  bp.fittings.add(bTap);
  // Round mirror with a metal rim in the tap finish.
  const mirror = new Mesh(
    cached('mirror', () => new CylinderGeometry(0.34, 0.34, 0.02, seg * 2)),
    mats.mirror,
  );
  mirror.rotation.x = Math.PI / 2;
  mirror.position.set(vx, 1.65, -D / 2 + T + 0.03);
  const rim = new Mesh(
    cached('rim', () => new TorusGeometry(0.345, 0.018, 8, seg * 2)),
    mats.metal,
  );
  rim.position.copy(mirror.position).add(new Vector3(0, 0, 0.01));
  bp.fittings.add(mirror, rim);
  // Shower: tray, glass screen with a metal top bar, overhead rose.
  const sx = 1.35;
  box(1.2, 0.05, 1.0, mats.ceramic, sx, 0.025, -D / 2 + T + 0.5, bp.carcass);
  const screen = new Mesh(boxGeo(0.012, 1.9, 0.9), mats.screen);
  screen.position.set(sx - 0.6, 1.0, -D / 2 + T + 0.55);
  bp.fittings.add(screen);
  box(0.02, 0.02, 0.9, mats.metal, sx - 0.6, 1.95, -D / 2 + T + 0.55, bp.fittings);
  box(0.02, 1.9, 0.02, mats.metal, sx - 0.6, 1.0, -D / 2 + T + 1.0, bp.fittings);
  const arm = box(0.02, 0.02, 0.35, mats.metal, sx, 2.05, -D / 2 + T + 0.18, bp.fittings);
  arm.castShadow = false;
  const rose = new Mesh(
    cached('rose', () => new CylinderGeometry(0.13, 0.13, 0.02, seg * 2)),
    mats.metal,
  );
  rose.position.set(sx, 2.03, -D / 2 + T + 0.36);
  bp.fittings.add(rose);
  // Towel rail on the side wall, a folded towel and a plant.
  for (const y of [1.0, 1.2])
    box(0.02, 0.02, 0.6, mats.metal, -W / 2 + T + 0.07, y, 0.4, bp.fittings, false);
  box(
    0.04,
    0.32,
    0.4,
    std({ color: '#d9826b', roughness: 0.9 }),
    -W / 2 + T + 0.09,
    1.08,
    0.4,
    bp.fittings,
  );
  const pot = new Mesh(
    cached('pot', () => new CylinderGeometry(0.12, 0.09, 0.24, seg)),
    mats.ceramic,
  );
  pot.position.set(-1.6, 0.12, 0.9);
  const leaves = new Mesh(
    cached('leaves', () => new SphereGeometry(0.22, seg, 10)),
    std({ color: '#6f8f69', roughness: 0.8 }),
  );
  leaves.position.set(-1.6, 0.42, 0.9);
  leaves.scale.set(1, 1.2, 1);
  pot.castShadow = leaves.castShadow = !mobile;
  bp.fittings.add(pot, leaves);

  // State
  let spec: Spec = { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' };
  let built = '';
  const doorTarget = new Color('#8fa58c');
  const metalTarget = new Color('#c9a45c');
  const metalFeel = { ...METAL.brass };
  let room: Room = 'kitchen',
    roomMix = 0,
    explode = 0,
    pop = 1;
  const view = { azimuth: 0.62, elevation: 0.42, zoom: 1 };
  const rect = { left: 0, top: 0, width: 1, height: 1 };
  let vw = 1,
    vh = 1;

  function applySpec(next: Spec, instant = false) {
    const shape = next.doorStyle + next.handle;
    if (shape !== built) {
      doorSlots.forEach((g) => buildDoor(g, next.doorStyle, next.handle));
      built = shape;
      pop = instant ? 1 : 0.94;
    }
    doorTarget.set(doors.find((d) => d.id === next.door)!.hex);
    metalTarget.set(taps.find((t) => t.id === next.tap)!.hex);
    Object.assign(metalFeel, METAL[next.tap]);
    const top = WORKTOP[next.top];
    if (mats.top.map !== (top.map || null)) {
      mats.top.map = top.map || null;
      mats.top.needsUpdate = true;
    }
    mats.top.color.set(top.color);
    mats.top.roughness = top.roughness;
    if (instant) {
      mats.door.color.copy(doorTarget);
      mats.metal.color.copy(metalTarget);
      Object.assign(mats.metal, metalFeel);
    }
    spec = next;
  }
  applySpec(spec, true);

  function resize(width: number, height: number, dpr: number) {
    vw = width;
    vh = height;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
  }
  // Frame the model inside an HTML box: the canvas covers the viewport and the
  // camera's view offset puts the model's picture exactly in that box.
  function frame(box: { left: number; top: number; width: number; height: number }) {
    // DOMRect fields are getters, so copy them one by one.
    rect.left = box.left;
    rect.top = box.top;
    rect.width = box.width;
    rect.height = box.height;
  }
  function placeCamera() {
    const aspect = rect.width / Math.max(1, rect.height);
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const fit = 0.8 / view.zoom;
    const distance = (RADIUS * fit) / (tan * Math.min(1, aspect));
    const { azimuth: a, elevation: e } = view;
    camera.position.set(
      CENTRE.x + Math.sin(a) * Math.cos(e) * distance,
      CENTRE.y + Math.sin(e) * distance,
      CENTRE.z + Math.cos(a) * Math.cos(e) * distance,
    );
    camera.lookAt(CENTRE);
    camera.aspect = aspect;
    camera.setViewOffset(rect.width, rect.height, -rect.left, -rect.top, vw, vh);
    camera.updateProjectionMatrix();
  }

  function setGroup(parts: Record<Part, Group>, amount: number, visible: number) {
    // Doors swing forward, worktops lift, fittings lift higher; carcasses stay.
    parts.doors.position.set(0, amount * -0.05, amount * 1.05);
    parts.tops.position.set(0, amount * 0.42, 0);
    parts.fittings.position.set(0, amount * 0.82, amount * 0.1);
    parts.carcass.position.set(0, 0, 0);
    const group = parts.doors.parent!;
    group.visible = visible > 0.01;
    group.scale.set(1, Math.max(0.001, visible), 1);
  }

  let time = 0;
  function update(dt: number) {
    time += dt;
    let busy = false;
    const lerp = 1 - Math.exp(-dt * 7);
    const before = mats.door.color.getHex() + mats.metal.color.getHex();
    mats.door.color.lerp(doorTarget, lerp);
    mats.metal.color.lerp(metalTarget, lerp);
    mats.metal.metalness = damp(mats.metal.metalness, metalFeel.metalness, 7, dt);
    mats.metal.roughness = damp(mats.metal.roughness, metalFeel.roughness, 7, dt);
    if (mats.door.color.getHex() + mats.metal.color.getHex() !== before) busy = true;
    const roomTarget = room === 'bathroom' ? 1 : 0;
    roomMix = damp(roomMix, roomTarget, 6, dt);
    if (Math.abs(roomMix - roomTarget) < 0.002) roomMix = roomTarget;
    else busy = true;
    pop = damp(pop, 1, 10, dt);
    if (1 - pop > 0.002) busy = true;
    else pop = 1;
    // The outgoing room sinks into the floor while the other rises.
    const kitchenShow = Math.min(1, Math.max(0, 1 - roomMix * 2));
    const bathShow = Math.min(1, Math.max(0, roomMix * 2 - 1));
    setGroup(kp, explode, kitchenShow);
    setGroup(bp, explode, bathShow);
    kp.doors.scale.setScalar(pop);
    bp.doors.scale.setScalar(pop);
    placeCamera();
    return busy;
  }

  const tmp = new Vector3();
  const bounds = new Box3();
  // Screen positions (CSS px) for the four exploded-view labels, top to bottom.
  function layerPoints() {
    const parts = room === 'bathroom' ? bp : kp;
    model.updateMatrixWorld(true);
    return (['fittings', 'tops', 'doors', 'carcass'] as Part[]).map((name) => {
      bounds.setFromObject(parts[name]);
      bounds.getCenter(tmp);
      tmp.x = bounds.max.x;
      tmp.project(camera);
      return { x: ((tmp.x + 1) / 2) * vw, y: ((1 - tmp.y) / 2) * vh };
    });
  }
  // Line drawing of the model from the current camera, for the loader SVG.
  function drawing() {
    model.updateMatrixWorld(true);
    const out: { y: number; points: number[] }[] = [];
    const a = new Vector3(),
      b = new Vector3();
    kitchen.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh || mesh.geometry.type === 'TubeGeometry') return;
      const edges = new EdgesGeometry(mesh.geometry, 25);
      const p = edges.attributes.position;
      const points: number[] = [];
      for (let i = 0; i < p.count; i += 2) {
        a.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld).project(camera);
        b.fromBufferAttribute(p, i + 1)
          .applyMatrix4(mesh.matrixWorld)
          .project(camera);
        points.push(
          ((a.x + 1) / 2) * vw,
          ((1 - a.y) / 2) * vh,
          ((b.x + 1) / 2) * vw,
          ((1 - b.y) / 2) * vh,
        );
      }
      edges.dispose();
      out.push({ y: new Box3().setFromObject(mesh).min.y, points });
    });
    return out;
  }

  return {
    view,
    resize,
    frame,
    update,
    layerPoints,
    drawing,
    setSpec: (next: Spec, instant = false) => applySpec(next, instant),
    setRoom(next: Room, instant = false) {
      room = next;
      if (instant) roomMix = next === 'bathroom' ? 1 : 0;
    },
    setExplode(amount: number) {
      explode = amount;
    },
    // Hidden when no model box is on screen, so a stale frame never lingers.
    show(visible: boolean) {
      model.visible = visible;
    },
    render: () => renderer.render(scene, camera),
    prepare: () => renderer.compileAsync(scene, camera),
    dispose() {
      disposables.forEach((d) => d.dispose());
      geometry.forEach((g) => g.dispose());
      renderer.dispose();
    },
  };
}
export type KitchenScene = Awaited<ReturnType<typeof createKitchenScene>>;
