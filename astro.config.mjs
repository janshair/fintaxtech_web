import appPolicyFiles from './src/integrations/app-policy-files';
import { defineConfig } from 'astro/config';
export default defineConfig({
  integrations: [appPolicyFiles()],
  site: 'https://fintaxtech.co.uk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
