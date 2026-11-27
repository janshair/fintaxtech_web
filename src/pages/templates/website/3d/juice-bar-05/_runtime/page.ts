// Page behaviour for Tumble Cup. Everything here works without WebGL: the 3D
// cup (controller.ts) only mirrors what this file decides.
import { stage } from './controller';
import { fruits, juiceBarDemo as c } from '../../../../../../content/juice-bar-demo';
import type { Band } from './scene';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const $$ = <T extends Element = HTMLElement>(selector: string) => [
  ...document.querySelectorAll<T>(selector),
];
const status = $('[data-builder-status]');
const say = (text: string) => {
  status.textContent = '';
  requestAnimationFrame(() => (status.textContent = text));
};

// Loader: at most 1.5 s from navigation, skippable, once per session.
const loader = $('[data-loader]');
function endLoader() {
  if (loader.classList.contains('is-done')) return;
  loader.classList.add('is-done');
  setTimeout(() => (root.dataset.loader = 'done'), 450);
}
if (root.dataset.loader === 'on') {
  setTimeout(endLoader, Math.max(0, 1500 - performance.now()));
  $('[data-loader-skip]').addEventListener('click', endLoader);
  addEventListener('keydown', (event) => event.key === 'Escape' && endLoader(), { once: true });
}

// Colour maths in linear light, so mixes look like paint rather than mud.
const toLinear = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
const toHex = (rgb: number[]) =>
  '#' +
  rgb
    .map((v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055))
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
function mix(colours: [string, number][]) {
  const total = colours.reduce((sum, [, w]) => sum + w, 0);
  const sum = [0, 0, 0];
  for (const [hex, weight] of colours)
    toLinear(hex).forEach((v, i) => (sum[i] += (v * weight) / total));
  // Real blends stay bright; plain averaging drifts to beige, so push the
  // result away from its grey a little.
  const grey = sum[0] * 0.2126 + sum[1] * 0.7152 + sum[2] * 0.0722;
  return toHex(sum.map((v) => grey + (v - grey) * 1.6));
}

// MENU: the drink nearest the middle of the screen fills the cup.
const posterName = (name: string) => name.split(' ').at(-1)!.toLowerCase();
const drinkButtons = $$<HTMLButtonElement>('[data-drink]');
const heroSlot = $('[data-anchor="hero"]');
let activeDrink = -1;
function selectDrink(index: number) {
  if (index === activeDrink) return;
  activeDrink = index;
  const drink = c.menu[index];
  drinkButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  $('[data-drink-name]').textContent = drink.name;
  $$<HTMLImageElement>('[data-drink-poster]').forEach((img) => {
    img.src = `${c.route}cup-${posterName(drink.name)}.webp`;
    if (img.alt) img.alt = `${drink.name} in a cup with a stripy straw.`;
  });
  heroSlot.setAttribute(
    'aria-label',
    `A 3D cup of ${drink.name} with a stripy straw. Drag, swipe or use the arrow keys to spin it.`,
  );
  root.style.setProperty('--wipe', drink.colour);
  stage.setDrink(drink.colour, drink.fruit);
  if (!build.fruits.length) updateCollect();
}
drinkButtons.forEach((button, i) => {
  button.addEventListener('click', () => selectDrink(i));
  button.addEventListener('focus', () => selectDrink(i));
});
const rowWatcher = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) selectDrink(Number((entry.target as HTMLElement).dataset.drink));
  },
  { rootMargin: '-48% 0px -48% 0px' },
);
drinkButtons.forEach((button) => rowWatcher.observe(button));

// BUILD
const baseColours: Record<string, string> = {
  'Apple juice': '#f6e7a1',
  'Orange juice': '#ffb347',
  'Coconut water': '#f4f1e6',
  'Oat drink': '#eadbc0',
};
const build = {
  fruits: [] as string[],
  landed: 0,
  base: c.bases[0],
  boost: c.boosts[0],
  blended: false,
  blending: false,
};
const fruitInfo = (id: string) => fruits.find((f) => f.id === id)!;
const BASE = 0.3,
  PIECE = 0.48;
const form = $<HTMLFormElement>('[data-builder]');
const fruitButtons = $$<HTMLButtonElement>('[data-fruit]');
const undo = $<HTMLButtonElement>('[data-undo]');
const blendButton = $<HTMLButtonElement>('[data-blend]');
const toCollect = $<HTMLAnchorElement>('[data-to-collect]');

function cupName() {
  if (!build.fruits.length) return '';
  const first = fruitInfo(build.fruits[0]),
    lastFruit = fruitInfo(build.fruits.at(-1)!);
  return `The ${first.adjective} ${lastFruit.noun}`;
}
function mixColour() {
  return mix([
    [baseColours[build.base], 0.6],
    ...build.fruits.map((id) => [fruitInfo(id).liquid, 1] as [string, number]),
  ]);
}
function bands(): Band[] {
  if (build.blended) return [{ colour: mixColour(), height: BASE + build.fruits.length * PIECE }];
  return [
    { colour: baseColours[build.base], height: BASE },
    ...build.fruits
      .slice(0, build.landed)
      .map((id) => ({ colour: fruitInfo(id).liquid, height: PIECE })),
  ];
}

// Flat SVG cup: the fallback picture, kept in step even when 3D is live.
const UNIT = 80,
  FLOOR = 296;
function drawFlat(svg: SVGSVGElement, list: Band[]) {
  const group = svg.querySelector('[data-flat-layers]')!;
  const rects = [...group.querySelectorAll('rect')];
  let y = FLOOR;
  list.forEach((band, i) => {
    let rect = rects[i];
    if (!rect) {
      rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '30');
      rect.setAttribute('width', '180');
      rect.setAttribute('y', String(y));
      rect.setAttribute('height', '0');
      group.append(rect);
    }
    const h = band.height * UNIT;
    y -= h;
    rect.setAttribute('y', y.toFixed(1));
    rect.setAttribute('height', (h + 0.5).toFixed(1));
    rect.setAttribute('fill', band.colour);
  });
  rects.slice(list.length).forEach((rect) => rect.remove());
}
const flatBuild = $<SVGSVGElement>('#build [data-flat-cup]');
const flatCollect = $<SVGSVGElement>('#collect [data-flat-cup]');

function refresh() {
  const n = build.fruits.length;
  const name = cupName();
  $('[data-fruit-count]').textContent = `· ${n} of 4${n === 4 ? ', cup’s full' : ''}`;
  $('[data-cup-name]').textContent = name || 'Pick some fruit';
  fruitButtons.forEach((button) => {
    const count = build.fruits.filter((id) => id === button.dataset.fruit).length;
    button.dataset.count = String(count);
    button.classList.toggle('is-in', count > 0);
    button.querySelector('.badge')!.textContent = count > 1 ? '×' + count : '';
    button.setAttribute('aria-disabled', String(n >= 4 || build.blending));
    const label = fruitInfo(button.dataset.fruit!).label.toLowerCase();
    button.setAttribute('aria-label', `Add ${label}${count ? ` (${count} in the cup)` : ''}`);
  });
  undo.setAttribute('aria-disabled', String(!n || build.blending));
  blendButton.disabled = !n || build.blended || build.blending;
  toCollect.hidden = !build.blended;
  const list = bands();
  stage.setBuild(list);
  drawFlat(flatBuild, list);
  updateCollect();
}

fruitButtons.forEach((button) =>
  button.addEventListener('click', () => {
    const fruit = fruitInfo(button.dataset.fruit!);
    if (build.blending) return;
    if (build.fruits.length >= 4) {
      say('Your cup is full. Undo one, or blend it.');
      return;
    }
    if (build.blended) build.blended = false;
    build.fruits.push(fruit.id);
    const n = build.fruits.length;
    say(`${fruit.label} added. ${n} of 4.${n === 4 ? ' Your cup is full. Time to blend it.' : ''}`);
    refresh();
    stage.fly(fruit.id, button, () => {
      build.landed = Math.min(build.fruits.length, build.landed + 1);
      refresh();
    });
  }),
);
undo.addEventListener('click', () => {
  if (build.blending || !build.fruits.length) return;
  if (build.blended) {
    build.blended = false;
    say('Unblended. Your layers are back.');
  } else {
    const removed = fruitInfo(build.fruits.pop()!);
    build.landed = Math.min(build.landed, build.fruits.length);
    say(`${removed.label} taken out. ${build.fruits.length} of 4.`);
  }
  refresh();
});
form.addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.name === 'base') build.base = input.value;
  if (input.name === 'boost') build.boost = input.value;
  refresh();
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!build.fruits.length || build.blended || build.blending) return;
  build.blending = true;
  build.landed = build.fruits.length;
  refresh();
  say('Blending…');
  stage.blend(mixColour(), () => {
    build.blending = false;
    build.blended = true;
    refresh();
    say(`Blended. Your cup is called ${cupName()}.`);
    toCollect.focus();
  });
});

// COLLECT
const ticket = $('[data-ticket]');
function finished() {
  if (build.fruits.length)
    return {
      name: cupName(),
      what: build.fruits.map((id) => fruitInfo(id).label).join(', '),
      base: build.base,
      boost: build.boost,
      colour: mixColour(),
    };
  const drink = c.menu[Math.max(0, activeDrink)];
  return {
    name: drink.name,
    what: drink.ingredients.replace(/\.$/, ''),
    base: 'As it comes',
    boost: 'None',
    colour: drink.colour,
  };
}
function updateCollect() {
  const cup = finished();
  const list = [{ colour: cup.colour, height: 2 }];
  stage.setFinished(list);
  drawFlat(flatCollect, list);
  $('[data-collect-intro]').textContent = build.fruits.length
    ? `${cup.name} is nearly ready. Choose a time and skip the queue. We’ll have it on the counter with your name on it.`
    : `Not built a cup yet? We’ll pour you a ${cup.name}. Choose a time and skip the queue.`;
}
$<HTMLFormElement>('[data-times]').addEventListener('submit', (event) => {
  event.preventDefault();
  const cup = finished();
  const time = $<HTMLInputElement>('[name="time"]:checked').value;
  $('[data-ticket-drink]').textContent = cup.name;
  $('[data-ticket-fruit]').textContent = cup.what;
  $('[data-ticket-base]').textContent = cup.base;
  $('[data-ticket-boost]').textContent = cup.boost;
  $('[data-ticket-time]').textContent = time;
  $('[data-ticket-number]').textContent = 'No. ' + String(100 + Math.floor(Math.random() * 900));
  ticket.hidden = false;
  $('[data-ticket-actions]').hidden = false;
  // Restart the print animation when a second ticket is taken.
  ticket.style.animation = 'none';
  void ticket.offsetWidth;
  ticket.style.animation = '';
  ticket.focus();
});

// Juice wave between MENU, BUILD and COLLECT.
const wipe = $('[data-wipe-layer]');
const focusTarget: Record<string, string> = {
  build: '#build-title',
  collect: '#collect-title',
};
function go(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  const jump = () => {
    section.scrollIntoView({ block: 'start' });
    const url = new URL(location.href);
    url.hash = id;
    history.replaceState(history.state, '', url);
    if (focusTarget[id]) $(focusTarget[id]).focus({ preventScroll: true });
  };
  if (reduced.matches || wipe.classList.length > 1) return jump();
  wipe.classList.add('is-covering');
  setTimeout(() => {
    jump();
    wipe.classList.replace('is-covering', 'is-leaving');
    setTimeout(() => wipe.classList.remove('is-leaving'), 460);
  }, 380);
}
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-wipe], a[data-order]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
  const id = link.hash.slice(1);
  if (!['menu', 'build', 'collect'].includes(id)) return;
  event.preventDefault();
  go(id);
});

// Navigation state and the footer splash.
const navLinks = $$<HTMLAnchorElement>('.bar nav a');
const sectionWatcher = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((link) => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }
  },
  { rootMargin: '-50% 0px -50% 0px' },
);
for (const id of ['menu', 'build', 'collect', 'find'])
  sectionWatcher.observe(document.getElementById(id)!);
const footer = $('[data-footer]');
new IntersectionObserver(([entry]) => footer.classList.toggle('is-in', entry.isIntersecting), {
  threshold: 0.4,
}).observe(footer);

selectDrink(0);
refresh();
