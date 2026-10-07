import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // Dominio definitivo per canonical, sitemap e Open Graph. Si cambia con PUBLIC_SITE_URL (es. se si sceglie il dominio senza www).
  site: process.env.PUBLIC_SITE_URL || 'https://www.tonypignatellistudio.com',
  trailingSlash: 'never',
  build: { format: 'file' },
});
