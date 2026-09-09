import { pages } from './pages';
import { blogCopy } from './blog';
import { services } from './services';
import { home, ui } from './site';
export const seoCopy = {
  imageAlt: 'FinTaxTech — Complexity made clear.',
  breadcrumbs: 'Breadcrumb',
  related: 'Explore our services',
  appPolicies: 'App privacy and terms',
};
export interface PageSEO {
  title: string;
  description: string;
  noindex?: boolean;
}
export const seoPages: Record<string, PageSEO> = {
  '/blog/': { title: blogCopy.seoTitle, description: blogCopy.description },
  ...Object.fromEntries(
    Object.entries(pages).map(([slug, p]) => [
      `/${slug}/`,
      { title: p.title, description: p.intro },
    ]),
  ),
  ...Object.fromEntries(
    services.map((s) => [
      `/services/${s.id}/`,
      {
        title: s.name,
        description: `${s.description} Explore FinTaxTech’s ${s.name.toLowerCase()} service, project scope and delivery process.`,
      },
    ]),
  ),
  '/': { title: 'Brand, Website & Mobile App Development', description: home.intro },
  '/services/': {
    title: 'Branding, Websites, Mobile Apps & Content Services',
    description:
      'Explore FinTaxTech’s branding, website development, mobile app development and AI-assisted content services for businesses worldwide.',
  },
  '/about/': {
    title: 'About FinTaxTech',
    description:
      'Meet FinTaxTech, a digital and creative partner for businesses worldwide. Learn about our human-reviewed approach and customer-owned business accounts.',
  },
  '/contact/': {
    title: 'Contact FinTaxTech',
    description:
      'Discuss your brand, website, mobile app or content project with FinTaxTech by email or WhatsApp. We work remotely with customers worldwide.',
  },
  '/how-it-works/': {
    title: 'How Our Project Process Works',
    description:
      'See how FinTaxTech takes your project from guided requirements and a written proposal through design, development, review and handover.',
  },
  '/start/': {
    title: 'Start Your Brand, Website, App or Content Project',
    description:
      'Choose a FinTaxTech service, answer structured questions and create a private enquiry PDF to download and share manually by email or WhatsApp.',
  },
  '/enquiry/': {
    title: 'Prepare Your Private Project Enquiry',
    description:
      'Prepare your project requirements locally, review your answers and download an enquiry PDF to share with FinTaxTech.',
    noindex: true,
  },
  '/promo/': {
    title: 'FinTaxTech Promotion',
    description: 'Check the status and terms of the FinTaxTech promotion.',
    noindex: true,
  },
  '/404.html': {
    title: ui.notFound,
    description: 'Find FinTaxTech services or return to the homepage.',
    noindex: true,
  },
  '/invoice/privacy.html': {
    title: 'Quick Invoice Privacy Policy',
    description:
      'How the Quick Invoice app by Fintaxtech Ltd handles invoices, receipts, client details, optional analytics and privacy choices.',
  },
  '/reprocket/privacy.html': {
    title: 'RepRocket Privacy Policy',
    description:
      'How RepRocket, the gym log and AI tracker by Fintaxtech Ltd, collects, uses and protects app information.',
  },
  '/reprocket/terms.html': {
    title: 'RepRocket Terms of Use',
    description:
      'Read the terms governing use of RepRocket, the gym log and AI tracker by Fintaxtech Ltd.',
  },
};
export const indexablePaths = Object.keys(seoPages).filter((path) => !seoPages[path].noindex);

export const appPolicyPaths = indexablePaths.filter(
  (path) => path.startsWith('/invoice/') || path.startsWith('/reprocket/'),
);
