import { createClientBriefPDF } from '../client-brief/pdf';
import { clientBriefDefinitions } from '../client-brief/definitions';
import type { BriefState } from './types';
export const createLogoBriefPDF = (state: BriefState, completed = new Date()) =>
  createClientBriefPDF(clientBriefDefinitions.logo, state, completed);
