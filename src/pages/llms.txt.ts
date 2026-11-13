import { appIndexText } from '../lib/app-llms';
import { absoluteURL } from '../lib/seo';
import summary from '../content/llms.txt?raw';
import { locations } from '../content/locations';
import { pricingSummaryText } from '../content/pricing';
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
    showcaseIndex.llmsHeading,
    '',
    `[${showcaseIndex.concepts.title}](${absoluteURL(showcaseIndex.route)}): ${showcaseIndex.concepts.intro} Finished client projects are listed first on the same page.`,
    '',
    ...showcase.flatMap(
      (kit) =>
        kit.llms ?? [
          `- [${kit.trade}](${absoluteURL(kit.url)}): ${kit.description} Sample business: ${kit.sampleBusiness} (invented).`,
        ],
    ),
  ].join('\n');

  return new Response(
    `${summary
      .replace('{{PUBLISHED_APPS}}', appIndexText())
      .replace('{{PRICING}}', pricingSummaryText())
      .trimEnd()}\n\n${work}\n\n${areas}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
