import { quizCopy as c } from '../content/questionnaire';
import type { Answers, Question } from './types';

// Contact details belong to the selected question, so navigation, review and PDF
// generation share one answer source. The inactive contact method is pruned.
export function contactField(question: Question, answers: Answers) {
  if (question.type !== 'contact') return;
  if (answers[question.id] === 'Email')
    return {
      id: `${question.id}-email`,
      label: c.emailLabel,
      type: 'email' as const,
      help: c.contactEmailHelp,
      max: 254,
    };
  if (answers[question.id] === 'WhatsApp')
    return {
      id: `${question.id}-whatsapp`,
      label: c.whatsappNumberLabel,
      type: 'tel' as const,
      help: c.contactWhatsAppHelp,
      max: 32,
    };
}
