// Confirm the public App Store URL before enabling the iOS download action.
export const metoni = {
  name: 'Metoni: Workout Tracker',
  route: '/metoni/',
  supportRoute: '/metoni/support/',
  privacyRoute: '/metoni/privacy.html',
  termsRoute: '/metoni/terms.html',
  playStoreURL: 'https://play.google.com/store/apps/details?id=uk.co.fintaxtech.metoni',
  appStoreURL: undefined as string | undefined,
  seoTitle: 'Metoni: Workout Tracker',
  description:
    'Log strength-training sets, use exercise rest timers, follow workout plans and review session history with Metoni. Available on Android, with no account required.',
  eyebrow: 'Built and published by FinTaxTech',
  headline: 'Plan your workout. Log it. Get back to training.',
  intro:
    'A strength-training workout tracker. Log sets during a live workout, follow your plans and review session history without creating an account. Your workout data stays on your device.',
  summary:
    'A strength-training workout tracker with on-device workout storage and no account required, published by Fintaxtech Ltd.',
  exploreLabel: 'Explore Metoni',
  playLabel: 'Get Metoni on Google Play',
  appStoreLabel: 'Download Metoni on the App Store',
  androidStatus: 'Android — available on Google Play',
  iosStatus: 'iPhone and iPad — App Store release pending; not yet available',
  iosAvailableStatus: 'iOS — available on the App Store',
  linksLabel: 'Metoni information',
  supportLabel: 'Metoni support',
  privacyLabel: 'Metoni privacy policy',
  termsLabel: 'Metoni terms of use',
  overviewLabel: 'About Metoni',
  featuresTitle: 'Built for the time between sets',
  features: [
    ['Fast mid-workout logging', 'Record weights and reps quickly during a live workout.'],
    ['Workout plans', 'Keep workout plans ready for your next session.'],
    ['Kilograms or pounds', 'Choose kg or lb in Settings.'],
    [
      'Rule-based weight suggestions',
      'When every working set of an exercise hits its target reps at the same weight, Metoni suggests adding the weight increment you choose for that exercise. Warm-up sets are ignored.',
    ],
    [
      'A rest timer for each exercise',
      'Set different rest periods for different exercises, rather than using one timer setting for every movement.',
    ],
    [
      'Session history and activity',
      'Review total volume, sets, reps and duration per session, plus a day streak and weekly activity.',
    ],
    [
      'Exercise library and your own exercises',
      'Browse 135 exercises across 9 muscle groups, or add your own exercises.',
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
    'Get help with Metoni: Workout Tracker. Contact Fintaxtech Ltd, troubleshoot a problem, or share feedback and feature requests.',
  intro:
    'Need help with Metoni? Email us with a short description of the problem. We also welcome feedback and ideas for future versions.',
  companyName: 'Fintaxtech Ltd',
  contactTitle: 'Contact the Metoni team',
  addressLabel: 'Registered office',
  emailLabel: 'Email Metoni support',
  emailSubject: 'Metoni support',
  platformsTitle: 'Supported platforms',
  platforms: metoni.appStoreURL
    ? 'Metoni is available on Android through Google Play and on iOS through the App Store. Check the relevant store listing for compatibility with your device.'
    : 'Metoni is available on Android through Google Play. The iPhone and iPad App Store release is pending and is not yet available. Check Google Play for compatibility with your device.',
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
      'Where is my data stored?',
      'Your workout data is stored on your device. The privacy policy explains the separate analytics, crash reporting and remote configuration services.',
    ],
    ['Can I add my own exercises?', 'Yes. You can add your own exercises.'],
    [
      'How do weight suggestions work?',
      'When every working set of an exercise hits its target reps at the same weight, Metoni suggests adding the weight increment you choose for that exercise. Warm-up sets are ignored.',
    ],
    [
      'How do I switch kg/lb or the theme?',
      'Choose kg or lb and the light or dark theme in Settings.',
    ],
    ['How do I export or import a plan?', 'Go to Settings › Workout Plans › plan menu.'],
    ['How do I delete my data?', 'Delete the app to remove your locally stored workout data.'],
    [
      'Can support recover my workout records?',
      'FinTaxTech does not hold a copy of your locally stored workout records. Uninstalling the app can permanently delete them; we cannot restore them from our systems.',
    ],
    [
      'Is Metoni available for iPhone?',
      metoni.appStoreURL
        ? 'Yes. Metoni is available on the App Store. Check the listing for compatibility with your device.'
        : 'The iPhone and iPad App Store release is pending. It is not yet available; we will add a download link after approval.',
    ],
  ],
};
