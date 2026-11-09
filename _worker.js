// Inkers · Worker de inkers.com.br
//
// - Landing page: arquivos estáticos (ASSETS).
// - O que é do app vem do nosso servidor (túnel -> nginx -> API Pascal), pelo origem.inkers.com.br:
//     /loja/...             páginas dos tatuadores
//     /estatico/... /midia/...  arquivos das páginas
//     /api/v1/publico/...   formulários públicos (orçamento, toques nos botões e o "Eu quero" desta landing)
// - inkers.com.br/<slug> leva para o endereço canônico /loja/<slug>.
//
// Igual ao docs/04-deploy.md do repositório divulga.

const CAMINHOS_DO_APP = /^\/(loja(\/|$)|estatico\/|midia\/|api\/v1\/publico\/)/;
const ORIGEM = 'origem.inkers.com.br';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (CAMINHOS_DO_APP.test(url.pathname)) {
            const destino = new URL(request.url);
            destino.hostname = ORIGEM;
            if (destino.pathname.length > 1 && destino.pathname.endsWith('/')) {
                destino.pathname = destino.pathname.slice(0, -1);   // a API não aceita barra final
            }
            // A API só responde GET: o HEAD é refeito como GET e o corpo é descartado.
            if (request.method === 'HEAD') {
                const resp = await fetch(destino.toString(), { method: 'GET', headers: request.headers });
                return new Response(null, { status: resp.status, headers: resp.headers });
            }
            return fetch(new Request(destino, request));
        }

        // Landing page (arquivos estáticos)
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) {
            return assetResp;
        }

        // inkers.com.br/<slug> leva para o endereço canônico /loja/<slug>
        const slug = url.pathname.replace(/^\/+|\/+$/g, '');
        if (/^[a-z0-9-]{3,60}$/.test(slug)) {
            return Response.redirect(`https://inkers.com.br/loja/${slug}`, 301);
        }
        return new Response('Página não encontrada', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};
