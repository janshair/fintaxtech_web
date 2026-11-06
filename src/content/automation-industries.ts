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
type LabeledText = [label: string, text: string];
interface WorkflowGuide {
  intro: string;
  exampleTitle: string;
  input: LabeledText;
  evidence: LabeledText[];
  output: LabeledText;
  steps: LabeledText[];
  preparation: string;
  pilot: LabeledText;
  extraFaqs: FAQ[];
  enquiry: LabeledText;
}
interface Industry {
  title: string;
  summary: [workflow: string, outcome: string];
  slug: string;
  linkLabel: string;
  workflow?: WorkflowGuide;
  faqs: FAQ[];
}

export const industries: Industry[] = [
  {
    title: retailGuide.title,
    slug: 'retail-ecommerce',
    linkLabel: 'Explore the retail workflow',
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
    slug: 'accounting-bookkeeping',
    linkLabel: 'Reviewing supplier invoices',
    workflow: {
      intro:
        'A supplier sends a bill as a PDF, then forwards it again when they ask about payment. We can prepare one draft entry, keep the original beside it and bring a possible duplicate to your bookkeeper’s attention.',
      exampleTitle: 'One bill, two emails',
      input: [
        'Supplier’s email',
        '“Could you confirm you received invoice P-271 for £288? I’ve attached it again.”',
      ],
      evidence: [
        ['Invoice details', 'Paper & Ink Supplies · P-271 · £240 net and £48 tax as printed'],
        ['Earlier entry', 'Same supplier, reference and £288 total in Tuesday’s draft batch'],
      ],
      output: [
        'For the bookkeeper',
        'Hold the new attachment for comparison. Open Tuesday’s copy alongside today’s copy, check whether either is a revision, and decide which entry to keep.',
      ],
      steps: [
        [
          'Read the supplier’s document.',
          'Pick out the reference, issue date, totals and currency. Keep each amount next to the page it came from. Missing digits or a total that fails to reconcile go into review.',
        ],
        [
          'Compare against existing entries.',
          'Search within the relevant supplier account. Compare reference, total and date together so an unrelated bill with the same number does not get discarded.',
        ],
        [
          'Prepare the entry.',
          'Match the approved supplier record and propose the fields your accounts system accepts. Your bookkeeper confirms coding, tax treatment and any exception before posting.',
        ],
      ],
      preparation:
        'Share your field list, the format your accounts tool accepts and the checks your bookkeeper already makes. Fictional samples of a normal invoice, a revised invoice and a credit note are enough for the first discussion.',
      pilot: [
        'Pilot one supplier batch',
        'Replay a previously checked batch and compare each extracted amount, duplicate flag and correction with the original bill. Count both missed duplicates and valid bills held unnecessarily before trying live drafts.',
      ],
      extraFaqs: [
        [
          'Would a changed bank account go into the supplier record?',
          'We can flag a difference for your existing supplier-verification process. Updating payment details and releasing funds stay with authorised staff.',
        ],
        [
          'Can we start with a spreadsheet?',
          'Yes. A review sheet can contain one row per invoice and a reference back to its PDF. After the pilot, we can assess an import into your accounting tool.',
        ],
      ],
      enquiry: [
        'Which bills take the longest to enter?',
        'Tell us where supplier invoices arrive and which fields your bookkeeper checks twice.',
      ],
    },
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
    slug: 'property-lettings',
    linkLabel: 'Handling a maintenance request',
    workflow: {
      intro:
        'A tenant can explain a fault in one sentence. The property manager still needs the right unit, a usable description and agreed access before assigning the job. We can bring those pieces into one maintenance ticket.',
      exampleTitle: 'A leak report with an incomplete address',
      input: [
        'Tenant’s email',
        '“The tap under the kitchen sink is dripping at Cedar Court. I’m usually home after four.”',
      ],
      evidence: [
        ['Property register', 'Cedar Court contains several flats'],
        ['Access information', 'After 4 pm is a preference; entry permission is unconfirmed'],
      ],
      output: [
        'Draft maintenance ticket',
        'Kitchen sink leak, unit to confirm. Ask which flat is affected and confirm access arrangements. Route the original message to the duty team under the property’s repair procedure.',
      ],
      steps: [
        [
          'Identify the property.',
          'Match the sender and address against records the manager is allowed to use. Where several units fit, show the possible matches for staff.',
        ],
        [
          'Capture the tenant’s words.',
          'Extract the location of the fault, reported symptoms and any attachments. Preserve uncertainty about the cause for the contractor who will inspect it.',
        ],
        [
          'Hand over to the manager.',
          'Apply the agency’s escalation rules, highlight missing details and prepare questions. The manager determines urgency, agrees entry and chooses the contractor.',
        ],
      ],
      preparation:
        'We need your ticket fields, property naming conventions, duty rota and access rules. Walk us through one routine repair and one message your team escalates immediately.',
      pilot: [
        'Pilot one maintenance inbox',
        'Compare draft tickets with completed cases from one building. Check for wrong-unit matches, overlooked urgent reports and repeated questions. Keep the duty team’s existing intake route available during the trial.',
      ],
      extraFaqs: [
        [
          'What if a tenant emails twice about the same problem?',
          'The workflow can show open tickets for the unit and suggest a possible match. The manager can attach the update or open a separate job.',
        ],
        [
          'Could a contractor receive the tenant’s whole email history?',
          'The handover can be limited to approved job details, such as the confirmed unit, fault and access arrangement. The manager reviews what goes out.',
        ],
      ],
      enquiry: [
        'Where do repair details get lost?',
        'Describe the journey from the tenant’s first message to a contractor receiving a usable job ticket.',
      ],
    },
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
    slug: 'construction-trades',
    linkLabel: 'Preparing a scope from site notes',
    workflow: {
      intro:
        'After a site visit, someone has to turn a quick voice note into work the customer can recognise and the estimator can price. A draft organised by room gives the estimator somewhere useful to start.',
      exampleTitle: 'A decorator’s note becomes a quote outline',
      input: [
        'Site voice note',
        '“Hallway walls are twelve square metres. Two coats. Customer will supply the paint. Bedroom ceiling still needs measuring.”',
      ],
      evidence: [
        ['Confirmed work', 'Hallway walls · 12 m² · Two coats · Customer supplies paint'],
        ['Open question', 'Bedroom ceiling area still to measure'],
      ],
      output: [
        'Scope for the estimator',
        'Include the hallway painting under labour. Leave the bedroom ceiling for measurement. Ask the estimator to confirm preparation work before adding quantities or a price.',
      ],
      steps: [
        [
          'Transcribe by room.',
          'Put each task under its location and retain a reference to the recording. Mark an unclear unit so the estimator can listen to that passage.',
        ],
        [
          'Separate commitments from options.',
          'Distinguish requested work, customer-supplied materials and suggestions discussed on site. Carry “still needs measuring” forward as an open item.',
        ],
        [
          'Prepare a quote draft.',
          'Place checked items under your standard headings. The estimator confirms dimensions, materials, rates and exclusions before issuing the quote.',
        ],
      ],
      preparation:
        'Show us a blank quote template and a fictional site note. Explain which rates a supervisor approves and how your team records work that must be surveyed again.',
      pilot: [
        'Pilot one type of job',
        'Start with a familiar job, such as interior decorating. Compare room assignments, units and exclusions with the estimator’s checked scope. Record any missed task that could change the price.',
      ],
      extraFaqs: [
        [
          'Can a correction made later in the recording be picked up?',
          'The draft can surface both mentions with their timestamps. The estimator chooses the confirmed measurement before it enters the quote.',
        ],
        [
          'What if the customer changes the scope afterwards?',
          'Record the change against the original draft with its source and date. Your team reviews the effect on price and timing before issuing a revision.',
        ],
      ],
      enquiry: [
        'What do your estimators rewrite after a visit?',
        'Tell us about one repeatable job and the information you need before you can price it.',
      ],
    },
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
    slug: 'hotels-hospitality',
    linkLabel: 'Answering guest enquiries',
    workflow: {
      intro:
        'One guest email can contain an easy question about arrival and a request only reception can confirm. We can prepare the routine part from approved property information and keep the reservation decision with the front desk.',
      exampleTitle: 'A late arrival with a room request',
      input: [
        'Guest’s email',
        '“We expect to arrive at 11 pm on Friday. Can we check in then, and is a step-free room available?”',
      ],
      evidence: [
        [
          'Arrival instructions',
          'This fictional hotel’s Friday reception hours extend to midnight',
        ],
        [
          'Reservation check',
          'Step-free room features and availability require staff confirmation',
        ],
      ],
      output: [
        'Reply for reception',
        '“Reception is open until midnight this Friday, so an 11 pm arrival is within our check-in hours. We’re checking the room features and availability for your stay and will confirm those separately.”',
      ],
      steps: [
        [
          'Match the property and stay dates.',
          'Select instructions for the correct hotel, day and season. If the group has two hotels with similar names, reception confirms the location.',
        ],
        [
          'Find approved guest information.',
          'Attach the current arrival instructions and their effective dates to the draft. Flag special dates or conflicting policies for staff.',
        ],
        [
          'Review commitments.',
          'Separate general information from room allocations, charges and exceptions. Reception verifies the booking through its usual process before confirming a request.',
        ],
      ],
      preparation:
        'Bring your current guest information pack, seasonal changes and a list of requests that need a supervisor. Pick one member of staff to own updates to the source material.',
      pilot: [
        'Pilot one property',
        'Try a sample of arrival questions spanning weekdays, weekends and holiday dates. Check the policy selected, time spent editing and whether any draft promised an unconfirmed service.',
      ],
      extraFaqs: [
        [
          'Can replies follow the hotel’s tone?',
          'Yes. Reception can supply a few approved examples of greetings, directions and sign-offs. Staff can edit the draft for the individual guest.',
        ],
        [
          'How would another language be handled?',
          'Start with languages staff can review. Keep names, dates, fees and accessibility details beside the original message so a reviewer can verify the wording.',
        ],
      ],
      enquiry: [
        'Which questions reach reception every day?',
        'Tell us which property information your team looks up most often and where it is maintained.',
      ],
    },
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
    slug: 'manufacturing',
    linkLabel: 'Converting purchase orders into sales drafts',
    workflow: {
      intro:
        'Customers can order the same component under different codes and in different pack sizes. We can read each purchase order against your approved catalogue, with the original wording visible to the person releasing the sales order.',
      exampleTitle: 'An order in boxes, a catalogue in units',
      input: [
        'Purchase order line',
        '“PO 814, line 2: six boxes of B14 brackets, requested for 18 June.”',
      ],
      evidence: [
        ['Approved cross-reference', 'Customer B14 maps to internal part BR-014'],
        ['Pack record', '20 brackets per box · Requested quantity equals 120 units'],
      ],
      output: [
        'Draft sales order line',
        'BR-014 · 120 units · Requested date 18 June. Sales checks the part revision and confirms availability before committing a delivery date.',
      ],
      steps: [
        [
          'Read each order line.',
          'Capture the customer reference, part code, quantity, unit and requested date alongside the original page and line.',
        ],
        [
          'Check the catalogue.',
          'Use an approved cross-reference and pack size. A discontinued code, missing revision or unclear unit puts the affected line on hold.',
        ],
        [
          'Release checked lines.',
          'Sales verifies the proposed quantities, checks availability in its usual system and approves the order. Planning receives the confirmed version.',
        ],
      ],
      preparation:
        'Show us the approved catalogue, customer-specific code mappings, pack-size owner and the fields your sales system accepts. Choose a product family with well-maintained records.',
      pilot: [
        'Pilot one customer’s orders',
        'Compare draft lines with sales orders your team has already checked. Include a changed pack size and an unknown part. Measure quantity errors and exceptions as well as entry time.',
      ],
      extraFaqs: [
        [
          'What if a revised purchase order arrives?',
          'Match it to the customer’s PO reference and show the lines that changed. Sales decides whether to amend an existing order.',
        ],
        [
          'Can a requested date become a promise by mistake?',
          'Keep requested and confirmed delivery dates in separate fields. Your team fills the confirmation after its capacity and stock checks.',
        ],
      ],
      enquiry: [
        'Which orders take longest to enter?',
        'Describe one customer format, one product family and the mismatches sales staff check today.',
      ],
    },
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
    slug: 'transport-logistics',
    linkLabel: 'Reconciling proof of delivery',
    workflow: {
      intro:
        'A shipment can be marked delivered while the paperwork tells a more complicated story. We can match delivery notes to the right leg, extract discrepancies and give dispatch a short list of items to resolve before billing.',
      exampleTitle: 'A delivery note records a damaged carton',
      input: [
        'Driver’s note',
        '“Shipment D-608: nine cartons accepted. One returned with a crushed corner.”',
      ],
      evidence: [
        ['Dispatch record', 'Ten cartons expected at the receiving depot'],
        ['Delivery evidence', 'Signed note for nine cartons · Damage photo attached'],
      ],
      output: [
        'Dispatch review item',
        'Link the note and photo to D-608. Record one returned carton and hold the billing handover until dispatch checks the discrepancy against the customer’s terms.',
      ],
      steps: [
        [
          'Identify the delivery leg.',
          'Read the shipment reference, stop and delivery date from the note. Flag a reused reference or ambiguous stop rather than attaching evidence to the wrong job.',
        ],
        [
          'Compare expected and received items.',
          'Put the recorded count beside the planned count. Highlight damage notes and missing evidence for dispatch to inspect.',
        ],
        [
          'Hand over completed records.',
          'Apply the completion rules agreed for that customer. Dispatch resolves exceptions and billing receives a reference to the approved supporting documents.',
        ],
      ],
      preparation:
        'Describe where notes and photos arrive, how a shipment is identified across multiple stops and which documents billing expects. Use sample paperwork without real consignee details.',
      pilot: [
        'Pilot one route or depot',
        'Replay a batch that includes partial loads, duplicate photos and unsigned notes. Compare the proposed handover with dispatch’s final decision and check how long exceptions take to resolve.',
      ],
      extraFaqs: [
        [
          'What if a driver uploads a note after billing preparation starts?',
          'Match the new evidence to the open shipment and surface the update for dispatch. A staff member decides whether the billing handover needs revising.',
        ],
        [
          'Can a photo confirm that the goods were accepted?',
          'A photo can be attached as supporting evidence. Acceptance follows the agreed customer rules and the documents checked by dispatch.',
        ],
      ],
      enquiry: [
        'Which delivery documents hold up billing?',
        'Tell us what counts as a complete delivery record and where dispatch currently finds the evidence.',
      ],
    },
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
    slug: 'healthcare-dental',
    linkLabel: 'Sorting reception requests',
    workflow: {
      intro:
        'A single message can ask to move an appointment and raise a question for a clinician. We can help reception separate the administrative work from the clinical handover while keeping the original message intact.',
      exampleTitle: 'A cancellation with a follow-up question',
      input: [
        'Message to reception',
        '“Please move my Tuesday appointment. I also have a question for the dentist about my last visit.”',
      ],
      evidence: [
        ['Reception task', 'Verify the booking using the practice’s existing identity checks'],
        [
          'Clinical handover',
          'Send the original question to the designated member of the practice team',
        ],
      ],
      output: [
        'Reception draft',
        '“We can help rearrange your appointment and pass your question to the dentist. Please use our usual booking contact to confirm which appointment you would like to change.”',
      ],
      steps: [
        [
          'Identify the administrative request.',
          'Group messages using categories approved by reception, such as booking changes and billing questions. Unclear, mixed or potentially urgent messages follow the practice’s staff-review procedure.',
        ],
        [
          'Prepare the handover.',
          'Keep the original message available to authorised staff and expose only the information each queue needs. The practice determines who assesses clinical content.',
        ],
        [
          'Confirm the action.',
          'Reception checks identity, booking details and available times before changing a slot or sending a reply. Clinical assessment stays with qualified staff.',
        ],
      ],
      preparation:
        'Start with fictional messages and a diagram of reception queues. Agree access, retention, permitted systems and escalation ownership with the practice before any decision about live data.',
      pilot: [
        'Pilot with fictional cases',
        'Include a routine cancellation, an ambiguous request and a booking message containing a clinical question. Check every handover with the practice lead and keep existing urgent contact routes in operation.',
      ],
      extraFaqs: [
        [
          'Could this select treatment or decide how urgent symptoms are?',
          'This example covers administrative routing. Clinical decisions and assessments of urgency belong to the practice’s qualified team under its own procedures.',
        ],
        [
          'What if the calendar connection is unavailable?',
          'Keep the request in the reception queue. Staff can check the booking system directly before offering a time or confirming a change.',
        ],
      ],
      enquiry: [
        'Which reception queue would you start with?',
        'Describe the message types and staff roles using fictional examples, without sharing patient information.',
      ],
    },
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
    slug: 'legal-services',
    linkLabel: 'Preparing a source-linked chronology',
    workflow: {
      intro:
        'Building a chronology takes time because a date on a letter can differ from the date of the event it describes. We can prepare candidate entries for the matter team, with each event tied to the words and document behind it.',
      exampleTitle: 'Two records describe different delivery dates',
      input: [
        'Covering email',
        '“The equipment arrived on 11 March.” The email itself is dated 14 March.',
      ],
      evidence: [
        ['Source A', 'Email, 14 March · Body states arrival on 11 March'],
        ['Source B', 'Delivery note, page 2 · Signed on 12 March'],
      ],
      output: [
        'Draft chronology entry',
        'Record the email’s account and the signature date separately. Link both sources and ask the reviewer whether the dates refer to arrival and acceptance or need clarification.',
      ],
      steps: [
        [
          'Limit the document set.',
          'Start within the authorised matter folder and retain document identifiers and versions so the reviewer can return to the same source.',
        ],
        [
          'Extract candidate events.',
          'Separate a document’s creation date from dates described in its text. Capture the relevant passage, page or message reference and identify uncertainty.',
        ],
        [
          'Review the chronology.',
          'A member of the matter team checks the passages, corrects dates and approves the working chronology. The team determines the significance of any discrepancy.',
        ],
      ],
      preparation:
        'Use a fictional bundle to demonstrate naming conventions, the expected chronology format and how reviewers record disputed facts. Agree permissions and confidentiality arrangements before considering matter files.',
      pilot: [
        'Pilot a completed sample chronology',
        'Compare proposed events against a reviewer-prepared timeline. Count unsupported dates, missed events and time spent locating each supporting passage. Include amended documents and ambiguous dates in the test.',
      ],
      extraFaqs: [
        [
          'Can it calculate filing deadlines from the documents?',
          'This workflow prepares source-linked factual entries. A qualified reviewer controls deadline calculation and any entry in the firm’s diary.',
        ],
        [
          'What happens when a newer version of a document appears?',
          'Retain the version behind each proposed entry and flag the revised document. The reviewer decides which entries to amend and keeps a record of the change.',
        ],
      ],
      enquiry: [
        'Which bundle takes time to organise?',
        'Describe the document types and review process using a fictional matter rather than client records.',
      ],
    },
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
    slug: 'marketing-creative-agencies',
    linkLabel: 'Turning meetings into briefs',
    workflow: {
      intro:
        'A creative team needs to know what the client approved, what was merely suggested and who owns the next decision. We can turn an authorised transcript into a draft brief with passages the account manager can check.',
      exampleTitle: 'A launch date is suggested during a campaign call',
      input: [
        'Client’s words',
        '“Let’s do three short videos for existing customers. Friday might work for launch, but finance needs to sign off first.”',
      ],
      evidence: [
        ['Confirmed in the call', 'Three short videos · Audience: existing customers'],
        ['Still open', 'Launch date and finance approval'],
      ],
      output: [
        'Draft brief for review',
        'Prepare three short videos for existing customers. Account manager to confirm the launch date after finance sign-off. Keep Friday as a proposed date in the questions list.',
      ],
      steps: [
        [
          'Find decisions in context.',
          'Extract audience, deliverables, owners and deadlines. Link each proposed item to the relevant passage or timestamp so the account manager can hear qualifying words.',
        ],
        [
          'Compare with the agreed scope.',
          'Flag requests outside the current statement of work, including ideas introduced by the agency itself. Keep options separate from confirmed deliverables.',
        ],
        [
          'Approve and hand over.',
          'The account manager corrects the brief, clarifies open questions with the client and approves which tasks enter the project board.',
        ],
      ],
      preparation:
        'Supply a blank brief, your approval roles and a fictional transcript. Agree which meetings may be processed and which client documents the workflow may use for scope checks.',
      pilot: [
        'Pilot one repeatable meeting',
        'Start with campaign kick-offs. Compare drafts with briefs the team actually approved and count ideas incorrectly recorded as commitments. Track how often the creative team has to ask for missing details.',
      ],
      extraFaqs: [
        [
          'Could it create tasks in our project board?',
          'If the board supports an approved connection, it can prepare task drafts. Agree which fields and approvals are required before assigning work.',
        ],
        [
          'What if the client changes direction by email afterwards?',
          'Prepare a proposed revision with the email as its source and identify the affected deliverables. The account manager confirms scope, budget and deadlines before updating the brief.',
        ],
      ],
      enquiry: [
        'What does your team chase after a kick-off?',
        'Tell us which brief fields are often missing and who is responsible for confirming them with the client.',
      ],
    },
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

export const industryGuides = industries.flatMap(({ title, slug, workflow, faqs }) =>
  workflow
    ? [
        {
          title,
          slug,
          route: industryDirectory.route + slug + '/',
          description: workflow.intro,
          workflow,
          faqs: [...faqs, ...workflow.extraFaqs],
        },
      ]
    : [],
);
