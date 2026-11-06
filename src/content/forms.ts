export const formsDirectory = {
  route: '/forms/',
  title: 'Forms',
  description:
    'Choose your service to make an enquiry, estimate a price or prepare a project brief.',
};

export const formGroups = [
  {
    service: 'branding',
    title: 'Branding & design',
    links: [
      ['Branding enquiry', '/enquiry/?service=branding'],
      ['Branding estimate', '/estimate/branding/'],
      ['Logo brief', '/client/logo-brief/'],
    ],
  },
  {
    service: 'websites',
    title: 'Websites',
    links: [
      ['Website enquiry', '/enquiry/?service=websites'],
      ['Website estimate', '/estimate/website/'],
      ['Website production brief', '/client/website-brief/'],
      ['Website template brief', '/client/website-brief/templates/'],
    ],
  },
  {
    service: 'mobile-apps',
    title: 'Mobile apps',
    links: [
      ['Mobile app enquiry', '/enquiry/?service=mobile-apps'],
      ['Mobile app estimate', '/estimate/mobile/'],
      ['Mobile app production brief', '/client/mobile-app-brief/'],
    ],
  },
  {
    service: 'ai-automation',
    title: 'AI automation',
    links: [
      ['AI automation enquiry', '/enquiry/?service=ai-automation'],
      ['AI automation estimate', '/estimate/ai-automation/'],
      ['AI automation production brief', '/client/prompt-brief/'],
    ],
  },
] as const;
