import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://fintaxtech.co.uk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
