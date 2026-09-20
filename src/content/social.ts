export const socialCopy = {
  title: 'Find FinTaxTech online',
  navigation: 'FinTaxTech social profiles',
  footerNavigation: 'Footer social profiles',
};
export const socialProfiles = [
  { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/fintaxtechuk' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/fintaxtechuk' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/fintaxtechuk' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@fintaxtechuk' },
  { id: 'github', label: 'GitHub', url: 'https://github.com/Fintaxtech-Ltd' },
] as const;

// Verified against the owner-managed Google Business Profile on 20 September 2026.
// This identifies the business; it is not a claim of a customer-facing office.
export const googleBusinessProfile = {
  id: 'google-business',
  label: 'Google Business Profile',
  url: 'https://www.google.com/maps/place/Fintaxtech+Ltd/data=!4m2!3m1!1s0x0:0x1ad7a271b0b7a76d',
} as const;
export const publicProfiles = [...socialProfiles, googleBusinessProfile];
