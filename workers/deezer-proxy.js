/**
 * Cloudflare Worker: proxy mínimo para api.deezer.com (CORS + cache edge).
 *
 * Deploy: wrangler deploy (ou painel Cloudflare) com este ficheiro como entry.
 * No indexb.html define: const DEEZER_CUSTOM_PROXY_BASE = 'https://<teu-subdomínio>.workers.dev/?url=';
 *
 * Apenas URLs que começam por https://api.deezer.com/ são aceites.
 */
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing url query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid url encoding' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!decoded.startsWith('https://api.deezer.com/')) {
      return new Response(JSON.stringify({ error: 'Only api.deezer.com URLs are allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(decoded, {
      headers: { Accept: 'application/json' },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120',
      },
    });
  },
};
