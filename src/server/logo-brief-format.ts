import { formatLogoBrief, type LogoSubmission } from '../lib/logo-brief/submission';
import { escapeSlackText } from './website-brief-format';

export function slackLogoParts(submission: LogoSubmission, submissionId: string) {
  const header = `New FinTaxTech Brand Brief\n\nClient: ${submission.state.answers.trading}\nProject: ${submission.state.answers.project}\nSubmission ID: ${submissionId}\n\n--------------------------------------------------\n\n`;
  // Bound escaped message lengths, including worst-case punctuation and multiline answers.
  const chunks: string[] = [];
  let chunk = '';
  for (const character of header + formatLogoBrief(submission)) {
    const escaped = escapeSlackText(character);
    if (chunk.length + escaped.length > 33000) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += escaped;
  }
  if (chunk) chunks.push(chunk);
  return chunks.map((text) => ({
    text,
    mrkdwn: false,
    link_names: false,
    unfurl_links: false,
    unfurl_media: false,
  }));
}
