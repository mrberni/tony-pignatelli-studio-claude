import type { APIRoute } from 'astro';
import { getProjects } from '../lib/content';

/** Pagine pubbliche indicizzabili. Escluse 404, Privacy e Cookie (segnaposto, `noindex`). */
const STATIC_PATHS = ['/', '/progetti', '/studio', '/servizi', '/contatti'];

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const projects = await getProjects();
  const paths = [...STATIC_PATHS, ...projects.map((project) => `/progetti/${project.slug}`)];
  // Home senza barra finale doppia: `new URL('/', site)` termina già con "/"
  const urls = paths.map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
