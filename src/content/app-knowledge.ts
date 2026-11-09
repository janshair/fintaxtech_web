import { metoni, metoniSupport } from './metoni';
import { safos } from './safos';

export interface AppKnowledge {
  name: string;
  route: string;
  llmsRoute: string;
  description: string;
  intro: string;
  features: string[][];
  questions: [string, string][];
  supportRoute: string;
  privacyRoute: string;
  termsRoute?: string;
  playStoreURL: string;
  appStoreURL: string;
}
export const appKnowledgeCopy = {
  faqTitle: 'Frequently asked questions',
  supportLabel: 'Support and troubleshooting',
  privacyLabel: 'Privacy policy',
  termsLabel: 'Terms of use',
  summaryLabel: 'App facts and answers',
};

export const metoniKnowledge: AppKnowledge = {
  ...metoni,
  llmsRoute: `${metoni.route}llms.txt`,
  questions: [
    ['What is Metoni?', metoni.intro],
    ...(metoniSupport.faq.filter(([question]) =>
      [
        'Do I need an account?',
        'Can I use Metoni offline?',
        'Where is my data stored?',
        'How do weight suggestions work?',
        'Can support recover my workout records?',
        'Is Metoni available for iPhone?',
      ].includes(question),
    ) as [string, string][]),
  ],
};

export const safosKnowledge: AppKnowledge = {
  ...safos,
  llmsRoute: `${safos.route}llms.txt`,
  questions: [
    ['What is Safos?', safos.intro],
    [
      'Which devices can I use Safos on?',
      'Safos is available on Google Play for Android and on the App Store for iPhone and iPad. Check the relevant store listing for device compatibility. Screenshots and the walkthrough on this website show the iOS version; platform features can differ.',
    ],
    [
      'Do I need an account?',
      'No. Safos works without sign-up or login. FinTaxTech does not operate a server that holds your invoices, receipts or client records. The privacy policy explains separate analytics and Android purchase services.',
    ],
    [
      'Can I share an invoice or receipt as a PDF?',
      'Yes. Preview your document, then share the PDF using the sharing options available on your device. Sharing a PDF sends it to the recipient or service you choose.',
    ],
    [
      'Can I use my own logo and colours?',
      'Yes. Safos supports a business logo and brand colour for PDF documents, with Minimal, Classic and Bold templates.',
    ],
    [
      'Does tracking an invoice as paid collect the payment?',
      'Payment-status tracking records draft, sent, paid and overdue invoices and displays outstanding and paid amounts. It should not be interpreted as a promise of payment processing or bank reconciliation.',
    ],
    [
      'How can I keep a backup of my Safos data?',
      'Export your own backup before uninstalling or clearing app storage. On iPhone and iPad, use Settings → Data & Privacy → Export my data. On Android, use Settings → Export all data. FinTaxTech does not receive a copy of your documents and cannot restore them from its systems.',
    ],
  ],
};
export const appKnowledge = [metoniKnowledge, safosKnowledge];
