// Tumble Cup: one cartoon cup, built entirely in code. No models, textures or
// HDRIs are downloaded. The camera is orthographic in CSS pixels, so the page
// can place the cup over any HTML box by passing that box's position and size.
import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  Object3D,
  OrthographicCamera,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  CircleGeometry,
  ConeGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Band = { colour: string; height: number };
export type Look = {
  lid: boolean;
  straw: boolean;
  sleeve: boolean;
  orbit: boolean;
  explode: number;
};
export type BoostKind = 'mint' | 'lime' | 'vanilla' | 'cinnamon';
export type FruitKind =
  'mango' | 'strawberry' | 'banana' | 'spinach' | 'ginger' | 'pineapple' | 'blueberry' | BoostKind;

// Cup units: the cup is H tall. The page converts units to pixels.
export const H = 2.5;
const R0 = 0.74,
  R1 = 1.0,
  INSET = 0.06,
  FLOOR = 0.07;
const radiusAt = (y: number) => R0 + (R1 - R0) * (y / H);
const MAX_BANDS = 6;

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

export async function createCupScene(
  canvas: HTMLCanvasElement,
  { mobile, ink, accent }: { mobile: boolean; ink: string; accent: string },
) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !mobile || devicePixelRatio < 2,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 4000);
  camera.position.set(0, 0, 2000);
  scene.add(new AmbientLight('#ffffff', 1.45));
  const key = new DirectionalLight('#ffffff', 2.1);
  key.position.set(-0.6, 0.9, 1);
  scene.add(key);
  const inkColour = new Color(ink);

  // Three-step toon ramp, shared by every solid.
  const ramp = new DataTexture(
    new Uint8Array([140, 140, 140, 255, 205, 205, 205, 255, 255, 255, 255, 255]),
    3,
    1,
    RGBAFormat,
  );
  ramp.minFilter = ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;
  const disposables: { dispose(): void }[] = [ramp];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const toon = (colour: string, extra: Record<string, unknown> = {}) =>
    keep(new MeshToonMaterial({ color: new Color(colour), gradientMap: ramp, ...extra }));
  const hull = keep(new MeshBasicMaterial({ color: inkColour, side: BackSide }));
  // A back-face shell in ink gives the cartoon outline without post-processing.
  function outlined(geometry: BufferGeometry, material: Material | Material[], width = 0.035) {
    keep(geometry);
    const group = new Group();
    geometry.computeBoundingSphere();
    const shell = new Mesh(geometry, hull);
    shell.scale.setScalar(1 + width / (geometry.boundingSphere!.radius || 1));
    group.add(shell, new Mesh(geometry, material));
    return group;
  }

  // Root follows the page; `cup` holds everything that tilts and spins.
  const rig = new Group();
  const cup = new Group();
  rig.add(cup);
  scene.add(rig);

  // Glass: a rim-lit shell. Its edge is the outline; its face stays clear.
  const wallPoints: Vector2[] = [];
  for (let i = 0; i <= 16; i++) wallPoints.push(new Vector2(radiusAt((i / 16) * H), (i / 16) * H));
  const glassMat = keep(
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { ink: { value: inkColour }, opacity: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 ink; uniform float opacity; varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){
          float f = 1. - abs(dot(normalize(vN), vec3(0.,0.,1.)));
          float edge = smoothstep(.80,.87,f);
          float shine = smoothstep(-.64,-.58, vN.x) * (1. - smoothstep(-.48,-.42, vN.x)) * smoothstep(.3,.6, vY) * (1.-smoothstep(1.9,2.2, vY));
          vec3 c = mix(vec3(1.), ink, edge);
          gl_FragColor = vec4(c, (.13 + edge*.87 + shine*.45) * opacity);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const glass = new Mesh(keep(new LatheGeometry(wallPoints, mobile ? 40 : 64)), glassMat);
  glass.renderOrder = 10;
  cup.add(glass);
  const rim = outlined(new TorusGeometry(R1, 0.045, 8, mobile ? 40 : 64), toon('#fffdf6'), 0.02);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H;
  const base = outlined(
    new CylinderGeometry(R0 + 0.02, R0 + 0.02, 0.06, mobile ? 32 : 48),
    toon('#fffdf6'),
    0.02,
  );
  base.position.y = 0.03;
  cup.add(rim, base);

  // Liquid: one lathe whose vertices above `level` collapse into the surface.
  // Colour bands are uniforms, so adding a layer never rebuilds geometry.
  const liquidPoints: Vector2[] = [
    new Vector2(0, FLOOR),
    new Vector2(radiusAt(FLOOR) - INSET, FLOOR),
  ];
  const rows = mobile ? 24 : 40;
  for (let i = 1; i <= rows; i++) {
    const y = FLOOR + ((H - FLOOR) * i) / rows;
    liquidPoints.push(new Vector2(radiusAt(y) - INSET, y));
  }
  for (const f of [0.8, 0.6, 0.4, 0.2])
    liquidPoints.push(new Vector2((radiusAt(H) - INSET) * f, H));
  liquidPoints.push(new Vector2(0.0001, H));
  const bandColours = Array.from({ length: MAX_BANDS }, () => new Color('#ffb029'));
  const liquidMat = keep(
    new ShaderMaterial({
      uniforms: {
        level: { value: 0.4 },
        wobble: { value: 0.02 },
        swirl: { value: 0 },
        time: { value: 0 },
        tops: { value: new Array(MAX_BANDS).fill(0) },
        colours: { value: bandColours },
        count: { value: 1 },
        light: { value: new Vector3(-0.45, 0.7, 0.55).normalize() },
      },
      vertexShader: `
        uniform float level; uniform float wobble; uniform float time; uniform float swirl;
        varying float vY; varying vec3 vN; varying float vSurface;
        float R(float y){ return ${R0.toFixed(3)} + ${(R1 - R0).toFixed(3)} * y / ${H.toFixed(3)} - ${INSET.toFixed(3)}; }
        void main(){
          vec3 p = position;
          float r0 = length(p.xz);
          float frac = r0 / R(p.y);
          float above = step(level - 0.0005, p.y);
          float y = min(p.y, level);
          vec2 dir = r0 > 0.00001 ? p.xz / r0 : vec2(0.);
          p.xz = dir * frac * R(y);
          float a = atan(dir.y, dir.x);
          float wave = sin(p.x * 3.1 + time * 2.3) + 0.7 * cos(p.z * 4.0 - time * 1.7) + swirl * sin(a * 2. + time * 9.);
          p.y = y + above * wobble * wave * (0.35 + 0.65 * frac);
          vY = y; vSurface = above;
          vN = normalize(normalMatrix * mix(normal, vec3(0.,1.,0.), above));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: `
        uniform float tops[${MAX_BANDS}]; uniform vec3 colours[${MAX_BANDS}]; uniform int count; uniform vec3 light;
        varying float vY; varying vec3 vN; varying float vSurface;
        void main(){
          vec3 c = colours[0];
          for (int i = 0; i < ${MAX_BANDS - 1}; i++) {
            if (i + 1 < count && vY > tops[i] - 0.0005) c = colours[i + 1];
          }
          if (vSurface > 0.5) c = colours[count - 1 < 0 ? 0 : count - 1] * 1.06;
          float l = dot(normalize(vN), light);
          float shade = l < -0.1 ? 0.74 : (l < 0.45 ? 0.88 : 1.0);
          gl_FragColor = vec4(c * shade, 1.);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const liquid = new Mesh(keep(new LatheGeometry(liquidPoints, mobile ? 36 : 56)), liquidMat);
  cup.add(liquid);

  // Lid and stripy straw.
  const lid = new Group();
  const dome: Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    dome.push(new Vector2(Math.cos(a) * (R1 + 0.06) + 0.0001, Math.sin(a) * 0.52));
  }
  lid.add(
    outlined(
      new LatheGeometry(dome, mobile ? 36 : 48),
      toon('#fffdf6', { transparent: true, opacity: 0.9 }),
      0.03,
    ),
  );
  const lidRing = outlined(
    new TorusGeometry(R1 + 0.06, 0.07, 8, mobile ? 40 : 64),
    toon('#fffdf6'),
    0.02,
  );
  lidRing.rotation.x = Math.PI / 2;
  lid.add(lidRing);
  lid.position.y = H;
  cup.add(lid);

  const stripes = document.createElement('canvas');
  stripes.width = 32;
  stripes.height = 128;
  const sg = stripes.getContext('2d')!;
  sg.fillStyle = '#fffdf6';
  sg.fillRect(0, 0, 32, 128);
  sg.fillStyle = accent;
  for (let y = -32; y < 160; y += 48) {
    sg.beginPath();
    sg.moveTo(0, y);
    sg.lineTo(32, y + 12);
    sg.lineTo(32, y + 32);
    sg.lineTo(0, y + 20);
    sg.fill();
  }
  const stripeTexture = keep(new CanvasTexture(stripes));
  stripeTexture.wrapS = stripeTexture.wrapT = RepeatWrapping;
  stripeTexture.repeat.set(1, 3);
  stripeTexture.colorSpace = SRGBColorSpace;
  const strawCurve = new CatmullRomCurve3([
    new Vector3(0.15, 0.4, 0),
    new Vector3(0.25, H + 0.5, 0),
    new Vector3(0.32, H + 1.2, 0),
    new Vector3(0.62, H + 1.55, 0.05),
  ]);
  const straw = outlined(
    new TubeGeometry(strawCurve, mobile ? 24 : 40, 0.085, 10),
    toon('#ffffff', { map: stripeTexture }),
    0.03,
  );
  cup.add(straw);

  // Sleeve with the business name, drawn on a canvas and redrawn on edits.
  const label = document.createElement('canvas');
  label.width = 2048;
  label.height = 512;
  const labelTexture = keep(new CanvasTexture(label));
  labelTexture.colorSpace = SRGBColorSpace;
  labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  function drawName(name: string) {
    const g = label.getContext('2d')!;
    g.fillStyle = accent;
    g.fillRect(0, 0, 2048, 512);
    g.fillStyle = '#fffdf6';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // Fit the name on the front panel: shrink, then trim whole words.
    let size = 150,
      text = name;
    const fits = () => {
      g.font = `${size}px "Bagel Fat One", "Arial Rounded MT Bold", sans-serif`;
      return g.measureText(text).width <= 660;
    };
    while (!fits() && size > 92) size -= 6;
    while (!fits() && text.includes(' ')) text = text.replace(/\s+\S+$/, '') + '…';
    if (!fits()) text = Array.from(text).slice(0, 12).join('') + '…';
    fits();
    for (const x of [1024, 0, 2048]) g.fillText(text, x, 266);
    g.font = '800 70px Figtree, sans-serif';
    for (const x of [512, 1536]) g.fillText('✳', x, 266);
    labelTexture.needsUpdate = true;
  }
  const sleevePoints: Vector2[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = 0.75 + (i / 4) * 0.85;
    sleevePoints.push(new Vector2(radiusAt(y) + 0.035, y));
  }
  const sleeve = outlined(
    new LatheGeometry(sleevePoints, mobile ? 40 : 64, -Math.PI, Math.PI * 2),
    toon('#ffffff', { map: labelTexture }),
    0.025,
  );
  cup.add(sleeve);

  // Fruit pieces: geometry and materials are built once per kind and shared.
  const fruitCache = new Map<FruitKind, Object3D>();
  function fruitModel(kind: FruitKind): Object3D {
    const g = new Group();
    if (kind === 'mango') {
      g.add(outlined(new RoundedBoxGeometry(0.42, 0.42, 0.42, 2, 0.1), toon('#ffa41b')));
    } else if (kind === 'strawberry') {
      const pts: Vector2[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        pts.push(
          new Vector2(Math.sin(Math.PI * t) * 0.26 * (0.55 + 0.45 * t) + 0.001, -0.3 + t * 0.6),
        );
      }
      g.add(outlined(new LatheGeometry(pts, 20), toon('#ee3b55')));
      const star = new Shape();
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2,
          r = i % 2 ? 0.1 : 0.25;
        if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.moveTo(r, 0);
      }
      const leafGeo = new ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false });
      leafGeo.rotateX(-Math.PI / 2);
      const leaf = outlined(leafGeo, toon('#2f9e44'), 0.02);
      leaf.position.y = 0.27;
      g.add(leaf);
      const seed = keep(new SphereGeometry(0.022, 5, 3));
      const seedMat = toon('#ffe27a');
      for (let i = 0; i < 12; i++) {
        const t = 0.15 + (i % 6) * 0.12;
        const y = -0.3 + t * 0.6,
          a = i * 2.39;
        const r = Math.sin(Math.PI * t) * 0.26 * (0.55 + 0.45 * t);
        const s = new Mesh(seed, seedMat);
        s.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        g.add(s);
      }
    } else if (kind === 'banana') {
      const face = toon('#fff3c4');
      g.add(outlined(new CylinderGeometry(0.27, 0.27, 0.11, 24), [toon('#f5cf3f'), face, face]));
      const dot = keep(new CircleGeometry(0.03, 6));
      const dotMat = toon('#c9a64a');
      for (let i = 0; i < 5; i++) {
        const d = new Mesh(dot, dotMat);
        const a = (i / 5) * Math.PI * 2;
        d.position.set(Math.cos(a) * 0.07, 0.057, Math.sin(a) * 0.07);
        d.rotation.x = -Math.PI / 2;
        g.add(d);
      }
    } else if (kind === 'spinach') {
      const s = new Shape();
      s.moveTo(0, -0.36);
      s.bezierCurveTo(0.34, -0.2, 0.3, 0.24, 0, 0.38);
      s.bezierCurveTo(-0.3, 0.24, -0.34, -0.2, 0, -0.36);
      const geo = new ExtrudeGeometry(s, {
        depth: 0.03,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.015,
        bevelSegments: 1,
      });
      geo.center();
      g.add(outlined(geo, toon('#2f9e44'), 0.025));
      g.add(new Mesh(keep(new BoxGeometry(0.018, 0.6, 0.07)), toon('#9ad27a')));
    } else if (kind === 'ginger') {
      const geo = new IcosahedronGeometry(0.24, 2);
      const p = geo.attributes.position;
      const v = new Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        v.multiplyScalar(
          1 + 0.18 * Math.sin(v.x * 11) * Math.cos(v.y * 9) + 0.25 * Math.max(0, v.x * 3),
        );
        p.setXYZ(i, v.x, v.y * 0.7, v.z);
      }
      geo.computeVertexNormals();
      g.add(outlined(geo, toon('#e7b36a'), 0.03));
    } else if (kind === 'pineapple') {
      const s = new Shape();
      s.moveTo(-0.28, -0.2);
      s.lineTo(0.28, -0.2);
      s.quadraticCurveTo(0.3, 0.12, 0, 0.3);
      s.quadraticCurveTo(-0.3, 0.12, -0.28, -0.2);
      const geo = new ExtrudeGeometry(s, {
        depth: 0.22,
        bevelEnabled: true,
        bevelSize: 0.04,
        bevelThickness: 0.04,
        bevelSegments: 2,
      });
      geo.center();
      g.add(outlined(geo, toon('#ffd43b')));
      const rind = outlined(
        new RoundedBoxGeometry(0.66, 0.1, 0.32, 1, 0.04),
        toon('#b7791f'),
        0.02,
      );
      rind.position.y = -0.27;
      const core = new Mesh(keep(new BoxGeometry(0.06, 0.32, 0.31)), toon('#fff0a8'));
      core.position.y = 0.05;
      g.add(rind, core);
    } else if (kind === 'mint') {
      // A sprig: three leaves fanned out.
      [
        [-0.2, 0.05, 0.6, 0.9],
        [0.2, 0.02, -0.55, 0.85],
        [0, 0.12, 0.05, 1],
      ].forEach(([x, z, roll, size]) => {
        const leaf = makeFruit('spinach');
        leaf.scale.setScalar(0.62 * size);
        leaf.rotation.set(-1.05, 0, roll);
        leaf.position.set(x, 0.1, z);
        g.add(leaf);
      });
    } else if (kind === 'lime') {
      // A lime wheel, face turned to the viewer.
      const flesh = toon('#d6ef8f');
      const wheel = outlined(
        new CylinderGeometry(0.34, 0.34, 0.07, 28),
        [toon('#4fa83a'), flesh, flesh],
        0.03,
      );
      const spoke = keep(new BoxGeometry(0.018, 0.012, 0.56));
      const pith = toon('#f3fbe0');
      for (let i = 0; i < 4; i++) {
        const m = new Mesh(spoke, pith);
        m.position.y = 0.04;
        m.rotation.y = (i / 4) * Math.PI;
        wheel.add(m);
      }
      wheel.rotation.set(1.15, 0, 0.18);
      wheel.position.y = 0.2;
      g.add(wheel);
    } else if (kind === 'vanilla') {
      // Two curved pods, crossed.
      const pod = new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-0.42, 0, 0),
          new Vector3(0, 0.07, 0),
          new Vector3(0.42, 0, 0),
        ]),
        16,
        0.045,
        8,
      );
      const podMat = toon('#4a2b1b');
      [
        [0.4, 0.06],
        [-0.45, -0.04],
      ].forEach(([yaw, z]) => {
        const m = outlined(pod, podMat, 0.025);
        m.rotation.set(0.5, yaw, 0);
        m.position.set(0, 0.08, z);
        g.add(m);
      });
    } else if (kind === 'cinnamon') {
      // Two rolled sticks, crossed.
      const stickGeo = new CylinderGeometry(0.075, 0.075, 0.86, 12);
      const face = toon('#c98a55');
      const bark = toon('#97542a');
      [
        [0.35, 0.08, 0.06],
        [-0.4, -0.06, 0.17],
      ].forEach(([yaw, z, y]) => {
        const stick = outlined(stickGeo, [bark, face, face], 0.025);
        stick.rotation.set(0.45, yaw, Math.PI / 2);
        stick.position.set(0, y, z);
        g.add(stick);
      });
    } else {
      g.add(outlined(new SphereGeometry(0.2, 16, 12), toon('#4f5fbf')));
      const crown = new Mesh(
        keep(new ConeGeometry(0.07, 0.06, 5, 1, true)),
        toon('#2a3478', { side: DoubleSide }),
      );
      crown.position.y = 0.2;
      crown.rotation.x = Math.PI;
      g.add(crown);
    }
    return g;
  }
  const makeFruit = (kind: FruitKind) => {
    if (!fruitCache.has(kind)) fruitCache.set(kind, fruitModel(kind));
    return fruitCache.get(kind)!.clone();
  };

  // Orbiting fruit for the hero and menu. Fewer pieces on phones.
  const orbitSlots = mobile
    ? [
        [-1.55, 2.6, 0.4],
        [1.6, 1.1, 0.5],
        [1.4, 3.3, -0.2],
      ]
    : [
        [-1.7, 3.0, 0.4],
        [1.85, 1.4, 0.6],
        [1.6, 3.4, -0.2],
        [-1.6, 0.9, 1],
        [-0.5, 4.3, -0.6],
      ];
  const orbit = new Group();
  rig.add(orbit);
  const orbitPieces = orbitSlots.map(([x, y, z], i) => {
    const holder = new Group();
    holder.position.set(x, y, z);
    holder.userData = { phase: i * 1.7, kind: '', next: '' as FruitKind | '', pop: 1 };
    orbit.add(holder);
    return holder;
  });

  // Layers moment: four parts that pull apart and snap back.
  const explodeRig = new Group();
  cup.add(explodeRig);
  const slab = (y0: number, y1: number, colour: string) => {
    const pts = [
      new Vector2(0.0001, -(y1 - y0) / 2),
      new Vector2(radiusAt(y0) - INSET, -(y1 - y0) / 2),
      new Vector2(radiusAt(y1) - INSET, (y1 - y0) / 2),
      new Vector2(0.0001, (y1 - y0) / 2),
    ];
    const mesh = outlined(new LatheGeometry(pts, mobile ? 36 : 56), toon(colour), 0.03);
    mesh.position.y = (y0 + y1) / 2;
    mesh.userData.home = mesh.position.y;
    return mesh;
  };
  const fruitSlab = slab(FLOOR, 0.95, '#ffb029');
  const baseSlab = slab(0.95, 1.62, '#f6e7a1');
  const boostSlab = slab(1.62, 1.86, '#9ad27a');
  explodeRig.add(fruitSlab, baseSlab, boostSlab);
  const explodeFruit = (['mango', 'strawberry'] as FruitKind[]).map((kind, i) => {
    const f = makeFruit(kind);
    f.position.set(i ? 1.25 : -1.25, 0.45, 0.3);
    explodeRig.add(f);
    return f;
  });
  const mint = (['spinach', 'spinach'] as FruitKind[]).map((kind, i) => {
    const f = makeFruit(kind);
    f.scale.setScalar(0.5);
    f.rotation.set(-1.2, i * 2, 0.3);
    f.position.set(i ? 0.3 : -0.35, 1.9, 0.2);
    explodeRig.add(f);
    return f;
  });

  // The chosen boost sits on the liquid surface once it has landed.
  const topping = new Group();
  topping.userData = { kind: '', pop: 0 };
  cup.add(topping);
  function setTopping(kind: BoostKind | '') {
    if (topping.userData.kind === kind) return;
    topping.clear();
    if (kind) topping.add(makeFruit(kind));
    topping.userData = { kind, pop: 0 };
  }

  // State
  let width = 1,
    height = 1;
  const pose = { x: 0, y: 0, scale: 100, spin: 0, tilt: 0.2, sway: 0, visible: 0 };
  const look: Look = { lid: true, straw: true, sleeve: true, orbit: true, explode: 0 };
  const shown = { lid: 1, straw: 1, sleeve: 1, orbit: 1 };
  type LiveBand = { colour: Color; target: Color; height: number; goal: number };
  let bands: LiveBand[] = [];
  let wobble = 0.02,
    swirl = 0,
    shake = 0;
  const flights: {
    obj: Object3D;
    from: Vector3;
    t: number;
    duration: number;
    land: () => void;
  }[] = [];

  function setBands(next: Band[], instant = false) {
    const out: LiveBand[] = [];
    next.slice(0, MAX_BANDS).forEach((b, i) => {
      const prev = bands[i];
      const target = new Color(b.colour);
      out.push({
        colour: prev && !instant ? prev.colour.clone() : target.clone(),
        target,
        height: prev && !instant ? prev.height : instant ? b.height : 0,
        goal: b.height,
      });
    });
    // Bands being removed drain rather than vanish.
    for (let i = next.length; i < bands.length && !instant; i++)
      out.push({ ...bands[i], goal: 0, target: bands[i].target });
    bands = out;
    wobble = Math.max(wobble, 0.07);
  }
  function setOrbit(kinds: FruitKind[]) {
    orbitPieces.forEach((holder, i) => {
      const kind = kinds[i % Math.max(1, kinds.length)] || 'mango';
      if (holder.userData.kind !== kind) holder.userData.next = kind;
    });
  }
  function fly(kind: FruitKind, fromX: number, fromY: number, land: () => void) {
    const obj = makeFruit(kind);
    scene.add(obj);
    flights.push({
      obj,
      from: new Vector3(fromX - width / 2, height / 2 - fromY, 300),
      t: 0,
      duration: 0.7,
      land,
    });
  }
  function blend(colour: string) {
    const total = bands.reduce((sum, b) => sum + b.goal, 0);
    const target = new Color(colour);
    bands.forEach((b) => b.target.copy(target));
    swirl = 1;
    shake = 1;
    wobble = 0.12;
    return total;
  }

  function resize(w: number, h: number, dpr: number) {
    width = w;
    height = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }

  // Returns the screen position (CSS px) of each layer in the layers moment.
  const tmp = new Vector3();
  function layerPoints() {
    rig.updateMatrixWorld(true);
    return [lid, boostSlab, baseSlab, fruitSlab].map((part) => {
      const y = part === lid ? part.position.y + 0.2 : part.position.y;
      tmp.set(R1 + 0.1, y, 0).applyMatrix4(cup.matrixWorld);
      return { x: tmp.x + width / 2, y: height / 2 - tmp.y };
    });
  }

  let time = 0;
  // Advances every animation; returns true while anything is still moving.
  function update(dt: number, target: typeof pose, settleSpeed: number) {
    time += dt;
    let busy = false;
    const k = settleSpeed;
    for (const key of ['x', 'y', 'scale', 'spin', 'tilt', 'sway', 'visible'] as const) {
      const before = pose[key];
      pose[key] = damp(pose[key], target[key], key === 'spin' ? 10 : k, dt);
      if (
        Math.abs(pose[key] - target[key]) >
        (key === 'x' || key === 'y' || key === 'scale' ? 0.3 : 0.002)
      )
        busy = true;
      else if (Math.abs(before - pose[key]) < 1e-5) pose[key] = target[key];
    }
    rig.position.set(pose.x, pose.y, 0);
    rig.scale.setScalar(Math.max(0.001, pose.scale * pose.visible));
    rig.visible = pose.visible > 0.01;
    cup.rotation.set(pose.tilt, pose.spin, pose.sway + Math.sin(time * 38) * 0.05 * shake);

    // Accessories
    for (const part of ['lid', 'straw', 'sleeve', 'orbit'] as const) {
      const goal =
        look[part] && look.explode < 0.02
          ? 1
          : part === 'lid' || part === 'straw'
            ? look[part]
              ? 1
              : 0
            : 0;
      const before = shown[part];
      shown[part] = damp(shown[part], goal, 9, dt);
      if (Math.abs(shown[part] - goal) > 0.003) busy = true;
      else shown[part] = goal;
      if (before !== shown[part]) busy = true;
    }
    lid.visible = shown.lid > 0.01;
    lid.position.y = H + (1 - shown.lid) * 1.2 + look.explode * 1.25;
    lid.scale.setScalar(Math.max(0.001, shown.lid));
    straw.visible = shown.straw > 0.01;
    // In the layers moment the straw shortens and rides up with the lid.
    straw.position.y = (1 - shown.straw) * 1.6 + look.explode * 2.35;
    const strawSize = Math.max(0.001, 0.4 + 0.6 * shown.straw);
    straw.scale.set(strawSize, strawSize * (1 - look.explode * 0.55), strawSize);
    sleeve.visible = shown.sleeve > 0.01;
    sleeve.scale.set(1 + (1 - shown.sleeve) * 0.25, shown.sleeve, 1 + (1 - shown.sleeve) * 0.25);
    orbit.visible = shown.orbit > 0.01;
    orbitPieces.forEach((holder, i) => {
      const d = holder.userData;
      if (d.next) {
        d.pop = damp(d.pop, 0, 16, dt);
        busy = true;
        if (d.pop < 0.05 || !holder.children.length) {
          holder.clear();
          holder.add(makeFruit(d.next));
          d.kind = d.next;
          d.next = '';
        }
      } else if (d.pop < 0.999) {
        d.pop = damp(d.pop, 1, 10, dt);
        busy = true;
      } else d.pop = 1;
      holder.scale.setScalar(Math.max(0.001, d.pop * shown.orbit * (mobile ? 0.9 : 1.05)));
      holder.rotation.set(
        time * 0.4 + d.phase,
        time * 0.6 + i,
        0.3 + Math.sin(time + d.phase) * 0.3,
      );
      holder.position.y = orbitSlots[i][1] + Math.sin(time * 1.3 + d.phase) * 0.08;
    });

    // Liquid bands
    let level = FLOOR;
    const tops: number[] = liquidMat.uniforms.tops.value;
    bands = bands.filter((b) => b.goal > 0 || b.height > 0.004);
    bands.forEach((b, i) => {
      b.height = damp(b.height, b.goal, 7, dt);
      if (Math.abs(b.height - b.goal) > 0.002) busy = true;
      else b.height = b.goal;
      b.colour.lerp(b.target, 1 - Math.exp(-dt * (swirl > 0.05 ? 3 : 8)));
      if (Math.abs(b.colour.r - b.target.r) + Math.abs(b.colour.g - b.target.g) > 0.004)
        busy = true;
      level += b.height;
      tops[i] = level;
      bandColours[i].copy(b.colour);
    });
    liquidMat.uniforms.count.value = Math.max(1, bands.length);
    if (!bands.length) bandColours[0].set('#ffffff');
    liquidMat.uniforms.level.value = Math.max(FLOOR + 0.001, Math.min(H - 0.12, level));
    liquid.visible = level > FLOOR + 0.01 && look.explode < 0.02;
    const pop = topping.userData;
    pop.pop = damp(pop.pop, 1, 12, dt);
    if (pop.pop < 0.998) busy = true;
    else pop.pop = 1;
    topping.visible = liquid.visible && topping.children.length > 0;
    topping.position.y = level + 0.02 + Math.sin(time * 2.1) * wobble * 0.6;
    topping.scale.setScalar(
      Math.max(0.001, (0.4 + 0.6 * ease(pop.pop)) * Math.min(1, (radiusAt(level) - INSET) / 0.8)),
    );
    topping.rotation.y += swirl * dt * 9;
    explodeRig.visible = look.explode >= 0.02;
    wobble = damp(wobble, 0.018, 1.6, dt);
    swirl = damp(swirl, 0, 1.1, dt);
    shake = damp(shake, 0, 2.2, dt);
    if (wobble > 0.025 || swirl > 0.02 || shake > 0.02) busy = true;
    liquidMat.uniforms.wobble.value = wobble;
    liquidMat.uniforms.swirl.value = swirl * 0.06;
    liquidMat.uniforms.time.value = time;

    // Layers moment
    const e = look.explode;
    glassMat.uniforms.opacity.value = 1 - e * 0.85;
    rim.visible = base.visible = e < 0.98;
    if (explodeRig.visible) {
      fruitSlab.position.y = fruitSlab.userData.home - e * 0.15;
      baseSlab.position.y = baseSlab.userData.home + e * 0.3;
      boostSlab.position.y = boostSlab.userData.home + e * 0.62;
      mint.forEach((m) => (m.position.y = 1.95 + e * 0.62));
      explodeFruit.forEach((f, i) => {
        f.scale.setScalar(Math.max(0.001, e));
        f.rotation.set(time * 0.5, time * 0.7 + i, 0.3);
      });
    }

    // Fruit flying into the cup
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      f.t += dt / f.duration;
      busy = true;
      const mouth = new Vector3(0, H + 0.35, 0);
      cup.localToWorld(mouth);
      const t = ease(f.t);
      f.obj.position.lerpVectors(f.from, mouth, t);
      f.obj.position.y += Math.sin(Math.PI * Math.min(1, f.t)) * pose.scale * 1.4;
      f.obj.scale.setScalar(pose.scale * (1.1 - 0.35 * t));
      f.obj.rotation.set(f.t * 6, f.t * 4, f.t * 3);
      if (f.t >= 1) {
        scene.remove(f.obj);
        flights.splice(i, 1);
        wobble = 0.1;
        f.land();
      }
    }
    return busy;
  }

  function render() {
    renderer.render(scene, camera);
  }
  async function prepare() {
    await renderer.compileAsync(scene, camera);
  }

  return {
    pose,
    look,
    resize,
    update,
    render,
    prepare,
    setBands,
    setTopping,
    setOrbit,
    setName: drawName,
    setExplodeColour: (colour: string) =>
      ((fruitSlab.children[1] as Mesh).material as MeshToonMaterial).color.set(colour),
    fly,
    blend,
    layerPoints,
    slosh: (amount: number) => (wobble = Math.max(wobble, Math.min(0.12, amount))),
    dispose() {
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
export type CupScene = Awaited<ReturnType<typeof createCupScene>>;
