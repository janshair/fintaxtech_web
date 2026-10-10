import { createServer } from 'node:http';
import { createWebsiteBriefListener } from './website-brief-http';

const origin = process.env.BRIEF_ORIGIN ?? '';
const webhook = process.env.SLACK_WEBHOOK ?? '';
if (!origin || !webhook)
  throw new Error(
    'Set BRIEF_ORIGIN and server-only SLACK_WEBHOOK before starting the brief service.',
  );
const trustedProxies = (process.env.BRIEF_TRUSTED_PROXIES ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const server = createServer(createWebsiteBriefListener({ origin, webhook, trustedProxies }));
server.requestTimeout = 10000;
server.headersTimeout = 10000;
server.maxConnections = 64;
server.listen(
  Number(process.env.BRIEF_API_PORT ?? 4324),
  process.env.BRIEF_API_HOST ?? '127.0.0.1',
);
