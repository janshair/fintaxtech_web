export type PromoStatus = 'available' | 'final-place' | 'closed';
// Owner changes this manually only after confirming the campaign and accepted payments.
export const promoStatus: PromoStatus = 'available';
export const promoCopy = {
  title: 'New Business Launch Promotion',
  seoTitle: 'New Business Branding & Website Promotion',
  seoDescription:
    'Explore FinTaxTech’s branding and static website offer for eligible new UK companies. Read the scope, exclusions and application terms.',
  closedSEODescription:
    'The current FinTaxTech launch-offer allocation is closed. Review its eligibility and scope, or enquire about a standard branding and website project.',
  linkLabel: 'New business launch promotion: offer and eligibility',
  termsLink: 'Read the service and payment terms',
  ongoing:
    'Our launch promotion is ongoing, with no scheduled expiry date. Places are limited and confirmed after we review your requirements.',
  changes:
    'Future allocations may have a different price or terms. FinTaxTech will confirm the applicable offer in writing before you make a payment. We confirm whether a place is available after review.',
  intro:
    'An agreed branding package and static website for eligible new UK businesses.',
  closedTitle: 'The current promotional allocation is closed',
  closedText:
    'The current offer is no longer accepting applications. Any future allocation and its terms will be published here. You can still start a standard project enquiry.',
  available: 'FinTaxTech confirms availability after reviewing your requirements.',
  final:
    'The allocation is under manual review. No place is promised; ask FinTaxTech to confirm availability.',
  notice:
    'Completing the questionnaire does not reserve a place. FinTaxTech confirms eligibility and scope first. A place is secured only when the agreed initial payment clears.',
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
    'Two consolidated website revision rounds',
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
    'Places are limited. This PDF does not reserve a place. Eligibility, scope and availability are verified manually. A place is secured only when the approved initial payment clears.',
};
