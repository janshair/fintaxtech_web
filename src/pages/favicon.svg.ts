import { brandMark } from '../design/brand';
import tokens from '../styles/tokens.css?raw';
export function GET() {
  const colors = [...tokens.matchAll(/--text:\s*([^;]+);/g)].map((m) => m[1]);
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brandMark.viewBox}"><style>path{fill:${colors[0]}}@media(prefers-color-scheme:dark){path{fill:${colors[1]}}}</style><path d="${brandMark.path}"/></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
