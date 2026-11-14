export const jobCategories = ['ai-automation', 'branding', 'mobile', 'web'] as const;

export const careersCopy = {
  route: '/careers/',
  label: 'Careers',
  title: 'Careers at FinTaxTech',
  description:
    'Explore current vacancies at FinTaxTech and help build accessible, thoughtfully engineered digital products.',
  intro:
    'We build websites, mobile apps, brand identities and AI-assisted workflows. Explore our current opportunities below.',
  vacancies: 'Current vacancies',
  empty: 'There are currently no active vacancies',
  emptyCategory: 'There are no active vacancies in this category.',
  categoryFilter: 'Filter vacancies by category',
  allJobs: 'All jobs',
  categories: {
    'ai-automation': 'AI Automation',
    branding: 'Branding',
    mobile: 'Mobile',
    web: 'Web',
  },
  back: 'View all vacancies',
  location: 'Location',
  department: 'Department',
  employmentType: 'Employment type',
  closing: 'Closing date',
  application: 'Send your CV to ',
  applicationSubjectLine: ' using the subject line below.',
  applicationWarning: 'CVs with a different subject line will be discarded.',
  employmentTypes: {
    FULL_TIME: 'Full time',
    PART_TIME: 'Part time',
    CONTRACTOR: 'Contractor',
    TEMPORARY: 'Temporary',
    INTERN: 'Internship',
    VOLUNTEER: 'Volunteer',
    PER_DIEM: 'Per diem',
    OTHER: 'Other',
  },
} as const;
