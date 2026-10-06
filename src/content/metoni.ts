// Confirm the public App Store URL before enabling the iOS download action.
export const metoni = {
  name: 'Metoni',
  route: '/metoni/',
  supportRoute: '/metoni/support/',
  privacyRoute: '/metoni/privacy.html',
  termsRoute: '/metoni/terms.html',
  playStoreURL: 'https://play.google.com/store/apps/details?id=uk.co.fintaxtech.metoni',
  appStoreURL: undefined as string | undefined,
  seoTitle: 'Metoni — Offline Gym & Cardio Workout Planner',
  description:
    'Plan workouts, log strength and cardio sessions, and review your training history with Metoni. Fast, offline workout logging on Android, with no account required.',
  eyebrow: 'Built and published by FinTaxTech',
  headline: 'Plan your workout. Log it. Get back to training.',
  intro:
    'A fast, offline gym and cardio workout planner and log. Keep your routine, record your sets and review previous sessions without creating an account.',
  summary: 'An offline gym and cardio workout planner and log, built and published by FinTaxTech.',
  exploreLabel: 'Explore Metoni',
  playLabel: 'Get Metoni on Google Play',
  appStoreLabel: 'Download Metoni on the App Store',
  androidStatus: 'Android — available on Google Play',
  iosStatus: 'iOS — in development',
  iosAvailableStatus: 'iOS — available on the App Store',
  linksLabel: 'Metoni information',
  supportLabel: 'Metoni support',
  privacyLabel: 'Metoni privacy policy',
  termsLabel: 'Metoni terms of use',
  overviewLabel: 'About Metoni',
  featuresTitle: 'Built for the time between sets',
  features: [
    [
      'Fast mid-workout logging',
      'Choose an exercise, record the weight and reps, and carry on. Your previous session is there for reference while you log.',
    ],
    [
      'Plans and freeform sessions',
      'Create a routine to follow or log a freeform session when you want to train without a plan.',
    ],
    [
      'Strength and cardio together',
      'Record strength work with weights and reps, and cardio with duration, distance or level as appropriate to the exercise.',
    ],
    [
      'Suggestions you control',
      'Metoni can suggest a small increase in weight or reps based on your previous session. You confirm each change; suggestions do not guarantee progress.',
    ],
    [
      'A rest timer for each exercise',
      'Set different rest periods for different exercises, rather than using one timer setting for every movement.',
    ],
    [
      'History and progress',
      'Review past sessions, exercise history, weekly volume, training streaks and weekly completion.',
    ],
    [
      'Your own exercises',
      'Add custom exercises and muscle groups when the existing exercise library does not cover your routine.',
    ],
    [
      'Offline, with no account',
      'Plan and log workouts without signing in or relying on a connection. Workout records are stored on your device. See the privacy policy for analytics and diagnostics details.',
    ],
    [
      'Light and dark themes',
      'Choose the appearance that suits you, with both light and dark themes available.',
    ],
  ],
  galleryTitle: 'A look inside Metoni',
  videoTitle: 'See Metoni in action',
  videoFallback:
    'This browser cannot play the Metoni promotional video. Use the video link or read the description below.',
  videoDownload: 'Open the Metoni promotional video',
  transcriptTitle: 'Video transcript and visual description',
  captionLanguage: 'English',
  ctaTitle: 'Your next workout, ready to log',
  ctaText: 'Explore Metoni on Google Play, or contact us if you need help.',
};

export const metoniSupport = {
  title: 'Metoni support',
  description:
    'Get help with Metoni, the offline gym and cardio workout log. Contact FinTaxTech, troubleshoot a problem, or share feedback and feature requests.',
  intro:
    'Need help with Metoni? Email us with a short description of the problem. We also welcome feedback and ideas for future versions.',
  companyName: 'FinTaxTech Ltd',
  contactTitle: 'Contact the Metoni team',
  addressLabel: 'Registered office',
  emailLabel: 'Email Metoni support',
  emailSubject: 'Metoni support',
  platformsTitle: 'Supported platforms',
  platforms: metoni.appStoreURL
    ? 'Metoni is available on Android through Google Play and on iOS through the App Store. Check the relevant store listing for compatibility with your device.'
    : 'Metoni is currently available on Android through Google Play. The iOS version is in development and is not yet available on the App Store. Check Google Play for compatibility with your device.',
  troubleshootingTitle: 'Try these steps first',
  troubleshooting: [
    'Check Google Play for an available Metoni update.',
    'Close and reopen Metoni. If the issue continues, restart your device.',
    'Note what you were doing and whether the problem happens again when you repeat those steps.',
    'Do not clear app storage or uninstall Metoni as a troubleshooting step: this can permanently remove locally stored workout records. Contact us first if you are unsure.',
  ],
  reportTitle: 'Report a problem',
  reportIntro: 'Include the following information where possible:',
  reportDetails: [
    'Your Metoni app version (from the app information in your device settings).',
    'Your device manufacturer and model, and Android or iOS version.',
    'The steps that led to the issue, what you expected and what actually happened.',
    'Any error message, and whether the issue happens every time or only occasionally.',
    'An optional screenshot with names, workout details and other personal information removed.',
  ],
  privacyWarning:
    'Do not email passwords, sensitive health information or unnecessary personal data. You do not need to send your workout history to describe a problem.',
  feedbackTitle: 'Feedback and feature requests',
  feedback:
    'Tell us what you are trying to do and what would make it easier. We review suggestions, but a request does not guarantee a feature or release date.',
  faqTitle: 'Frequently asked questions',
  faq: [
    [
      'Do I need an account?',
      'No. Metoni does not require an account or sign-in to plan and log workouts.',
    ],
    [
      'Can I use Metoni offline?',
      'Yes. Workout planning and logging work offline. The privacy policy separately explains analytics, crash reporting and remote configuration.',
    ],
    [
      'Can I record cardio as well as lifting?',
      'Yes. Metoni supports strength and cardio exercises in your workout log.',
    ],
    ['Can I add my own exercises?', 'Yes. You can add custom exercises and muscle groups.'],
    [
      'Do suggestions change my workout automatically?',
      'No. You confirm suggested changes to weight or reps.',
    ],
    [
      'Can support recover my workout records?',
      'FinTaxTech does not hold a copy of your locally stored workout records. Uninstalling the app can permanently delete them; we cannot restore them from our systems.',
    ],
    [
      'Is Metoni available for iPhone?',
      metoni.appStoreURL
        ? 'Yes. Metoni is available on the App Store. Check the listing for compatibility with your device.'
        : 'The iOS version is in development. There is no public App Store download link or announced release date yet.',
    ],
  ],
};
