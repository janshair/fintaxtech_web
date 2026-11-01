import type {
  BriefAnswers,
  BriefCondition,
  BriefSection,
  BriefState,
} from '../../lib/client-brief/types';
import { barber01 } from './barber-01';
import { tailoring02 } from './tailoring-02';
import { automotive03 } from './automotive-03';
import { cleaning04 } from './cleaning-04';
import { juiceBar05 } from './juice-bar-05';
import { gym06 } from './gym-06';
import { consultant07 } from './consultant-07';
import { beauty08 } from './beauty-08';
import { wedding09 } from './wedding-09';

// One schema per template. Field ids must be unique across all schemas
// (prefix them with the template, like barberServices), because answers are flat.
export interface TemplateBriefSchema {
  id: string;
  // Prefix of this schema's field ids, like barber for barberServices.
  prefix: string;
  sections: BriefSection[];
  // Photos to send for this template (the logo and "None for now" are added for every template).
  files: Record<string, string>;
  // When the customer's choice in this schema makes the core booking link required.
  bookingLinkWhen?: BriefCondition;
  // Template-specific data in the shape of the template's content file; null keeps the demo copy.
  toTemplateData: (answers: BriefAnswers, rows: BriefState['rows']) => Record<string, unknown>;
}

// Templates without a schema appear in the picker as "Coming soon".
export const templateBriefSchemas: Record<string, TemplateBriefSchema> = Object.fromEntries(
  [
    barber01,
    tailoring02,
    automotive03,
    cleaning04,
    juiceBar05,
    gym06,
    consultant07,
    beauty08,
    wedding09,
  ].map((schema) => [schema.id, schema]),
);
