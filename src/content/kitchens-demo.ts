// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#1c2124', // main colour: text, outlines, header, footer (Slate)
  accent: '#2b48d8', // highlight colour: buttons, links, the visit card (Cobalt)
};

// Builder options. Colours here are materials in the room, not the theme.
export const doors = [
  { id: 'sage', label: 'Sage', hex: '#8fa58c' },
  { id: 'ink', label: 'Ink blue', hex: '#1f2b3b' },
  { id: 'oak', label: 'Pale oak', hex: '#c9a27a' },
  { id: 'chalk', label: 'Chalk pink', hex: '#e6c5bc' },
  { id: 'charcoal', label: 'Charcoal', hex: '#2f3336' },
  { id: 'cobalt', label: 'Cobalt', hex: '#2b48d8' },
] as const;
export const doorStyles = [
  { id: 'shaker', label: 'Shaker' },
  { id: 'slab', label: 'Slab' },
] as const;
export const worktops = [
  { id: 'oak', label: 'Oiled oak', hex: '#b98a5c' },
  { id: 'quartz', label: 'White quartz', hex: '#f1efea' },
  { id: 'oat', label: 'Oat quartz', hex: '#e3d9c6' },
  { id: 'slate', label: 'Slate', hex: '#2c3033' },
  { id: 'terrazzo', label: 'Terrazzo', hex: '#efe9e1' },
] as const;
export const handles = [
  { id: 'bar', label: 'Bar' },
  { id: 'cup', label: 'Cup' },
  { id: 'knob', label: 'Knob' },
  { id: 'none', label: 'Handleless' },
] as const;
export const taps = [
  { id: 'brass', label: 'Brushed brass', hex: '#c9a45c' },
  { id: 'chrome', label: 'Chrome', hex: '#e6e8ea' },
  { id: 'steel', label: 'Brushed steel', hex: '#b9bcbf' },
  { id: 'black', label: 'Matt black', hex: '#202224' },
] as const;

// Bathroom only: the layout and the wall tiles.
export const layouts = [
  { id: 'shower', label: 'Walk-in shower' },
  { id: 'bath', label: 'Bath and shower' },
] as const;
export const wallTiles = [
  { id: 'stone', label: 'Stone grid', hex: '#e9ebe8' },
  { id: 'metro', label: 'White metro', hex: '#f6f5f1' },
  { id: 'sage', label: 'Sage zellige', hex: '#9fb79c' },
] as const;
export type Bath = {
  layout: (typeof layouts)[number]['id'];
  tiles: (typeof wallTiles)[number]['id'];
};
// What each control is called in each room.
export const roomLabels = {
  kitchen: { door: 'Doors', top: 'Worktop', handle: 'Handles', tap: 'Tap' },
  bathroom: { door: 'Vanity doors', top: 'Vanity top', handle: 'Handles', tap: 'Taps & shower' },
} as const;

export type Spec = {
  door: (typeof doors)[number]['id'];
  doorStyle: (typeof doorStyles)[number]['id'];
  top: (typeof worktops)[number]['id'];
  handle: (typeof handles)[number]['id'];
  tap: (typeof taps)[number]['id'];
};

export const kitchensDemo = {
  id: 'kitchens-13',
  route: '/templates/website/3d/kitchens-13/',
  name: 'Plinth & Plumb',
  monogram: 'PP',
  area: 'York',
  phone: { display: '01632 960123', tel: '01632960123', international: '441632960123' },
  hero: {
    kicker: 'Kitchens and bathrooms in',
    title: ['Measured twice.', 'Fitted once.'],
    lead: 'We draw it in your room, build it in our workshop and fit it with the same small team. No mystery subcontractors.',
  },
  // Six looks we keep coming back to. The 3D kitchen restyles to each one.
  styles: [
    {
      name: 'Sunday Shaker',
      line: 'Sage shaker doors, oiled oak and brass cup handles. Looks like it has always been there.',
      spec: { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' },
    },
    {
      name: 'Night Shift',
      line: 'Ink blue and handleless, with a white quartz top. Calm until somebody opens the fridge.',
      spec: { door: 'ink', doorStyle: 'slab', top: 'quartz', handle: 'none', tap: 'black' },
    },
    {
      name: 'Oak & Oat',
      line: 'Pale oak slab doors on an oat-coloured top. Warm, plain and very hard to tire of.',
      spec: { door: 'oak', doorStyle: 'slab', top: 'oat', handle: 'bar', tap: 'steel' },
    },
    {
      name: 'Terrazzo Party',
      line: 'Chalk-pink doors and a speckled terrazzo top, for a bit of colour with your breakfast.',
      spec: { door: 'chalk', doorStyle: 'slab', top: 'terrazzo', handle: 'knob', tap: 'chrome' },
    },
    {
      name: 'Ironmonger',
      line: 'Charcoal shaker, a slate top and black bar handles. Serious, in a good way.',
      spec: { door: 'charcoal', doorStyle: 'shaker', top: 'slate', handle: 'bar', tap: 'black' },
    },
    {
      name: 'Cobalt Crush',
      line: 'Cobalt doors, white quartz and brass knobs. The one the neighbours ask about.',
      spec: { door: 'cobalt', doorStyle: 'slab', top: 'quartz', handle: 'knob', tap: 'brass' },
    },
  ] satisfies { name: string; line: string; spec: Spec }[],
  // Labels for the exploded view, top to bottom.
  layers: [
    ['Fittings', 'Tap, sink, hob, lights and shelves. Fitted last, tested twice.'],
    ['Worktops', 'Templated in your room, then cut in our workshop.'],
    ['Doors', 'Hung, then adjusted until every gap matches.'],
    ['Carcasses', 'The boxes. Built square, fixed level, never seen again.'],
  ],
  slots: ['Morning, 9 till 12', 'Afternoon, 1 till 5'],
  hours: [
    ['Monday to Friday', '08:00 to 17:30'],
    ['Saturday', '09:00 to 13:00'],
    ['Sunday', 'Closed'],
  ],
  address: ['Unit 4, Canal Works', 'Showroom visits by appointment'],
};
