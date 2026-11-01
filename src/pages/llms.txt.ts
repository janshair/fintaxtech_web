import summary from '../content/llms.txt?raw';
import { locations } from '../content/locations';

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

  return new Response(`${summary.trimEnd()}\n\n${areas}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
