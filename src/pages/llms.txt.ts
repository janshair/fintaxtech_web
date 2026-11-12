import { appIndexText } from '../lib/app-llms';
import { absoluteURL } from '../lib/seo';
import summary from '../content/llms.txt?raw';
import { locations } from '../content/locations';
import { showcase, showcaseIndex } from '../data/showcase';

export function GET() {
  const areas = [
    '## Areas we serve',
    '',
    'FinTaxTech is based in Dundee and serves these cities remotely. These pages describe service areas, not additional offices.',
    '',
    ...locations.map(
      (location) => `- [${location.name}](${location.canonical}): ${location.description}`,
    ),
  ].join('\n');

  const work = [
    '## Our work: growth kits',
    '',
    `[${showcaseIndex.title}](${absoluteURL(showcaseIndex.route)}): ${showcaseIndex.description} Each kit uses an invented business; it is sample work, not a client project.`,
    '',
    ...showcase.map(
      (kit) =>
        `- [${kit.trade}](${absoluteURL(kit.url)}): ${kit.description} Sample business: ${kit.sampleBusiness} (invented).`,
    ),
  ].join('\n');

  return new Response(
    `${summary.replace('{{PUBLISHED_APPS}}', appIndexText()).trimEnd()}\n\n${work}\n\n${areas}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
