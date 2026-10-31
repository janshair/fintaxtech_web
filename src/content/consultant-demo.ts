// Change these hex codes, save, and the whole template recolours.
export const THEME = {
  brand: '#1e2a44', // main colour: header, buttons, headings, monogram, icons
  accent: '#f0b8a8', // highlight colour: main call-to-action, stars, small details
};

// Role presets: the ?role text is matched, ignoring case, against each `match`
// pattern in order; anything else uses the consultant copy, with the role shown
// as given. Prices are examples. No qualifications, regulators or results.
export const serviceIds = ['monthly', 'project', 'session', 'workshop'] as const;
export const caseKinds = ['untangle', 'stack', 'align'] as const;
export const rolePresets = {
  bookkeeper: {
    match: 'bookkeep|accountant|accounting|accounts',
    promise: 'Books kept tidy and up to date, by one person who knows your numbers.',
    services: [
      {
        name: 'Monthly bookkeeping',
        type: 'ONGOING',
        description:
          'Receipts, invoices and bank transactions kept up to date, with a short monthly summary.',
        price: 'From £120 / month',
        detail: 'Example · rolling monthly',
      },
      {
        name: 'Catch-up project',
        type: 'BACK ON TRACK',
        description: 'Behind on the books? An agreed scope to bring every record up to date.',
        price: 'From £450 / project',
        detail: 'Example · scope agreed first',
      },
      {
        name: 'Software set-up session',
        type: 'ONE-OFF',
        description: 'Help choosing and setting up bookkeeping software, with written steps.',
        price: '£95 / session',
        detail: 'Example · online or in person',
      },
      {
        name: 'Year-end preparation',
        type: 'ONCE A YEAR',
        description: 'Records organised for your year-end, with a checklist of what is needed.',
        price: 'From £300',
        detail: 'Example · quoted per business',
      },
    ],
    clients: [
      'Sole traders',
      'Trades & local services',
      'Shops & hospitality',
      'Landlords',
      'Small limited companies',
    ],
    cases: [
      {
        sector: 'Family-run café',
        title: 'From shoebox to monthly routine',
        problem: 'Receipts piled up and month-end took a whole weekend.',
        outcome: 'A simple monthly routine and books that stay up to date.',
      },
      {
        sector: 'Self-employed electrician',
        title: 'Months behind, back on track',
        problem: 'Bank statements and invoices had not been touched for months.',
        outcome: 'Every record brought up to date, with a checklist for each month.',
      },
      {
        sector: 'Small online shop',
        title: 'One clear picture of the numbers',
        problem: 'Sales came in from three places and nobody knew the totals.',
        outcome: 'One set of tidy records and a short summary every month.',
      },
    ],
    topics: [
      'Keeping my books up to date',
      'Catching up on old records',
      'Setting up bookkeeping software',
      'Getting ready for year-end',
      'Not sure yet, just a chat',
    ],
  },
  coach: {
    match: 'coach|trainer|mentor',
    promise: 'Clear goals, steady habits and someone in your corner. One-to-one, start to finish.',
    services: [
      {
        name: 'Monthly coaching',
        type: 'ONGOING',
        description: 'Regular one-to-one sessions, with check-ins between them and simple goals.',
        price: 'From £180 / month',
        detail: 'Example · rolling monthly',
      },
      {
        name: 'Focus programme',
        type: 'ONE GOAL',
        description: 'Six weeks on one clear goal, with a plan, weekly sessions and a finish line.',
        price: 'From £450 / programme',
        detail: 'Example · six weekly sessions',
      },
      {
        name: 'Single session',
        type: 'ONE-OFF',
        description: 'An hour on what matters most right now, with notes and next steps after.',
        price: '£75 / session',
        detail: 'Example · online or in person',
      },
      {
        name: 'Group workshop',
        type: 'FOR GROUPS',
        description: 'A half-day session for a team or small group, with exercises to keep.',
        price: 'From £400',
        detail: 'Example · up to 12 people',
      },
    ],
    clients: [
      'Career changers',
      'New managers',
      'Small business owners',
      'Returners to work',
      'Teams & groups',
    ],
    cases: [
      {
        sector: 'Career changer',
        title: 'A plan for the next step',
        problem: 'Ready for a change, but stuck on where to start.',
        outcome: 'A short list of options and one small step taken each week.',
      },
      {
        sector: 'New team manager',
        title: 'Finding confidence in a new role',
        problem: 'Promoted quickly, with no time to learn how to lead.',
        outcome: 'Simple habits for one-to-ones and a calmer working week.',
      },
      {
        sector: 'Small team',
        title: 'One team, one set of goals',
        problem: 'Everyone was busy, but pulling in different directions.',
        outcome: 'A half-day workshop and goals the whole team agreed.',
      },
    ],
    topics: [
      'Ongoing coaching',
      'Working towards one goal',
      'A one-off session',
      'A workshop for my team',
      'Not sure yet, just a chat',
    ],
  },
  designer: {
    match: 'design|marketing|brand|copywrit',
    promise: 'Design and marketing that sounds like you. One person, from first idea to launch.',
    services: [
      {
        name: 'Monthly marketing support',
        type: 'ONGOING',
        description: 'Social posts, emails and small design jobs each month, planned together.',
        price: 'From £400 / month',
        detail: 'Example · rolling monthly',
      },
      {
        name: 'Brand refresh',
        type: 'ONE PROJECT',
        description: 'A tidy logo, colours, fonts and a short guide, so everything looks like you.',
        price: 'From £950 / project',
        detail: 'Example · scope agreed first',
      },
      {
        name: 'Design review session',
        type: 'ONE-OFF',
        description: 'A look at your website, leaflets or social pages, with written suggestions.',
        price: '£120 / session',
        detail: 'Example · online or in person',
      },
      {
        name: 'Launch campaign',
        type: 'FOR A LAUNCH',
        description: 'Planned posts, emails and graphics for a new product, offer or opening.',
        price: 'From £600',
        detail: 'Example · quoted per launch',
      },
    ],
    clients: [
      'Independent shops',
      'Cafés & restaurants',
      'Start-ups',
      'Charities',
      'Local services',
    ],
    cases: [
      {
        sector: 'Independent bakery',
        title: 'A brand that looks like the shop',
        problem: 'The logo, menu and social pages all looked different.',
        outcome: 'One set of colours, fonts and templates the owner can reuse.',
      },
      {
        sector: 'Local studio',
        title: 'A planned launch, not a rush',
        problem: 'A new timetable launch was being planned the night before.',
        outcome: 'A simple month-long plan of posts, emails and posters.',
      },
      {
        sector: 'Community charity',
        title: 'Leaflets anyone can update',
        problem: 'Every event meant starting a new design from scratch.',
        outcome: 'Easy templates that volunteers can edit themselves.',
      },
    ],
    topics: [
      'Regular marketing help',
      'Refreshing my brand',
      'A review of my designs',
      'Planning a launch',
      'Not sure yet, just a chat',
    ],
  },
  tech: {
    match: '\\bit\\b|developer|tech|software|programm|computer',
    promise: 'Tech that just works, explained in plain English. One person to call.',
    services: [
      {
        name: 'Monthly IT support',
        type: 'ONGOING',
        description: 'Help when something breaks, updates kept on track and a monthly check.',
        price: 'From £150 / month',
        detail: 'Example · rolling monthly',
      },
      {
        name: 'Website or app project',
        type: 'ONE PROJECT',
        description: 'A clear brief, an agreed scope and a working result, built and handed over.',
        price: 'From £1,200 / project',
        detail: 'Example · scope agreed first',
      },
      {
        name: 'Tech health check',
        type: 'ONE-OFF',
        description: 'A review of your devices, accounts and back-ups, with plain next steps.',
        price: '£110 / session',
        detail: 'Example · online or on site',
      },
      {
        name: 'Team training',
        type: 'FOR YOUR TEAM',
        description: 'A half-day session on the tools your team uses, with simple guides after.',
        price: 'From £450',
        detail: 'Example · up to 10 people',
      },
    ],
    clients: ['Small offices', 'Shops & cafés', 'Clinics & studios', 'Charities', 'Home workers'],
    cases: [
      {
        sector: 'Four-person office',
        title: 'Back-ups that actually run',
        problem: 'Important files lived on one laptop, with no back-up.',
        outcome: 'Automatic back-ups and a simple check each month.',
      },
      {
        sector: 'Local clinic',
        title: 'Bookings, set up properly',
        problem: 'Staff juggled paper diaries and a spreadsheet.',
        outcome: 'One online booking system and a short guide for staff.',
      },
      {
        sector: 'Family shop',
        title: 'Old laptops, new routine',
        problem: 'Slow devices and passwords written on sticky notes.',
        outcome: 'Updated devices, a password manager and a plain-English guide.',
      },
    ],
    topics: [
      'Ongoing IT support',
      'A website or app project',
      'A tech health check',
      'Training for my team',
      'Not sure yet, just a chat',
    ],
  },
  consultant: {
    match: 'consult',
    promise: 'Clear, practical help for small businesses. One person, start to finish.',
    services: [
      {
        name: 'Monthly support',
        type: 'ONGOING',
        description:
          'A regular check-in, help between meetings and a short monthly summary of what changed.',
        price: 'From £350 / month',
        detail: 'Example · rolling monthly',
      },
      {
        name: 'Fix-it project',
        type: 'ONE PROBLEM, SOLVED',
        description:
          'One clear goal, an agreed scope and a finish line. Ideal when something has got stuck.',
        price: 'From £900 / project',
        detail: 'Example · scope agreed first',
      },
      {
        name: 'Advice session',
        type: 'ONE-OFF',
        description:
          'Ninety focused minutes on your question, with written next steps the same week.',
        price: '£140 / session',
        detail: 'Example · online or in person',
      },
      {
        name: 'Team workshop',
        type: 'FOR YOUR TEAM',
        description:
          'A half-day session that gets everyone working from the same plan, with notes afterwards.',
        price: 'From £480',
        detail: 'Example · up to 10 people',
      },
    ],
    clients: [
      'Trades & local services',
      'Shops & hospitality',
      'Start-ups',
      'Charities & community groups',
      'Family businesses',
    ],
    cases: [
      {
        sector: 'Family-run shop',
        title: 'From shoebox to monthly routine',
        problem: 'Paperwork piled up and month-end took a whole weekend.',
        outcome: 'A simple monthly routine the owner can follow in an afternoon.',
      },
      {
        sector: 'Growing trades business',
        title: 'A plan for the next hire',
        problem: 'Too much work, not enough hands, and no clear time to hire.',
        outcome: 'A one-page plan with the costs, timing and first steps agreed.',
      },
      {
        sector: 'Local charity',
        title: 'One plan the whole team shares',
        problem: 'Volunteers and staff were pulling in different directions.',
        outcome: 'A half-day workshop and a shared plan everyone signed up to.',
      },
    ],
    topics: [
      'Monthly support',
      'Fixing one problem',
      'A one-off advice session',
      'A workshop for my team',
      'Not sure yet, just a chat',
    ],
  },
};

export const consultantDemo = {
  id: 'consultant-07',
  route: '/templates/website/motion/consultant-07/',
  name: 'Morgan Ellis',
  monogram: 'ME',
  role: 'Business consultant',
  area: 'Dundee',
  titleSuffix: ' — Website demo by FinTaxTech',
  label: 'Signature · consultant-07 · website demo',
  hero: {
    tagline: rolePresets.consultant.promise,
    description:
      'You get straight answers, a plan you can follow, and someone who picks up the phone. Online or in person.',
    action: 'Book a free 15-minute call',
    note: 'A fictional professional. Example services, prices and availability.',
  },
  services: serviceIds.map((id, i) => ({ id, ...rolePresets.consultant.services[i] })),
  clients: rolePresets.consultant.clients,
  process: [
    [
      'Listen',
      'A short call about where things stand, what is getting in the way and what good would look like.',
    ],
    [
      'Plan',
      'The tangle becomes a few clear priorities, an agreed scope and a price before any work starts.',
    ],
    [
      'Deliver',
      'Steady progress with regular check-ins. On your finished website, clients could book their next call here.',
    ],
  ],
  cases: rolePresets.consultant.cases.map((item, i) => ({ kind: caseKinds[i], ...item })),
  about: [
    'I work with people who want someone in their corner: clear advice, honest opinions and work that gets finished.',
    'Most clients come to me with one problem and stay for the steady support. I keep things plain-spoken, practical and on budget.',
  ],
  reviews: [
    {
      initials: 'LC',
      name: 'Laura C.',
      date: '3 weeks ago',
      text: 'Listened properly, then turned a messy problem into three things I could actually do. It was the first time in months I felt on top of it.',
    },
    {
      initials: 'DM',
      name: 'David M.',
      date: '2 months ago',
      text: 'Plain-spoken and no jargon. The regular check-ins keep me honest, and the notes are short enough to read.',
    },
    {
      initials: 'PS',
      name: 'Priya S.',
      date: '4 months ago',
      text: 'Friendly, organised and easy to reach. We still use the plan on our wall every week.',
    },
  ],
  hours: [
    ['Monday – Thursday', '09:00 – 17:30'],
    ['Friday', '09:00 – 13:00'],
    ['Evenings', 'By appointment'],
    ['Weekends', 'Closed'],
  ],
  questions: [
    [
      'What happens on the free 15-minute call?',
      'Example answer: we talk about where things stand and whether I am the right fit. No obligation, and you leave with at least one useful next step.',
    ],
    [
      'Do you work online or in person?',
      'Example answer: both. Most clients mix video calls with an occasional visit. Your real arrangements and travel area go here.',
    ],
    [
      'How do prices work?',
      'Example answer: ongoing work is a fixed monthly fee, and one-off work is quoted after the first call. Your real prices, terms and VAT details go here.',
    ],
    [
      'Can I book from this page?',
      'This is a sample website. The call booking sends nothing and reserves no time. The FinTaxTech enquiry links are for discussing your own website.',
    ],
  ],
  flow: {
    topics: rolePresets.consultant.topics,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    times: ['09:30', '11:00', '13:30', '15:00', '16:30'],
  },
  nameDialog: {
    title: 'Put your name on it.',
    description:
      'Try your own name or business name. For example, Sarah Reid. It stays in this page and its shareable link.',
  },
  contactNotes: {
    call: 'On your finished website, Call would ring you directly. Add your number to the preview link to try it.',
    message:
      'On your finished website, WhatsApp would open a chat with you. Add your number to the preview link to try it.',
    directions:
      'Your finished website could link to directions for where you meet clients. This is a local map placeholder, with no map service loaded.',
  },
} as const;
