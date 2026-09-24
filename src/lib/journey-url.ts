import type { ServiceId } from './types';
import { services } from '../content/services';
export function normalizeService(value: string | null): ServiceId | undefined {
  const canonical = value === 'prompt-services' ? 'ai-automation' : value;
  return services.find((service) => service.id === canonical)?.id;
}
// Support bookmarked /start/?… links without carrying arbitrary or personal query values.
export function legacyJourneyURL(search: string): string | undefined {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  const service = normalizeService(input.get('service'));
  if (services.some((s) => s.id === service)) output.set('service', service!);
  if (input.get('route') === 'help') output.set('route', 'help');
  if (!output.size) return undefined;
  if (input.get('stage') === '2') output.set('stage', '2');
  if (input.get('brief') === 'short') output.set('brief', 'short');
  return `/enquiry/?${output}`;
}
