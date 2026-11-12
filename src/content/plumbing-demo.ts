// Copperwell Plumbing & Heating: an invented business for the plumbing-10 motion demo.
// The page copy lives in the template itself (ported as-is); this file holds the
// identity used by the registry, link preview and personalisation defaults.
export const THEME = { brand: '#0f2b3c', accent: '#c8743a' };

export const plumbingDemo = {
  id: 'plumbing-10',
  route: '/templates/website/motion/plumbing-10/',
  label: 'Plumbing / 10 · Website demo',
  name: 'Copperwell',
  area: 'your area',
  // 01632 960xxx numbers are reserved by Ofcom for drama and fiction.
  phone: { display: '01632 960123', tel: '01632960123' },
} as const;
