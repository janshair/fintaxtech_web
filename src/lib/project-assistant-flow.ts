import askImage from '../assets/work/ask-appliance-repairs-desktop.webp';
import metoniIcon from '../assets/metoni/icon.webp';
import safosIcon from '../assets/safos/icon.webp';
import { assistantCopy as c, assistantServices } from '../content/project-assistant';
import { pricingGroups } from '../content/pricing';
import { company, navigation, ui } from '../content/site';
import { featuredWork, publishedApps } from '../content/work';
import type { AssistantChoice, AssistantScreen, AssistantService } from './project-assistant-types';

const services = Object.keys(assistantServices) as AssistantService[];
const contactPage = navigation.find(([, label]) => label === ui.contact)![0];
const email = `mailto:${company.email}`;
const whatsapp = company.whatsapp
  ? [{ label: c.whatsapp, href: `https://wa.me/${company.whatsapp}` }]
  : [];
const contactChoices: AssistantChoice[] = [{ label: c.email, href: email }, ...whatsapp];
const question = (service: AssistantService): AssistantChoice => ({
  label: c.questionnaire,
  href: service === 'unsure' ? '/enquiry/?route=help' : `/enquiry/?service=${service}`,
});

const estimateFor = (service: AssistantService) =>
  pricingGroups.find(({ id }) => id === service)?.estimate.href;
const [metoni, safos] = publishedApps;

export const assistantScreens: AssistantScreen[] = [
  {
    id: 'home',
    heading: c.welcome,
    description: c.introduction,
    choices: [
      { label: c.pricing, next: 'pricing' },
      { label: c.work, next: 'work' },
      { label: c.project, next: 'project' },
      { label: c.other, next: 'contact' },
    ],
  },
  {
    id: 'pricing',
    heading: c.servicePrompt,
    back: 'home',
    choices: services.map((service) => {
      const href = estimateFor(service);
      const label = assistantServices[service];
      return href ? { label, href } : { label, next: `price-help-${service}` };
    }),
  },
  {
    id: 'work',
    heading: c.work,
    back: 'home',
    choices: [
      {
        label: featuredWork.name,
        description: featuredWork.category,
        href: featuredWork.route,
        image: askImage,
      },
      { label: metoni.name, description: metoni.summary, href: metoni.pageURL, image: metoniIcon },
      { label: safos.name, description: safos.summary, href: safos.pageURL, image: safosIcon },
      { label: c.allWork, href: '/work/' },
    ],
  },
  {
    id: 'project',
    heading: c.servicePrompt,
    back: 'home',
    choices: services.map((service) => ({
      label: assistantServices[service],
      next: `project-${service}`,
    })),
  },
  {
    id: 'contact',
    heading: ui.contact,
    description: company.response,
    back: 'home',
    choices: [
      { label: c.contactPage, href: contactPage },
      { label: company.email, href: email },
      ...whatsapp,
    ],
  },
  ...services
    .filter((service) => !estimateFor(service))
    .map((service): AssistantScreen => ({
      id: `price-help-${service}`,
      heading: c.priceHelp,
      description: c.scope,
      back: 'pricing',
      choices: [question(service), { label: c.contactPage, href: contactPage }],
    })),
  ...services.map((service): AssistantScreen => ({
    id: `project-${service}`,
    heading: service === 'unsure' ? c.project : c.discussService(assistantServices[service]),
    back: 'project',
    choices: [question(service), ...contactChoices],
  })),
];
