import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Server-only preload for HTTP/browser tests. Never contact a real Slack webhook.
const originalFetch = globalThis.fetch;
const failed = new Set();
globalThis.fetch = async (input, options) => {
  const url = input instanceof Request ? input.url : String(input);
  if (new URL(url).hostname !== 'hooks.slack.com') return originalFetch(input, options);
  if (url !== 'https://hooks.slack.com/services/TEST_ONLY')
    throw new Error('Real Slack transport is forbidden in tests');
  const message = JSON.parse(options.body);
  const id = message.text.match(/Submission ID: ([a-f0-9-]+)/)?.[1];
  const reject = message.text.includes('HTTP-MOCK-FAIL-ONCE') && !failed.has(id);
  failed.add(id);
  if (process.env.BRIEF_MOCK_CALLS_FILE) {
    await mkdir(dirname(process.env.BRIEF_MOCK_CALLS_FILE), { recursive: true });
    await appendFile(
      process.env.BRIEF_MOCK_CALLS_FILE,
      JSON.stringify({ message, status: reject ? 400 : 200 }) + '\n',
    );
  }
  return new Response(reject ? 'invalid_payload' : 'ok', { status: reject ? 400 : 200 });
};
