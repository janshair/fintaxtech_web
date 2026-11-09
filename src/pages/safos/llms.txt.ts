import { safosKnowledge } from '../../content/app-knowledge';
import { appLLMSResponse } from '../../lib/app-llms';
export const GET = () => appLLMSResponse(safosKnowledge);
