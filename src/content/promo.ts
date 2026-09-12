export type PromoStatus = 'available' | 'final-place' | 'closed';
// Owner changes this manually only after confirming the campaign and accepted payments.
export const promoStatus: PromoStatus = 'available';
export const promoCopy = {
  title: 'New Business Launch Promotion',
  price: '£999',
  intro:
    'An agreed branding package and static website for the first five eligible customers accepted.',
  closedTitle: 'This promotion has closed',
  closedText:
    'Promotional applications are not currently being accepted. You can still start a standard project enquiry.',
  available: 'Places may remain, subject to eligibility and scope verification.',
  final: 'The final place may be under review. No availability is promised.',
  notice:
    'Completing the questionnaire does not reserve a place. FinTaxTech confirms eligibility and scope first. A place is secured only when the initial £499.50 payment clears.',
  hold: 'An approved place may be held for five working days while payment clears.',
  start: 'Start your requirements',
  standard: 'Start a standard project enquiry',
  eligibilityTitle: 'Who is eligible?',
  eligibility: [
    'UK limited company incorporated within the previous six months',
    'No existing business website',
    'Companies House verification required',
    'Requirements must fit the promotional scope; acceptance remains at FinTaxTech’s discretion',
  ],
  scopeTitle: 'What is included?',
  scope: [
    'Up to five core pages, one language, one visual direction, and one selected light or dark theme',
    'Responsive static website, contact links, customer-owned GitHub repository, domain, and accounts',
    'GitHub Pages, HTTPS, metadata, sitemap, robots file, organisation schema, custom 404; analytics and consent if you supply the account',
    'Two consolidated website revision rounds and a 30-day defect warranty',
    'Short branding brief, style-board direction, two initial logo directions, one selected direction, and two consolidated branding revision rounds',
    'Human-refined logo variants where appropriate, full-colour, black, white and transparent versions; SVG, PDF, PNG, JPG and favicon outputs',
    'Compact guide and free fonts unless paid licences are agreed; editable source only where included in agreed delivery',
    'Customer-supplied approved legal-page layouts do not count toward the five core pages',
  ],
  exclusionsTitle: 'What is excluded?',
  exclusions: [
    'CMS, blog systems, ecommerce, payments, accounts, servers, databases, booking engines, custom APIs, multilingual content, both themes, complex animation, custom illustration, ongoing maintenance and changes after approval',
    'Full brand strategy, naming, taglines, trademark searches, legal exclusivity, stationery, social templates, presentations, packaging, campaigns, multiple brands, extra concepts and revision rounds',
  ],
  pdfNotice:
    'Limited to the first five eligible customers accepted. This PDF does not reserve a place. Eligibility, scope and availability are verified manually. A place is secured only when the approved initial payment clears.',
};
