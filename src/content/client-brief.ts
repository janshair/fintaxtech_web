export const briefCopy = {
  access: 'This page is unlisted, not access-controlled. Anyone with its link can open it.',
  noScript:
    'Enable JavaScript to complete this brief and create a PDF locally. You can also contact FinTaxTech using the details below.',
  next: 'Next',
  back: 'Back',
  edit: 'Edit answers',
  review: 'Review brief',
  progress: (n: number, total: number) => `Section ${n} of ${total}`,
  count: (n: number, max: number) => `${n} of ${max} selected`,
  required: 'Required',
  optional: 'Optional',
  specify: 'Please specify',
  other: 'Other',
  noPreference: 'No preference',
  confirmation: (name: string) => `I confirm the exact spelling and capitalisation: ${name}`,
  confirmed: 'Exact spelling and capitalisation confirmed',
  missing: 'Complete this field before continuing.',
  tooLong: (n: number) => `Use no more than ${n} characters.`,
  tooMany: (n: number) => `Choose no more than ${n}. Uncheck an option to replace it.`,
  invalidChoice: 'Choose one of the available options.',
  invalidDate: 'Enter a valid date.',
  invalidURL: 'Enter a complete http:// or https:// website address.',
  invalidWebsite: 'Use a complete http:// or https:// website address, or leave it blank.',
  competitorName: 'Competitor name',
  competitorWebsite: 'Competitor website (optional)',
  competitor: (n: number) => `Competitor ${n}`,
  addCompetitor: 'Add competitor',
  remove: 'Remove',
  removeCompetitor: (n: number) => `Remove competitor ${n}`,
  addImages: 'Choose reference images',
  replaceImage: 'Replace image',
  reference: (n: number) => `Reference image ${n}`,
  referenceAlt: (n: number) => `Your reference image ${n}`,
  removeImage: (n: number) => `Remove reference image ${n}`,
  replaceImageLabel: (n: number) => `Replace reference image ${n}`,
  explanation: 'What quality do you like, and why?',
  imageHelp:
    'Choose up to five PNG, JPEG or WebP images, maximum 5 MB each. Images are resized in your browser for the PDF. References guide the direction; we will not copy another brand. Files are never uploaded.',
  imagesRequired: 'Add at least one reference image, or select No.',
  imageLimit: 'You can add up to five reference images. Remove one before adding another.',
  imageSize: 'Each original image must be 5 MB or smaller.',
  imageType: 'Choose a PNG, JPEG or WebP image. SVG and HTML files are not accepted.',
  imageInvalid: 'This image could not be read. Choose a valid PNG, JPEG or WebP file.',
  imageDimensions:
    'This image is too large to process safely. Use a copy with no more than 40 million pixels and a maximum side of 16,000 pixels.',
  processing: 'Preparing images locally…',
  imageReady: 'Reference images updated.',
  notProvided: 'Not provided',
  download: 'Download PDF',
  downloading: 'Creating your PDF locally…',
  downloaded:
    'Your PDF download has been requested. Nothing has been sent to FinTaxTech. Attach the downloaded file manually in your email or WhatsApp app.',
  pdfError:
    'The PDF could not be created. Your answers are still here. Check for unsupported characters such as emoji, then try again.',
  pdfDate: 'Completed',
  shareHelp:
    'Download the PDF, then share it yourself. The email and WhatsApp links open a blank message; you must attach the file. If you change your answers, download a new PDF.',
  email: 'Open email',
  whatsapp: 'Open WhatsApp',
  referencesTitle: 'Reference images',
  maxCompetitors: 'Add no more than five competitors.',
  pageName: 'Page name',
  pagePurpose: 'Purpose (optional)',
  additionalPage: (n: number) => `Additional page ${n}`,
  addPage: 'Add page',
  removePage: (n: number) => `Remove additional page ${n}`,
  pageLimit: 'Add no more than 10 additional pages.',
  pageRequired: 'Choose a listed page or add at least one additional page.',
  pageDuplicate:
    'Each additional page needs a unique name. Use the listed choices for standard pages.',
  scopeReview: 'Scope review',
};
export type BriefCopy = typeof briefCopy & {
  route: string;
  title: string;
  description: string;
  intro: string;
  privacy: string;
  workflow: string;
  begin: string;
  reviewTitle: string;
  reviewIntro: string;
  disclaimer: string;
  pdfFilename: string;
};
