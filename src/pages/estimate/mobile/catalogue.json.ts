import { publicCalculationConfig } from '../../../lib/mobile-estimate/config';
export function GET() {
  return new Response(JSON.stringify(publicCalculationConfig()), {
    headers: { 'Content-Type': 'application/json' },
  });
}
