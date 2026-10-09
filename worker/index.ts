/**
 * Worker di Cloudflare davanti al sito statico: risponde solo a `/api/contact`
 * (vedi `run_worker_first` in wrangler.jsonc); tutto il resto lo servono gli asset di `dist/`.
 */
import { handleContact, type ContactEnv } from './contact.ts';

interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
