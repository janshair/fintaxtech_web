import appPolicyFiles from './src/integrations/app-policy-files';
import websiteBriefAPI from './src/integrations/website-brief-api';
import markdownTables from './src/integrations/markdown-tables';
import markdownChecklists from './src/integrations/markdown-checklists';
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
// PUBLIC_ values can enter browser bundles. Fail closed if the retired secret name returns.
if (
  process.env.PUBLIC_SLACK_WEBHOOK ||
  [
    '.env',
    '.env.local',
    '.env.production',
    '.env.production.local',
    '.env.development',
    '.env.development.local',
  ].some((file) => {
    const url = new URL(file, import.meta.url);
    return (
      existsSync(url) &&
      /^\s*(?:export\s+)?PUBLIC_SLACK_WEBHOOK\s*=/m.test(readFileSync(url, 'utf8'))
    );
  })
)
  throw new Error(
    'Remove PUBLIC_SLACK_WEBHOOK. Configure SLACK_WEBHOOK only on the brief service runtime.',
  );
export default defineConfig({
  integrations: [appPolicyFiles(), websiteBriefAPI()],
  markdown: { processor: satteri({ hastPlugins: [markdownTables, markdownChecklists] }) },
  site: 'https://fintaxtech.co.uk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // PDF is loaded on completion. Prebundle it before dev clients start so discovering
  // that dependency cannot reload the page and clear an in-memory questionnaire.
  vite: { optimizeDeps: { include: ['jspdf'] } },
});
