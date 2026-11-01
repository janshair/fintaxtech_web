import type {
  BriefAnswers,
  BriefCondition,
  BriefSection,
  BriefState,
} from '../../lib/client-brief/types';
import { barber01 } from './barber-01';

// One schema per template. Field ids must be unique across all schemas
// (prefix them with the template, like barberServices), because answers are flat.
export interface TemplateBriefSchema {
  id: string;
  sections: BriefSection[];
  // When the customer's choice in this schema makes the core booking link required.
  bookingLinkWhen?: BriefCondition;
  // Template-specific data in the shape of the template's content file; null keeps the demo copy.
  toTemplateData: (answers: BriefAnswers, rows: BriefState['rows']) => Record<string, unknown>;
}

// Templates without a schema appear in the picker as "Coming soon".
export const templateBriefSchemas: Record<string, TemplateBriefSchema> = {
  [barber01.id]: barber01,
};
