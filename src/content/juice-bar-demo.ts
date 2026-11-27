// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#12402a', // main colour: text, outlines, header, footer (Spinach)
  accent: '#d61f5e', // highlight colour: buttons, the cup sleeve, the drink name (Berry)
};

// Fruit the drink builder offers. Colours are the fruit itself, not the theme.
export const fruits = [
  { id: 'mango', label: 'Mango', liquid: '#ffb029', adjective: 'Sunset', noun: 'Parade' },
  { id: 'strawberry', label: 'Strawberry', liquid: '#f0587a', adjective: 'Pink', noun: 'Riot' },
  { id: 'banana', label: 'Banana', liquid: '#ffe9a3', adjective: 'Mellow', noun: 'Hug' },
  { id: 'spinach', label: 'Spinach', liquid: '#6cc04a', adjective: 'Green', noun: 'Swamp' },
  { id: 'ginger', label: 'Ginger', liquid: '#f2cc8a', adjective: 'Spicy', noun: 'Kick' },
  { id: 'pineapple', label: 'Pineapple', liquid: '#ffe15c', adjective: 'Tropical', noun: 'Disco' },
] as const;

export const juiceBarDemo = {
  id: 'juice-bar-05',
  route: '/templates/website/3d/juice-bar-05/',
  name: 'Tumble Cup',
  monogram: 'TC',
  area: 'Dundee',
  phone: { display: '01632 960123', tel: '01632960123', international: '441632960123' },
  hero: {
    title: ['Pick the fruit.', 'We’ll do the noisy bit.'],
    // The area from the preview link (or the sample area) goes between these two parts.
    lead: [
      'Juice and smoothies blended while you wait, just round the corner in',
      'Our regulars order by first name. Marge is very popular.',
    ],
  },
  // Each drink has a first name, so it is easy to order at the counter.
  menu: [
    {
      name: 'Mango Marge',
      ingredients: 'Mango, pineapple and orange juice.',
      line: 'Loud, golden and everyone’s first order.',
      tone: 'mango',
      colour: '#ffb029',
      fruit: ['mango', 'pineapple'],
    },
    {
      name: 'Strawberry Stan',
      ingredients: 'Strawberry, banana and oat drink.',
      line: 'Pink, soft and never in a rush.',
      tone: 'berry',
      colour: '#f0587a',
      fruit: ['strawberry', 'banana'],
    },
    {
      name: 'Green Gary',
      ingredients: 'Spinach, pineapple, apple juice and a bit of ginger.',
      line: 'Looks serious. Tastes like a holiday.',
      tone: 'green',
      colour: '#6cc04a',
      fruit: ['spinach', 'pineapple'],
    },
    {
      name: 'Pineapple Pete',
      ingredients: 'Pineapple, coconut water and a squeeze of lime.',
      line: 'Did one week in Tenerife. Still talks about it.',
      tone: 'pineapple',
      colour: '#ffe15c',
      fruit: ['pineapple', 'mango'],
    },
    {
      name: 'Banana Bev',
      ingredients: 'Banana, oat drink and a pinch of cinnamon.',
      line: 'Thick, creamy and gives great hugs.',
      tone: 'banana',
      colour: '#ffe9a3',
      fruit: ['banana', 'ginger'],
    },
    {
      name: 'Berry Bernie',
      ingredients: 'Blueberry, strawberry and apple juice.',
      line: 'Deep purple and a little bit mysterious.',
      tone: 'purple',
      colour: '#9b4fa0',
      fruit: ['blueberry', 'strawberry'],
    },
  ],
  layers: [
    ['Topping', 'Crushed ice, a lid and a stripy straw.'],
    ['Boost', 'One flavour extra. Mint, lime, vanilla or cinnamon.'],
    ['Base', 'Apple, orange, coconut water or oat drink.'],
    ['Fruit', 'Up to four. Chopped this morning, blended when you ask.'],
  ],
  bases: ['Apple juice', 'Orange juice', 'Coconut water', 'Oat drink'],
  boosts: ['Fresh mint', 'Squeeze of lime', 'Vanilla', 'Cinnamon'],
  times: ['In 10 minutes', 'In 20 minutes', 'Lunch, 12:30', 'After work, 17:15'],
  allergens: 'Ask us about allergens. Full allergen information is kept behind the counter.',
  hours: [
    ['Monday to Friday', '07:00 to 18:00'],
    ['Saturday', '08:00 to 17:00'],
    ['Sunday', '09:00 to 15:00'],
  ],
  address: ['Unit 3, Market Arcade', 'Two doors down from the bakery'],
};
