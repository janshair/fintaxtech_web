export interface InfoPage {
  title: string;
  intro: string;
  legal?: boolean;
  sections: [string, string][];
}
export const pages: Record<string, InfoPage> = {
  'how-it-works': {
    title: 'A clear process, from first question to final delivery.',
    intro: 'Make the important decisions together, before production begins.',
    sections: [
      [
        '01 · Guided requirements',
        'Choose a service and answer short questions. Your answers remain in this page’s memory and are lost when the page closes or reloads.',
      ],
      [
        '02 · Your enquiry PDF',
        'Review your answers, create the PDF locally, and choose how to share it. Attach the file yourself when using email or WhatsApp.',
      ],
      [
        '03 · FinTaxTech review',
        'We aim to reply within two UK business days. We discuss your goals, assumptions, and project suitability.',
      ],
      [
        '04 · Written proposal',
        'Scope, deliverables, exclusions, timing, revision rounds, ownership, third-party costs, and price are confirmed manually.',
      ],
      [
        '05 · Acceptance and initial payment',
        'Accept in writing, provide billing details, and pay the initial 50%. Work begins after funds clear.',
      ],
      [
        '06 · Production and review',
        'Approve the brief, content, visual direction, and functional work at the agreed stages. Each revision round is one consolidated feedback list.',
      ],
      [
        '07 · Final approval and balance',
        'The final 50% is due at approval, before launch, source-file transfer, or unrestricted final delivery.',
      ],
      [
        '08 · Launch or delivery',
        'Receive the agreed final deliverables and handover. Your business accounts remain yours.',
      ],
      [
        '09 · Defect warranty',
        'A 30-day warranty covers failures against the agreed specification. New requests, unsupported changes, and third-party problems are excluded.',
      ],
    ],
  },
  pricing: {
    title: 'How project pricing works',
    intro: 'Every standard project receives a manual quote after we review the requirements.',
    sections: [
      [
        'A proposal built around your requirements',
        'Your proposal sets out scope, deliverables, exclusions, customer responsibilities, revisions, timing, ownership, warranty, and charges. Proposals normally remain valid for 14 days.',
      ],
      [
        'Two clear payment stages',
        'Normally 50% before work begins and 50% at final approval, before launch or unrestricted delivery. Larger projects may use agreed milestones.',
      ],
      [
        'Third-party costs are separate',
        'Domain, email, platform, app-store, cloud, and licence costs are paid by the customer unless the proposal says otherwise. Bank details appear only on invoices.',
      ],
      [
        'Worldwide work, billed in GBP',
        'International customers cover bank and exchange charges so we receive the full invoiced amount. Tax treatment is confirmed in the proposal and invoice.',
      ],
      [
        'Changes get their own scope',
        'Requests outside the approved scope receive a separate quote. A revision round means one consolidated list of feedback.',
      ],
    ],
  },
  about: {
    title: 'Complexity made clear.',
    intro: 'A global digital partner, registered in Dundee, Scotland.',
    sections: [
      [
        'Finance. Tax. Technology.',
        'Our name reflects a long-term ambition to support more of a business’s needs. Today, FinTaxTech provides technology and creative services. Finance, accountancy, and tax services are not currently available.',
      ],
      [
        'Precision with a human perspective',
        'Our mark brings an F and two T forms together as π: precision, continuity, and making complex problems clear.',
      ],
      [
        'AI-first. Human judgement throughout.',
        'We use AI to support the process, then review and refine the work. A clear brief, deliberate decisions, and human accountability guide delivery.',
      ],
      [
        'Your project, your business accounts',
        'We work remotely with customers worldwide. Your repository, domain, email, analytics, store, and cloud accounts stay in your name.',
      ],
      [
        'Fintaxtech Ltd',
        'Company SC807896. Incorporated 22 April 2024. Registered office: 79 Yarrow Terrace, Dundee, Scotland, DD2 4DX. Information technology consultancy activities.',
      ],
    ],
  },
  contact: {
    title: 'Let’s make your next step clear.',
    intro: 'Tell us what you would like to create, or start with the guided requirements.',
    sections: [
      [
        'Talk to FinTaxTech',
        'Email and WhatsApp are the simplest ways to begin. Zoom meetings are available by arrangement.',
      ],
      [
        'Working hours',
        'Monday to Friday, 09:00–17:00 UK time. We aim to reply within two UK business days.',
      ],
      [
        'Sharing your requirements',
        'Download your enquiry PDF and attach it in your email or WhatsApp app. The website cannot confirm that a message was sent.',
      ],
    ],
  },
  'selected-work': {
    title: 'Selected Work',
    intro: 'Explore a website project from FinTaxTech.',
    sections: [
      ['Ask Appliance Repairs', 'Visit the Ask Appliance Repairs website to explore this project.'],
    ],
  },
  privacy: {
    title: 'Privacy notice',
    intro: 'How Fintaxtech Ltd handles website use and project enquiries.',
    legal: true,
    sections: [
      [
        'Local questionnaire processing',
        'Answers and generated PDFs stay in memory on your device while this page is open. We do not receive them automatically, store them in a database, or place them in analytics or page addresses. Reloading or closing the page clears answers. Downloaded files remain under your control.',
      ],
      [
        'Preferences and analytics',
        'Theme and consent choices may be saved locally. Optional Google Analytics is loaded only after consent and when a measurement ID is configured. No names, answers, company details, passwords, filenames, prices, or PDF contents are sent as analytics events. Hosting providers may process technical request data.',
      ],
      [
        'When you contact us',
        'Email and WhatsApp handoffs open third-party services. We receive information only when you send it through your chosen service. We use enquiry information to respond and prepare a proposal; agreed work is processed to fulfil the contract and relevant legal obligations.',
      ],
      [
        'Retention',
        'Unconverted enquiries: 90 days after last contact. Rejected or withdrawn enquiries: 30 days. Source and temporary files: 60 days after delivery. Final backups: 90 days. Contracts and financial records are retained as legally required, including the relevant six-year tax record period.',
      ],
      [
        'Secure transfer and AI',
        'Source files are shared after engagement through a restricted folder or an agreed secure alternative. Minimise unnecessary sensitive data. Relevant processing providers and safeguards must be confirmed in the proposal; customer material is not used for unrelated training or demonstrations.',
      ],
      [
        'Your choices and rights',
        'Contact ask@fintaxtech.co.uk to request access, correction, deletion, restriction, or to object to relevant processing. Rights depend on the circumstances. You may raise a concern with the UK Information Commissioner’s Office.',
      ],
      [
        'Company outreach',
        'Promotional postal outreach is directed to eligible companies. Contact us to opt out. We keep the minimum suppression information needed to respect that request; campaign procedures require review before use.',
      ],
    ],
  },
  cookies: {
    title: 'Cookies and local preferences',
    intro: 'Optional analytics is your choice.',
    legal: true,
    sections: [
      [
        'Essential preferences',
        'We save your theme and consent choices locally where your browser permits it. Questionnaire answers are kept in page memory, not persistent browser storage.',
      ],
      [
        'Optional analytics',
        'Basic Consent Mode means no analytics library or analytics requests before you accept. When configured and enabled, Google Analytics uses its own cookies to measure anonymous journey behaviour. Manage your choices from the footer at any time.',
      ],
      [
        'Changing your choice',
        'Rejecting analytics stops further event collection and removes accessible analytics cookies. You can also delete cookies and site data through your browser settings.',
      ],
    ],
  },
  terms: {
    title: 'Website terms',
    intro: 'Using this website and preparing an enquiry.',
    legal: true,
    sections: [
      [
        'About this website',
        'This website is operated by Fintaxtech Ltd, company SC807896, registered at 79 Yarrow Terrace, Dundee, Scotland, DD2 4DX. Contact ask@fintaxtech.co.uk.',
      ],
      [
        'Enquiries are not contracts',
        'Creating or sharing an enquiry PDF does not establish a contract or reserve capacity. A project starts only after written acceptance and the agreed initial payment clears.',
      ],
      [
        'Content and availability',
        'Information describes our services and intended process. Project-specific obligations are confirmed in a written proposal. External links are provided for convenience and their content is controlled by their operators.',
      ],
      [
        'Responsible use',
        'Do not misuse the website or submit material you lack authority to share. Nothing here excludes rights or liabilities that cannot lawfully be excluded.',
      ],
    ],
  },
  'service-payment-terms': {
    title: 'Service and payment terms',
    intro: 'Clear scope, written approval, and agreed payment stages.',
    legal: true,
    sections: [
      [
        'Written scope',
        'Proposals define deliverables, exclusions, duties, stages, timing, revisions, fees, tax treatment, licences, and acceptance terms. They normally remain valid for 14 days.',
      ],
      [
        'Payment and delivery',
        'Normally 50% is paid before work begins and 50% at final approval, before launch or unrestricted delivery. Work starts after cleared funds. Third-party fees are separate. International customers cover transfer and exchange costs.',
      ],
      [
        'Approvals and changes',
        'Provide one consolidated feedback list for each agreed revision round. Scope changes require a separate quote. Delays, inactivity, rescheduling, and any restart charge must be agreed in the proposal.',
      ],
      [
        'Ownership',
        'After full payment, the customer owns agreed final deliverables subject to licences and relevant AI-provider terms. Internal prompts, workflows, templates, methods, utilities, and rejected drafts remain ours. Branding source files transfer only where included.',
      ],
      [
        'Warranty',
        'The 30-day defect warranty covers failures against agreed specifications, not new requests, customer changes, unsupported modifications, or third-party failures.',
      ],
    ],
  },
  'ai-content-policy': {
    title: 'AI use and content policy',
    intro: 'AI-assisted delivery, with human review and accountability.',
    legal: true,
    sections: [
      [
        'Our approach',
        'AI output is a starting point. We review, refine, or recreate work and check spelling, usability, and suitability. AI-generated content may contain errors; any fact-checking scope is agreed in the proposal.',
      ],
      [
        'Your authority and privacy',
        'You must have permission to supply and process source material. Remove unnecessary personal data. Highly sensitive, regulated, or privileged material requires review and may be declined.',
      ],
      [
        'Providers and permitted use',
        'Relevant providers and privacy settings are confirmed before processing. Customer material is not used for unrelated training, demonstrations, or portfolio use. Our internal prompts and workflows are not sold as downloadable products.',
      ],
      [
        'Ownership and limitations',
        'Final deliverable rights are subject to applicable provider terms and third-party licences. Trademark availability and legal exclusivity are not guaranteed.',
      ],
    ],
  },
  accessibility: {
    title: 'Accessibility',
    intro: 'We aim for a clear, usable website for everyone.',
    legal: true,
    sections: [
      [
        'Our approach',
        'We target WCAG 2.2 AA through semantic pages, keyboard controls, visible focus, labelled questions, responsive layouts, contrasting themes, and reduced motion support. This is an accessibility commitment, not a claim of independent certification.',
      ],
      [
        'PDF alternatives',
        'Browser-generated PDFs may have limited assistive-technology structure. Your answers remain readable in the HTML review. Contact us if you need a different format or help preparing requirements.',
      ],
      [
        'Report a barrier',
        'Email ask@fintaxtech.co.uk with the page and difficulty encountered. You can also call +44 7884 594929. We aim to reply within two UK business days.',
      ],
    ],
  },
  'refund-cancellation': {
    title: 'Refunds and cancellation',
    intro: 'Cancellation arrangements must be clear before a project begins.',
    legal: true,
    sections: [
      [
        'Before acceptance',
        'Generating a PDF creates no payment obligation or reservation. Project terms are provided with your written proposal.',
      ],
      [
        'After acceptance',
        'Contact us promptly to discuss cancellation. Any amount due or refundable depends on the agreed contract, completed work, committed third-party costs, and applicable law. We do not apply an automatic blanket “no refunds” rule.',
      ],
      [
        'Consumer rights',
        'Mandatory cancellation and consumer rights are not excluded. Where applicable, the required information and any request to begin during a cancellation period must be addressed before work starts. Final wording requires professional review.',
      ],
    ],
  },
};
export const legalLinks = Object.entries(pages)
  .filter(([, p]) => p.legal)
  .map(([slug, p]) => ['/' + slug + '/', p.title]);
