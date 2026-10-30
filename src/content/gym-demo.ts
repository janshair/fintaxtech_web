// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#2b1f4f', // main colour: header, buttons, headings, plates, icons
  accent: '#c8f04b', // highlight colour: main call-to-action, stars, small details
};

export const gymDemo = {
  id: 'gym-06',
  route: '/templates/website/motion/gym-06/',
  name: 'Hillmoor Fitness Club',
  monogram: 'HF',
  area: 'Dundee',
  titleSuffix: ' — Gym website demo by FinTaxTech',
  label: 'Full Circuit · gym-06 · website demo',
  hero: {
    eyebrow: 'GYM · CLASSES · PERSONAL TRAINING',
    description:
      'An open gym floor, small group classes and coaches who help you find your feet. Beginners very welcome.',
    action: 'Book a free visit',
    note: 'A fictional gym. Example classes, prices and opening hours.',
  },
  services: [
    {
      id: 'gym',
      name: 'Open gym floor',
      type: 'TRAIN YOUR WAY',
      description: 'Free weights, racks, cardio and resistance machines, ready when you are.',
      price: 'From £24 / month',
      detail: 'Example · off-peak membership',
    },
    {
      id: 'classes',
      name: 'Small group classes',
      type: 'TRAIN TOGETHER',
      description: 'Circuits, spin, kettlebells and mobility, kept small so coaches can help.',
      price: '£6 drop-in',
      detail: 'Example · included with Anytime',
    },
    {
      id: 'pt',
      name: 'Personal training',
      type: 'ONE TO ONE',
      description: 'A plan built around you, with a coach checking in and adjusting as you go.',
      price: '£32 / session',
      detail: 'Example · blocks of 5 available',
    },
    {
      id: 'intro',
      name: 'Beginner induction',
      type: 'START HERE',
      description: 'A relaxed walk-through of the kit and a simple first plan. No pressure.',
      price: 'Free',
      detail: 'Example · with any membership',
    },
  ],
  memberships: [
    {
      name: 'Off-peak',
      price: '£24',
      period: '/ month',
      note: 'Weekdays 09:30 – 16:00 and weekends',
      perks: ['Gym floor & cardio', 'Free induction', '30-day rolling'],
    },
    {
      name: 'Anytime',
      price: '£34',
      period: '/ month',
      note: 'All opening hours',
      perks: ['Gym floor & cardio', 'All group classes', 'Free induction'],
      featured: true,
    },
    {
      name: 'Day pass',
      price: '£8',
      period: '/ visit',
      note: 'Visiting or just trying it out',
      perks: ['Gym floor & cardio', 'One class', 'No sign-up'],
    },
  ],
  process: [
    [
      'Warm up: come and look round',
      'Pop in for a free visit. See the gym floor, the studio and the changing rooms before you decide anything.',
    ],
    [
      'Load up: your first plan',
      'A coach shows you the kit and sets a simple starting plan, matched to where you are today.',
    ],
    [
      'Lift off: find your rhythm',
      'Mix the gym floor with a class or two each week. On your finished website, members could book their next session here.',
    ],
  ],
  timetable: [
    {
      day: 'Mon',
      label: 'Monday',
      classes: [
        ['06:45', 'Early circuits', '45 min'],
        ['12:30', 'Lunchtime spin', '30 min'],
        ['18:30', 'Kettlebell basics', '45 min'],
      ],
    },
    {
      day: 'Tue',
      label: 'Tuesday',
      classes: [
        ['07:00', 'Mobility & stretch', '40 min'],
        ['17:45', 'Strength foundations', '50 min'],
        ['19:00', 'Spin', '45 min'],
      ],
    },
    {
      day: 'Wed',
      label: 'Wednesday',
      classes: [
        ['06:45', 'Early circuits', '45 min'],
        ['12:30', 'Core & conditioning', '30 min'],
        ['18:30', 'Boxfit', '45 min'],
      ],
    },
    {
      day: 'Thu',
      label: 'Thursday',
      classes: [
        ['07:00', 'Spin', '45 min'],
        ['17:45', 'Kettlebell basics', '45 min'],
        ['19:00', 'Mobility & stretch', '40 min'],
      ],
    },
    {
      day: 'Fri',
      label: 'Friday',
      classes: [
        ['06:45', 'Early circuits', '45 min'],
        ['12:30', 'Lunchtime spin', '30 min'],
        ['17:30', 'Friday finisher', '40 min'],
      ],
    },
    {
      day: 'Sat',
      label: 'Saturday',
      classes: [
        ['09:00', 'Beginners’ circuits', '45 min'],
        ['10:30', 'Spin', '45 min'],
      ],
    },
    {
      day: 'Sun',
      label: 'Sunday',
      classes: [['10:00', 'Mobility & stretch', '40 min']],
    },
  ],
  facilities: [
    ['▥', 'Free weights & racks'],
    ['◎', 'Cardio zone'],
    ['♫', 'Class studio'],
    ['⌂', 'Changing rooms & showers'],
    ['▣', 'Lockers'],
    ['P', 'Parking nearby'],
  ],
  work: [
    ['weights', 'The weights floor', 'Racks, benches and room to move.'],
    ['studio', 'The class studio', 'Space for circuits, kettlebells and stretch.'],
    ['cardio', 'The cardio corner', 'Bikes, rowers and treadmills by the window.'],
  ],
  reviews: [
    {
      initials: 'AK',
      name: 'Aisha K.',
      date: '2 weeks ago',
      text: 'I was nervous walking in as a complete beginner, but the induction was relaxed and nobody made me feel out of place. I actually look forward to Tuesday nights now.',
    },
    {
      initials: 'CM',
      name: 'Craig M.',
      date: '1 month ago',
      text: 'Good kit, clean changing rooms and I rarely wait for a rack at lunchtime. Easy to fit in before work.',
    },
    {
      initials: 'MD',
      name: 'Morven D.',
      date: '3 months ago',
      text: 'The kettlebell class is the friendliest hour of my week. The coach checks your form and remembers how you got on last time.',
    },
  ],
  hours: [
    ['Monday – Friday', '06:00 – 21:30'],
    ['Saturday', '08:00 – 16:00'],
    ['Sunday', '09:00 – 14:00'],
    ['Bank holidays', '09:00 – 14:00'],
  ],
  questions: [
    [
      'I’m new to the gym. Where do I start?',
      'Book a free visit. A coach shows you round, explains the kit and suggests a simple first week. Example answer: your own induction process goes here.',
    ],
    [
      'Is there a joining fee or contract?',
      'Example answer: no joining fee and a 30-day rolling membership. A real gym would set out its own fees, contract terms and cancellation rules here.',
    ],
    [
      'Can I try a class before joining?',
      'Example answer: yes. Choose a class from the timetable and book a taster. Your real class rules and booking tool would be linked here.',
    ],
    [
      'Can I book from this page?',
      'This is a sample website. The visit journey sends nothing and reserves no session. The FinTaxTech enquiry links are for discussing your own website.',
    ],
  ],
  flow: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    times: [
      ['early', 'Early (06:00 – 09:00)'],
      ['day', 'Daytime (09:00 – 16:00)'],
      ['evening', 'Evening (16:00 – 21:30)'],
    ],
    levels: ['New to the gym', 'Getting back into it', 'Training regularly'],
  },
  nameDialog: {
    title: 'Step onto your own gym floor.',
    description:
      'Try your gym’s name. For example, Tayside Strength Club. Your name stays in this page and its shareable link.',
  },
  contactNotes: {
    call: 'On your finished website, Call would dial your gym’s number. Add your number to the preview link to try it.',
    message:
      'On your finished website, WhatsApp would open a chat with your gym. Add your number to the preview link to try it.',
    directions:
      'Your finished website could open directions to your real address. This is a local map placeholder, with no map service loaded.',
  },
} as const;
