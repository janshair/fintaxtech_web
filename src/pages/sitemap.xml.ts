import { pages } from '../content/pages';
import { services } from '../content/services';
import { company } from '../content/site';
export function GET() {
  const paths = [
    '/',
    '/services/',
    '/start/',
    ...Object.keys(pages).map((p) => `/${p}/`),
    ...services.map((s) => `/services/${s.id}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${company.url}${p}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
