// Inkers · Worker de inkers.com.br
//
// - Landing page: arquivos estáticos (ASSETS).
// - Formulários públicos do app (o "Eu quero" desta landing) vão para o nosso servidor
//   (túnel -> nginx -> API Pascal), pelo origem.inkers.com.br:
//     /api/v1/publico/...
//
// As páginas dos tatuadores (/loja/<slug>, /estatico/..., /midia/...) estão desligadas por enquanto:
// o recurso ainda não está em uso. Para religar, volte a incluir esses caminhos em CAMINHOS_DO_APP
// e o redirecionamento inkers.com.br/<slug> -> /loja/<slug> (ver histórico do git).
//
// O nginx só atende o host "origem" quando o pedido traz X-Origem-Token (prova de que veio deste
// Worker). O valor fica no secret ORIGEM_TOKEN da Cloudflare (Workers > inkers-landing-page >
// Settings > Variables and Secrets), NUNCA neste arquivo: o repositório é público.

const CAMINHOS_DO_APP = /^\/api\/v1\/publico\//;
const ORIGEM = 'origem.inkers.com.br';

function naoEncontrada() {
    return new Response('Página não encontrada', {
        status: 404,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex'
        }
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (CAMINHOS_DO_APP.test(url.pathname)) {
            if (!env.ORIGEM_TOKEN) {
                console.error('Secret ORIGEM_TOKEN não configurado: o nginx da origem vai recusar (403).');
            }
            const destino = new URL(request.url);
            destino.hostname = ORIGEM;
            if (destino.pathname.length > 1 && destino.pathname.endsWith('/')) {
                destino.pathname = destino.pathname.slice(0, -1);   // a API não aceita barra final
            }
            // A API só responde GET: o HEAD é refeito como GET e o corpo é descartado.
            // O cabeçalho é sempre o do secret: um X-Origem-Token vindo do visitante é substituído.
            const headers = new Headers(request.headers);
            headers.set('X-Origem-Token', env.ORIGEM_TOKEN || '');
            if (request.method === 'HEAD') {
                const resp = await fetch(destino.toString(), { method: 'GET', headers });
                const vazia = new Response(null, { status: resp.status, headers: resp.headers });
                vazia.headers.set('X-Robots-Tag', 'noindex');
                return vazia;
            }
            const resp = await fetch(new Request(destino, new Request(request, { headers })));
            // Respostas da API não devem ser indexadas.
            const final = new Response(resp.body, resp);
            final.headers.set('X-Robots-Tag', 'noindex');
            return final;
        }

        // Landing page (arquivos estáticos)
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) {
            return assetResp;
        }
        return naoEncontrada();
    }
};
