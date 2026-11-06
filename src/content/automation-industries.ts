export const industryDirectory = {
  route: '/templates/ai-automation/',
  title: 'AI automation by industry',
  description:
    'Explore ten examples of how FinTaxTech can help teams automate repetitive work, with practical questions and answers for each industry.',
};

export const retailGuide = {
  route: industryDirectory.route + 'retail-ecommerce/',
  title: 'Retail & e-commerce',
  description:
    'Follow a customer email from order lookup to a team-approved reply, and see how to test AI-assisted retail support in your shop.',
};

export type FAQ = [question: string, answer: string];
interface Industry {
  title: string;
  summary: [workflow: string, outcome: string];
  guide?: string;
  faqs: FAQ[];
}

export const industries: Industry[] = [
  {
    title: retailGuide.title,
    guide: retailGuide.route,
    summary: [
      'We can match a customer’s email to their order and draft a reply using your delivery or returns policy.',
      'Your support team sees the order details and suggested answer together, ready to check and send.',
    ],
    faqs: [
      [
        'Can we start with delivery questions alone?',
        'Yes. Start with one inbox and one frequent question, such as “Where is the rest of my order?” We can build and test that lookup before adding exchanges or returns.',
      ],
      [
        'Who decides whether to offer a refund?',
        'Your authorised team member makes that decision. The workflow can bring together the order, the customer’s message and the relevant policy for review.',
      ],
    ],
  },
  {
    title: 'Accounting & bookkeeping',
    summary: [
      'We can read supplier invoices and prepare draft entries with the supplier name, invoice number, tax and total.',
      'Your bookkeeper can check the figures against the original and spot possible duplicates before posting.',
    ],
    faqs: [
      [
        'What if two suppliers use the same invoice number?',
        'A duplicate check can compare supplier, invoice number, date and amount together. A potential match goes to the bookkeeper with both documents attached.',
      ],
      [
        'What happens to a blurry invoice?',
        'The draft can flag the unreadable field and show the source document. Your bookkeeper can enter the correct figure or request a clearer copy.',
      ],
    ],
  },
  {
    title: 'Property & lettings',
    summary: [
      'We can turn a tenant’s maintenance email into a job request with the property address, reported fault and access details.',
      'Your property manager can see what’s missing and assign the right contractor without retyping the email.',
    ],
    faqs: [
      [
        'What if the tenant leaves out their flat number?',
        'The request can stay unassigned with the address marked incomplete. The property manager can review a draft asking for the missing detail.',
      ],
      [
        'Can we keep our existing urgent-repair procedure?',
        'Yes. We agree which messages should go straight to your duty team and where to display your emergency contact instructions. Staff retain control of urgency and dispatch.',
      ],
    ],
  },
  {
    title: 'Construction & trades',
    summary: [
      'We can turn a site visit voice note into a draft scope of work, grouping measurements, materials and tasks by room.',
      'Your estimator checks quantities and adds prices before sending the quote.',
    ],
    faqs: [
      [
        'What if the recording leaves out a measurement?',
        'The draft can list the missing measurement against the room and task. Your estimator can check the site notes or arrange a follow-up before pricing.',
      ],
      [
        'Can we use our own quote format?',
        'We can map the draft into your existing headings, such as preparation, materials and labour. Your estimator reviews each section before it reaches the customer.',
      ],
    ],
  },
  {
    title: 'Hotels & hospitality',
    summary: [
      'We can draft replies to guest questions using your check-in instructions, parking details and breakfast times.',
      'Reception can answer routine questions quickly and give personal attention to requests such as an accessible room.',
    ],
    faqs: [
      [
        'How do seasonal breakfast times stay accurate?',
        'Reception can maintain one approved schedule with dates for each season. When dates overlap or a time is missing, the question goes to staff.',
      ],
      [
        'Can it promise a particular room to a guest?',
        'The workflow can identify the request and pass it to reception. Staff check the room’s features and availability before confirming anything to the guest.',
      ],
    ],
  },
  {
    title: 'Manufacturing',
    summary: [
      'We can extract part numbers, quantities and requested delivery dates from purchase orders, even when customers use different layouts.',
      'Your sales team reviews a draft order, with unfamiliar parts or missing details flagged before production planning.',
    ],
    faqs: [
      [
        'Can it recognise a customer’s own part codes?',
        'We can use a mapping your team approves to match customer codes to your catalogue. An unfamiliar code goes into review with the original order line.',
      ],
      [
        'What if a customer orders boxes but we stock units?',
        'The workflow can use an approved pack size to propose a quantity in units. Your team sees the conversion and checks any line without a confirmed pack size.',
      ],
    ],
  },
  {
    title: 'Transport & logistics',
    summary: [
      'We can match delivery notes and proof-of-delivery documents to the correct shipment.',
      'Your dispatch team gets a list of missing signatures and reported damage while completed deliveries move on to billing.',
    ],
    faqs: [
      [
        'How would a missing signature show up?',
        'Where a signature is required, dispatch can receive a review item with the shipment reference and the delivery document. Staff can follow up with the driver.',
      ],
      [
        'What about a delivery split across two vehicles?',
        'We can track each expected delivery note against the same shipment. Billing readiness follows the completion rules your dispatch team agrees.',
      ],
    ],
  },
  {
    title: 'Healthcare & dental practices',
    summary: [
      'We can sort appointment requests, cancellation messages and billing enquiries into the right reception queues.',
      'Staff can use approved booking information to reply, while clinical questions go to a qualified professional.',
    ],
    faqs: [
      [
        'What if a booking email also mentions symptoms?',
        'A mixed or unclear message should go to a staff review queue. Your practice sets the handover procedure and a qualified professional handles the clinical content.',
      ],
      [
        'What should we share for an initial discussion?',
        'Describe the categories of reception work and use fictional messages to illustrate them. We assess access and data handling with your practice before considering real records.',
      ],
    ],
  },
  {
    title: 'Legal services',
    summary: [
      'We can organise incoming case documents and build a draft timeline, with each date linked to its source.',
      'Your legal team can verify the sequence and spot gaps before preparing for a client meeting.',
    ],
    faqs: [
      [
        'Can a reviewer trace a date back to its document?',
        'Each proposed event can carry a document reference, page number where available, and the text it came from. The reviewer can open the source before accepting the entry.',
      ],
      [
        'What happens when two accounts give different dates?',
        'The draft can show both entries with their respective sources and flag the conflict for the matter team. A reviewer decides how to record it.',
      ],
    ],
  },
  {
    title: 'Marketing & creative agencies',
    summary: [
      'We can turn a client meeting transcript into a draft brief covering the audience, deliverables, deadlines and open questions.',
      'Your account manager can confirm what was agreed before the creative team starts work.',
    ],
    faqs: [
      [
        'How are suggestions kept separate from agreed deliverables?',
        'The draft can separate confirmed decisions from ideas and quote the meeting passage behind each item. The account manager checks that distinction before sharing the brief.',
      ],
      [
        'Can it flag a deadline that was never agreed?',
        'Yes. A date mentioned as a possibility can go under open questions, ready for the account manager to confirm with the client.',
      ],
    ],
  },
];
