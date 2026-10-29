import type { EstimateAnswers, EstimateCustomer } from '../../src/lib/branding-estimate/types';
export const estimateCustomer: EstimateCustomer = {
  name: 'Alex Example',
  business: 'Example Studio',
  email: 'alex@example.com',
  phone: '',
};
export function exampleEstimateAnswers(): EstimateAnswers {
  return {
    'branding-deliverables': {
      selected: [
        'logo-design',
        'brand-guidelines',
        'business-stationery',
        'social-media-branding-kit',
        'marketing-materials',
      ],
      other: [],
    },
    'branding-stationery-items': {
      selected: ['business-cards', 'employee-id-cards-lanyards', 'compliment-slips'],
      other: [],
    },
    'branding-marketing-items': { selected: ['flyers', 'leaflets', 't-shirts'], other: [] },
    'branding-social-media-items': {
      selected: [
        'profile-picture-avatar',
        'facebook-cover',
        'instagram-facebook-post-template',
        'story-highlight-covers',
      ],
      other: [],
    },
    'branding-guidelines-level': { selected: ['basic-brand-style'], other: [] },
  };
}
