// Copperwell Plumbing & Heating: an invented business for the plumbing-10 motion demo.
// The page layout and motion live in the template itself (ported as-is); this file holds
// the identity used by the registry, link preview and personalisation defaults, plus the
// business content the template brief can replace: services, process and questions.
export const THEME = { brand: '#0f2b3c', accent: '#c8743a' };

export const plumbingDemo = {
  id: 'plumbing-10',
  route: '/templates/website/motion/plumbing-10/',
  label: 'Plumbing / 10 · Website demo',
  name: 'Copperwell',
  area: 'your area',
  // 01632 960xxx numbers are reserved by Ofcom for drama and fiction.
  phone: { display: '01632 960123', tel: '01632960123' },
  services: [
    {
      icon: '🔥',
      name: 'Boiler repairs',
      description: 'No heating or hot water? We find the fault and explain it in plain English.',
    },
    {
      icon: '🛠️',
      name: 'Boiler servicing',
      description: "A yearly check to keep it safe and efficient, with a reminder when it's due.",
    },
    {
      icon: '💧',
      name: 'Leaks & burst pipes',
      description: 'From a dripping tap to water through the ceiling, we stop it fast.',
    },
    {
      icon: '♨️',
      name: 'Radiators & heating',
      description: 'Cold spots, noisy pipes, new radiators or smart thermostats.',
    },
    {
      icon: '🚿',
      name: 'Bathrooms & showers',
      description: 'New showers, toilets and full bathroom fits, finished neatly.',
    },
    {
      icon: '🚽',
      name: 'Taps, toilets & blockages',
      description: 'The everyday jobs, done properly the first time.',
    },
  ],
  process: [
    ['Send a photo', 'Snap the problem and tell us your postcode. It takes a minute.'],
    ['Get a clear quote', "We tell you what's involved and what it costs before any work starts."],
    [
      'We fix it and tidy up',
      'Dust sheets down, shoes covered, and nothing extra without your OK.',
    ],
  ] as [string, string][],
  // The page wraps each "your area" (the area above) so ?area= personalises it.
  questions: [
    [
      'What should I do if a pipe bursts?',
      "Turn off the water at your stopcock (often under the kitchen sink), switch off the electrics near the water if it's safe to do so, then call us. Send a photo on WhatsApp so we know what to bring.",
    ],
    [
      'How often should my boiler be serviced?',
      "Most boiler manufacturers recommend a service once a year, and many warranties need it. Sign up for a free reminder and we'll message you when it's due.",
    ],
    [
      'Can I get a quote without a visit?',
      "Often, yes. Send a photo or a short video and we'll tell you what's involved. For bigger jobs we'll arrange a visit first.",
    ],
    [
      'Will you tell me the cost before you start?',
      'Yes. You get a clear quote before any work starts, and nothing extra is done without your OK.',
    ],
    [
      'Which areas do you cover?',
      "We cover your area and the surrounding villages. Send your postcode and we'll confirm.",
    ],
  ] as [string, string][],
};
