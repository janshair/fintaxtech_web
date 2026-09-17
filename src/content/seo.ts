import { mobileAppBriefCopy } from './mobile-app-brief';
import { websiteBriefCopy } from './website-brief';
import { logoBriefCopy } from './logo-brief';
import { pages } from './pages';
import { blogCopy } from './blog';
import { services } from './services';
import { contactRedirect, home, ui } from './site';
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
  nofollow?: boolean;
  canonical?: string;
}
export const seoPages: Record<string, PageSEO> = {
  [mobileAppBriefCopy.route]: {
    title: mobileAppBriefCopy.title,
    description: mobileAppBriefCopy.description,
    noindex: true,
    nofollow: true,
  },
  [websiteBriefCopy.route]: {
    title: websiteBriefCopy.title,
    description: websiteBriefCopy.description,
    noindex: true,
    nofollow: true,
  },
  [logoBriefCopy.route]: {
    title: logoBriefCopy.title,
    description: logoBriefCopy.description,
    noindex: true,
    nofollow: true,
  },
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
  '/services/websites/': {
    title: 'Website Design and Development UK',
    description:
      'Website design and development for UK and worldwide clients. Based in Dundee, Scotland, we create new business websites and complete redesigns.',
  },
  '/services/mobile-apps/': {
    title: 'Mobile App Development UK',
    description:
      'UK mobile app development from Dundee, Scotland. New iOS and Android apps and complete rebuilds using native tools, Flutter or Kotlin Multiplatform.',
  },
  '/about/': {
    title: 'About FinTaxTech',
    description:
      'Meet FinTaxTech, a digital and creative partner for businesses worldwide. Learn about our human-reviewed approach and customer-owned business accounts.',
  },
  '/contact/': {
    title: contactRedirect.title,
    description: contactRedirect.message,
    canonical: contactRedirect.destination,
    noindex: true,
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
  '/safos/privacy.html': {
    title: 'Safos Privacy Policy',
    description:
      'How the Safos invoice app by Fintaxtech Ltd handles invoices, receipts, client details, optional analytics and privacy choices.',
  },
  '/metoni/privacy.html': {
    title: 'Metoni Privacy Policy',
    description:
      'How Metoni, the gym log and AI tracker by Fintaxtech Ltd, collects, uses and protects app information.',
  },
  '/metoni/terms.html': {
    title: 'Metoni Terms of Use',
    description:
      'Read the terms governing use of Metoni, the gym log and AI tracker by Fintaxtech Ltd.',
  },
};
export const indexablePaths = Object.keys(seoPages).filter((path) => !seoPages[path].noindex);

export const appPolicyPaths = indexablePaths.filter(
  (path) => path.startsWith('/safos/') || path.startsWith('/metoni/'),
);
