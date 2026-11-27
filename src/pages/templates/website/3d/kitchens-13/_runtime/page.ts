// Page behaviour for Plinth & Plumb. Everything here works without WebGL: the
// 3D kitchen (controller.ts) only mirrors what this file decides.
import { stage } from './controller';
import type { Room } from './scene';
import {
  doors,
  doorStyles,
  handles,
  kitchensDemo as c,
  layouts,
  roomLabels,
  taps,
  wallTiles,
  worktops,
  type Bath,
  type Spec,
} from '../../../../../../content/kitchens-demo';
import {
  bindSceneLinks,
  reducedMotion,
  root,
  runLoader,
  toggleInView,
  watchNav,
} from '../../../../../../lib/three-template/runtime';

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
const label = {
  door: (id: Spec['door']) => doors.find((d) => d.id === id)!.label,
  doorStyle: (id: Spec['doorStyle']) => doorStyles.find((d) => d.id === id)!.label,
  top: (id: Spec['top']) => worktops.find((t) => t.id === id)!.label,
  handle: (id: Spec['handle']) => handles.find((h) => h.id === id)!.label,
  tap: (id: Spec['tap']) => taps.find((t) => t.id === id)!.label,
};
const hex = {
  door: (id: Spec['door']) => doors.find((d) => d.id === id)!.hex,
  tap: (id: Spec['tap']) => taps.find((t) => t.id === id)!.hex,
};
const handlePhrase = (id: Spec['handle']) =>
  id === 'none' ? 'Handleless' : `${label.handle(id)} handles`;
runLoader(1500);

// Flat elevations follow the same spec as the 3D model.
function drawElevations(spec: Spec, room: Room, bath: Bath) {
  for (const svg of $$<SVGSVGElement>('[data-elevation]')) {
    const id = svg.querySelector('pattern')!.id.replace(/^oak-/, '');
    svg.dataset.room = room;
    svg.dataset.layout = bath.layout;
    svg.style.setProperty('--tiles', `url(#tiles-${bath.tiles}-${id})`);
    svg.dataset.handle = spec.handle;
    svg.dataset.doorStyle = spec.doorStyle;
    svg.style.setProperty('--door', hex.door(spec.door));
    svg.style.setProperty('--tap', hex.tap(spec.tap));
    const top = worktops.find((t) => t.id === spec.top)!;
    svg.style.setProperty(
      '--top',
      top.id === 'oak' || top.id === 'terrazzo' ? `url(#${top.id}-${id})` : top.hex,
    );
  }
}

// SHOWCASE: the style nearest the middle of the screen dresses the kitchen.
const styleButtons = $$<HTMLButtonElement>('[data-style]');
const heroSlot = $('[data-anchor="hero"]');
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z]+/g, '-');
let activeStyle = -1;
function selectStyle(index: number) {
  if (index === activeStyle) return;
  activeStyle = index;
  const style = c.styles[index];
  styleButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  $('[data-style-name]').textContent = style.name;
  $$<HTMLImageElement>('[data-style-poster]').forEach((img) => {
    img.src = `${c.route}style-${slug(style.name)}.webp`;
    img.alt = `A model kitchen in the ${style.name} style.`;
  });
  heroSlot.setAttribute(
    'aria-label',
    `A 3D model kitchen in the ${style.name} style. Drag, swipe or use the arrow keys to walk round it.`,
  );
  stage.setStyle(style.spec);
}
styleButtons.forEach((button, i) => {
  button.addEventListener('click', () => selectStyle(i));
  button.addEventListener('focus', () => selectStyle(i));
});
// The active row is the last one whose top has passed 55% of the screen, so
// every row (the last one included) takes over as it reaches the middle.
const styleList = $('.style-list');
let styleFrame = 0;
function followScroll() {
  styleFrame = 0;
  const list = styleList.getBoundingClientRect();
  if (list.bottom < 0 || list.top > innerHeight) return;
  const line = innerHeight * 0.55;
  let index = 0;
  styleButtons.forEach((button, i) => {
    if (button.getBoundingClientRect().top < line) index = i;
  });
  selectStyle(index);
}
addEventListener(
  'scroll',
  () => {
    if (!styleFrame) styleFrame = requestAnimationFrame(followScroll);
  },
  { passive: true },
);

// DESIGN: every control is a radio group; Undo walks back through changes.
const form = $<HTMLFormElement>('[data-builder]');
const undo = $<HTMLButtonElement>('[data-undo]');
type State = { room: Room; spec: Spec; bath: Bath };
const read = (): State => {
  const value = (name: string) =>
    form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)!.value;
  return {
    room: value('room') as Room,
    spec: {
      door: value('door') as Spec['door'],
      doorStyle: value('doorStyle') as Spec['doorStyle'],
      top: value('top') as Spec['top'],
      handle: value('handle') as Spec['handle'],
      tap: value('tap') as Spec['tap'],
    },
    bath: { layout: value('layout') as Bath['layout'], tiles: value('tiles') as Bath['tiles'] },
  };
};
const write = (state: State) => {
  const set = (name: string, value: string) =>
    (form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked =
      true);
  set('room', state.room);
  for (const [key, value] of Object.entries({ ...state.spec, ...state.bath })) set(key, value);
};
let current = read();
const history: State[] = [];
// Room-aware words: "Vanity doors" in a bathroom, "Doors" in a kitchen.
const words = (room: Room) => roomLabels[room];
const layoutLabel = (id: Bath['layout']) => layouts.find((l) => l.id === id)!.label;
const tilesLabel = (id: Bath['tiles']) => wallTiles.find((t) => t.id === id)!.label;
function summary({ room, spec, bath }: State) {
  const w = words(room);
  const parts = [
    `${label.door(spec.door)} ${label.doorStyle(spec.doorStyle).toLowerCase()} ${w.door.toLowerCase()}`,
    room === 'kitchen' ? label.top(spec.top) : `${label.top(spec.top)} vanity top`,
    handlePhrase(spec.handle),
    room === 'kitchen' ? `${label.tap(spec.tap)} tap` : `${label.tap(spec.tap)} taps and shower`,
  ];
  if (room === 'bathroom') parts.push(layoutLabel(bath.layout), `${tilesLabel(bath.tiles)} tiles`);
  return parts.join(' · ');
}
function changeMessage(before: State, after: State) {
  if (before.room !== after.room)
    return after.room === 'bathroom'
      ? 'Switched to the bathroom. Your doors, top, handles and tap finish carry across.'
      : 'Switched to the kitchen. Your doors, worktop, handles and tap finish carry across.';
  const w = words(after.room);
  if (before.bath.layout !== after.bath.layout)
    return `Layout changed to ${layoutLabel(after.bath.layout)}.`;
  if (before.bath.tiles !== after.bath.tiles)
    return `Wall tiles changed to ${tilesLabel(after.bath.tiles)}.`;
  const key = (Object.keys(after.spec) as (keyof Spec)[]).find(
    (k) => before.spec[k] !== after.spec[k],
  );
  if (!key) return '';
  if (key === 'door') return `${w.door} changed to ${label.door(after.spec.door)}.`;
  if (key === 'doorStyle') return `Door style changed to ${label.doorStyle(after.spec.doorStyle)}.`;
  if (key === 'top') return `${w.top} changed to ${label.top(after.spec.top)}.`;
  if (key === 'handle') return `${handlePhrase(after.spec.handle)} chosen.`;
  return `${w.tap} changed to ${label.tap(after.spec.tap)}.`;
}
function render() {
  const { room, spec, bath } = current;
  const w = words(room);
  $('[data-room-name]').textContent =
    room === 'kitchen' ? 'Your kitchen so far' : 'Your bathroom so far';
  $('[data-spec-summary]').textContent = summary(current);
  for (const node of $$('[data-label]')) node.textContent = w[node.dataset.label as keyof typeof w];
  for (const node of $$('[data-bathroom-only]')) node.hidden = room !== 'bathroom';
  $('[data-picked="door"]').textContent =
    `${label.door(spec.door)}, ${label.doorStyle(spec.doorStyle).toLowerCase()}`;
  $('[data-picked="top"]').textContent = label.top(spec.top);
  $('[data-picked="handle"]').textContent = label.handle(spec.handle);
  $('[data-picked="tap"]').textContent = label.tap(spec.tap);
  $('[data-picked="layout"]').textContent = layoutLabel(bath.layout);
  $('[data-picked="tiles"]').textContent = tilesLabel(bath.tiles);
  undo.setAttribute('aria-disabled', String(!history.length));
  root.style.setProperty('--door-colour', hex.door(spec.door));
  drawElevations(spec, room, bath);
  stage.setBuild(spec, room, bath);
}
form.addEventListener('change', () => {
  const next = read();
  history.push(current);
  const message = changeMessage(current, next);
  current = next;
  render();
  if (message) say(message);
});
undo.addEventListener('click', () => {
  const previous = history.pop();
  if (!previous) return;
  const message = changeMessage(current, previous);
  current = previous;
  write(previous);
  render();
  say('Undone. ' + message);
});
form.addEventListener('submit', (event) => event.preventDefault());

// VISIT: the next six working days (no Sundays), then a visit card.
const days = $$('[data-day]');
const dayInputs = $$<HTMLInputElement>('input[name="day"]');
{
  const date = new Date();
  let n = 0;
  while (n < days.length) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 0) continue;
    const text = date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    days[n].textContent = text;
    dayInputs[n].value = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    n++;
  }
}
const card = $('[data-card]');
const visitStatus = $('[data-visit-status]');
$<HTMLFormElement>('[data-visit]').addEventListener('submit', (event) => {
  event.preventDefault();
  const { room, spec, bath } = current;
  const day = $<HTMLInputElement>('input[name="day"]:checked').value;
  const slot = $<HTMLInputElement>('input[name="slot"]:checked').value;
  const when = `${day}, ${slot.toLowerCase()}`;
  $('[data-card-when]').textContent = when;
  $('[data-card-room]').textContent = room === 'kitchen' ? 'Kitchen' : 'Bathroom';
  $('[data-card-door]').textContent =
    `${label.door(spec.door)} ${label.doorStyle(spec.doorStyle).toLowerCase()}`;
  $('[data-card-top]').textContent = label.top(spec.top);
  $('[data-card-handle]').textContent = label.handle(spec.handle);
  $('[data-card-tap]').textContent = label.tap(spec.tap);
  $('[data-card-layout]').textContent = layoutLabel(bath.layout);
  $('[data-card-tiles]').textContent = tilesLabel(bath.tiles);
  $('[data-card-ref]').textContent = 'Ref. PP-' + String(1000 + Math.floor(Math.random() * 9000));
  card.hidden = false;
  $('[data-card-actions]').hidden = false;
  // Place the card: restart its animation, bring it into view, focus its
  // heading and announce it.
  card.classList.remove('is-placed');
  void card.offsetWidth;
  card.classList.add('is-placed');
  card.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
  $('#card-title').focus({ preventScroll: true });
  visitStatus.textContent = '';
  requestAnimationFrame(
    () =>
      (visitStatus.textContent = `Design visit booked for ${when}. This is a demo: nothing is ordered, booked or paid.`),
  );
});

// A cabinet door swings across between PROJECTS, DESIGN and VISIT.
bindSceneLinks({
  layer: $('[data-wipe-layer]'),
  scenes: ['projects', 'design', 'visit'],
  focus: { design: '#design-title', visit: '#visit-title' },
});
watchNav($$<HTMLAnchorElement>('.bar nav a'), ['projects', 'design', 'visit', 'find']);
toggleInView($('[data-footer]'));

selectStyle(0);
render();
