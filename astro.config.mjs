import appPolicyFiles from './src/integrations/app-policy-files';
import markdownTables from './src/integrations/markdown-tables';
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';
export default defineConfig({
  integrations: [appPolicyFiles()],
  markdown: { processor: satteri({ hastPlugins: [markdownTables] }) },
  site: 'https://fintaxtech.co.uk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
