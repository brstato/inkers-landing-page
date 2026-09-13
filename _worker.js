export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Tenta servir como arquivo estático primeiro (index.html, css/, js/, etc.)
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) {
            return assetResp;
        }

        // Se não achou asset estático, trata como slug de tatuador
        const slug = url.pathname.replace(/^\/+|\/+$/g, '');
        if (!slug || slug.includes('/')) {
            return new Response('Página não encontrada', { status: 404 });
        }

        const origem = `https://${slug}.inkers.com.br/`;
        const resp = await fetch(origem, {
            headers: { 'User-Agent': request.headers.get('User-Agent') || '' }
        });

        return new Response(resp.body, {
            status: resp.status,
            headers: resp.headers
        });
    }
};