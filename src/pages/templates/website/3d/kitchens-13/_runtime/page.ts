// Page behaviour for Plinth & Plumb. Everything here works without WebGL: the
// 3D kitchen (controller.ts) only mirrors what this file decides.
import { stage } from './controller';
import type { Room } from './scene';
import {
  doors,
  doorStyles,
  handles,
  kitchensDemo as c,
  taps,
  worktops,
  type Spec,
} from '../../../../../../content/kitchens-demo';
import {
  bindSceneLinks,
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
const doorPhrase = (spec: Spec) =>
  `${label.door(spec.door)} ${label.doorStyle(spec.doorStyle).toLowerCase()} doors`;
const summary = (spec: Spec) =>
  [
    doorPhrase(spec),
    label.top(spec.top),
    handlePhrase(spec.handle),
    `${label.tap(spec.tap)} tap`,
  ].join(' · ');

runLoader(1500);

// Flat elevations follow the same spec as the 3D model.
function drawElevations(spec: Spec, room: Room) {
  for (const svg of $$<SVGSVGElement>('[data-elevation]')) {
    const id = svg.querySelector('pattern')!.id.replace(/^oak-/, '');
    svg.dataset.room = room;
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
    if (img.alt) img.alt = `A model kitchen in the ${style.name} style.`;
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
const rowWatcher = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) selectStyle(Number((entry.target as HTMLElement).dataset.style));
  },
  { rootMargin: '-48% 0px -48% 0px' },
);
styleButtons.forEach((button) => rowWatcher.observe(button));

// DESIGN: every control is a radio group; Undo walks back through changes.
const form = $<HTMLFormElement>('[data-builder]');
const undo = $<HTMLButtonElement>('[data-undo]');
type State = { room: Room; spec: Spec };
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
  };
};
const write = (state: State) => {
  const set = (name: string, value: string) =>
    (form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked =
      true);
  set('room', state.room);
  for (const [key, value] of Object.entries(state.spec)) set(key, value);
};
let current = read();
const history: State[] = [];
function changeMessage(before: State, after: State) {
  if (before.room !== after.room)
    return `Switched to the ${after.room}. Same doors, worktop, handles and tap.`;
  const key = (Object.keys(after.spec) as (keyof Spec)[]).find(
    (k) => before.spec[k] !== after.spec[k],
  );
  if (!key) return '';
  if (key === 'door') return `Doors changed to ${label.door(after.spec.door)}.`;
  if (key === 'doorStyle') return `Door style changed to ${label.doorStyle(after.spec.doorStyle)}.`;
  if (key === 'top') return `Worktop changed to ${label.top(after.spec.top)}.`;
  if (key === 'handle') return `${handlePhrase(after.spec.handle)} chosen.`;
  return `Tap changed to ${label.tap(after.spec.tap)}.`;
}
function render() {
  const { room, spec } = current;
  $('[data-room-name]').textContent =
    room === 'kitchen' ? 'Your kitchen so far' : 'Your bathroom so far';
  $('[data-spec-summary]').textContent = summary(spec);
  $('[data-picked="door"]').textContent =
    `${label.door(spec.door)}, ${label.doorStyle(spec.doorStyle).toLowerCase()}`;
  $('[data-picked="top"]').textContent = label.top(spec.top);
  $('[data-picked="handle"]').textContent = label.handle(spec.handle);
  $('[data-picked="tap"]').textContent = label.tap(spec.tap);
  undo.setAttribute('aria-disabled', String(!history.length));
  root.style.setProperty('--door-colour', hex.door(spec.door));
  drawElevations(spec, room);
  stage.setBuild(spec, room);
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
$<HTMLFormElement>('[data-visit]').addEventListener('submit', (event) => {
  event.preventDefault();
  const { room, spec } = current;
  const day = $<HTMLInputElement>('input[name="day"]:checked').value;
  const slot = $<HTMLInputElement>('input[name="slot"]:checked').value;
  $('[data-card-when]').textContent = `${day}, ${slot.toLowerCase()}`;
  $('[data-card-room]').textContent = room === 'kitchen' ? 'Kitchen' : 'Bathroom';
  $('[data-card-door]').textContent =
    `${label.door(spec.door)} ${label.doorStyle(spec.doorStyle).toLowerCase()}`;
  $('[data-card-top]').textContent = label.top(spec.top);
  $('[data-card-handle]').textContent = label.handle(spec.handle);
  $('[data-card-tap]').textContent = label.tap(spec.tap);
  $('[data-card-ref]').textContent = 'Ref. PP-' + String(1000 + Math.floor(Math.random() * 9000));
  card.hidden = false;
  $('[data-card-actions]').hidden = false;
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = '';
  card.focus();
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
