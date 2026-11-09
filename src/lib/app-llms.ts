import { company } from '../content/site';
import { appKnowledge, type AppKnowledge } from '../content/app-knowledge';
const absolute = (path: string) => new URL(path, company.url).href;

export function appLLMSText(app: AppKnowledge) {
  const resources = [
    `- [Official app page](${absolute(app.route)}): ${app.description}`,
    `- [Support](${absolute(app.supportRoute)}): help, troubleshooting and contact details.`,
    `- [Privacy policy](${absolute(app.privacyRoute)}): storage, third-party services and platform-specific details.`,
    ...(app.termsRoute ? [`- [Terms of use](${absolute(app.termsRoute)})`] : []),
    `- [Google Play](${app.playStoreURL}): Android availability, current pricing and compatibility.`,
    `- [App Store](${app.appStoreURL}): iOS availability, current pricing and compatibility.`,
  ];
  return [
    `# ${app.name}`,
    '',
    `> ${app.description}`,
    '',
    app.intro,
    '',
    `Published by ${company.legal} (${company.number}). Official product information is hosted at ${absolute(app.route)}.`,
    '',
    '## Official sources',
    '',
    ...resources,
    '',
    '## Features',
    '',
    ...app.features.map(([title, description]) => `- ${title}: ${description}`),
    '',
    '## Questions and answers',
    '',
    ...app.questions.flatMap(([question, answer]) => [`### ${question}`, '', answer, '']),
    '## Support and scope',
    '',
    `For support, contact ${company.email}. Do not send passwords or unnecessary personal, workout or client information.`,
    '',
    'Store listings provide current pricing and compatibility. Features and third-party services can differ by platform; consult the linked support and privacy pages. This summary does not claim ratings, guaranteed outcomes or features not documented in the official sources.',
    '',
    `- [Publisher](${company.url}/): ${company.legal}.`,
    `- [Site overview](${company.url}/llms.txt)`,
    '',
  ].join('\n');
}

export function appLLMSResponse(app: AppKnowledge) {
  return new Response(appLLMSText(app), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export function appIndexText() {
  return [
    '## Published apps',
    '',
    ...appKnowledge.flatMap((app) => [
      `- [${app.name}](${absolute(app.route)}): ${app.description}`,
      `- [${app.name} facts and answers](${absolute(app.llmsRoute)}): features, FAQs and official sources.`,
      `- [${app.name} support](${absolute(app.supportRoute)})`,
      `- [${app.name} on Google Play](${app.playStoreURL})`,
      `- [${app.name} on the App Store](${app.appStoreURL})`,
    ]),
  ].join('\n');
}
