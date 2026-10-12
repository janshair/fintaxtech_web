import { createBriefDelivery } from '../client-brief/website-delivery';
import {
  formatLogoBrief,
  logoSubmissionMetadata,
  logoSubmissionPath,
  type LogoSubmission,
} from './submission';

export const logoDeliveryCopy = {
  pending: 'Securely submitting your brief to FinTaxTech…',
  delivered:
    'Your brief has been securely submitted to FinTaxTech. Download your PDF for your records and share it with us to provide your images.',
  failed:
    'Your brief could not be submitted. Your answers and PDF remain available. Try Submit brief again.',
  uncertain:
    'We could not confirm delivery. To avoid sending a duplicate, please contact FinTaxTech with the submission ID before starting another submission.',
};
export const createLogoDelivery = (
  fetcher: typeof fetch = fetch,
  pause?: (ms: number) => Promise<void>,
) =>
  createBriefDelivery(
    {
      snapshot: (submission: LogoSubmission) => ({
        ...logoSubmissionMetadata(submission),
        txt: formatLogoBrief(submission),
      }),
      path: logoSubmissionPath,
      pending: logoDeliveryCopy.pending,
      resultText: (result) => {
        if (result.status === 'delivered') return logoDeliveryCopy.delivered;
        if (result.status === 'uncertain' || result.status === 'expired')
          return `${logoDeliveryCopy.uncertain} Submission ID: ${result.submissionId ?? 'unavailable'}.`;
        return logoDeliveryCopy.failed;
      },
    },
    fetcher,
    pause,
  );
