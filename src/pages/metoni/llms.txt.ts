import { metoniKnowledge } from '../../content/app-knowledge';
import { appLLMSResponse } from '../../lib/app-llms';
export const GET = () => appLLMSResponse(metoniKnowledge);
