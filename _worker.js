// Inkers · worker da landing page
//
// Rotas:
//   POST /api/eu-quero        guarda o contato de quem clicou em "Eu quero"
//   POST /api/evento          conta visitas e cliques no "Eu quero" (sem dados pessoais)
//   GET  /api/eu-quero/lista  exporta os contatos e as contagens em CSV
//                             (precisa do cabeçalho "Authorization: Bearer <ADMIN_CHAVE>"
//                              ou de ?chave=<ADMIN_CHAVE>)
//   /<slug>                   página pública do tatuador (proxy para <slug>.inkers.com.br)
//
// Configuração no Cloudflare:
//   - KV namespace com binding LEADS (veja wrangler.jsonc)
//   - secret ADMIN_CHAVE: `npx wrangler secret put ADMIN_CHAVE`

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const resposta = (corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: JSON_HEADERS });
const limpa = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const hoje = () => new Date().toISOString().slice(0, 10);

async function lerJson(request, limite = 4096) {
    const texto = await request.text();
    if (texto.length > limite) throw new Error('grande');
    return JSON.parse(texto || '{}');
}

async function somar(env, chave) {
    // KV não tem incremento atômico; para contagem de interesse, a aproximação basta.
    const atual = Number(await env.LEADS.get(chave)) || 0;
    await env.LEADS.put(chave, String(atual + 1));
}

function mesmaOrigem(request, url) {
    const origin = request.headers.get('Origin');
    return !origin || new URL(origin).host === url.host;
}

async function euQuero(request, env, url) {
    if (!env.LEADS) return resposta({ erro: 'armazenamento_nao_configurado' }, 503);
    if (!mesmaOrigem(request, url)) return resposta({ erro: 'origem' }, 403);

    let d;
    try { d = await lerJson(request); } catch { return resposta({ erro: 'dados_invalidos' }, 400); }

    // Campo isca: robôs preenchem, pessoas não veem. Responde ok sem guardar.
    if (d.site) return resposta({ ok: true });

    const nome = limpa(d.nome, 80);
    const whatsapp = limpa(d.whatsapp, 20).replace(/\D/g, '');
    if (nome.length < 2 || whatsapp.length < 10 || whatsapp.length > 11) {
        return resposta({ erro: 'dados_invalidos' }, 400);
    }

    // Evita duplicar a mesma pessoa: a chave do contato é o WhatsApp.
    const chave = `lead:${whatsapp}`;
    const anterior = await env.LEADS.get(chave, 'json');
    const agora = new Date().toISOString();
    const novo = {
        nome,
        whatsapp,
        instagram: limpa(d.instagram, 40).replace(/^@+/, ''),
        cidade: limpa(d.cidade, 60),
        local: limpa(d.local, 30),
        utm_source: limpa(d.utm_source, 60),
        utm_medium: limpa(d.utm_medium, 60),
        utm_campaign: limpa(d.utm_campaign, 80),
        referencia: limpa(d.referencia, 120),
        pais: request.cf?.country || '',
        criado_em: anterior?.criado_em || agora,
        atualizado_em: agora,
        envios: (anterior?.envios || 0) + 1,
    };
    // Num reenvio, campo deixado em branco não apaga o que a pessoa já tinha informado.
    const lead = { ...(anterior || {}) };
    for (const [k, v] of Object.entries(novo)) if (v !== '' || !(k in lead)) lead[k] = v;
    await env.LEADS.put(chave, JSON.stringify(lead));
    if (!anterior) await somar(env, 'total:contatos');
    return resposta({ ok: true });
}

async function evento(request, env, url) {
    if (!env.LEADS || !mesmaOrigem(request, url)) return new Response(null, { status: 204 });
    let d;
    try { d = await lerJson(request, 1024); } catch { return new Response(null, { status: 204 }); }
    const tipo = d.evento === 'visita' ? 'visitas' : d.evento === 'eu_quero_clique' ? 'cliques' : null;
    if (tipo) {
        await somar(env, `total:${tipo}`);
        await somar(env, `dia:${hoje()}:${tipo}`);
    }
    return new Response(null, { status: 204 });
}

// Aspas escapadas e proteção contra fórmulas ao abrir no Excel/Planilhas
const csv = (v) => {
    let t = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return `"${t.replace(/"/g, '""')}"`;
};

async function lista(request, env, url) {
    const chave = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('chave');
    if (!env.ADMIN_CHAVE || chave !== env.ADMIN_CHAVE) return new Response('Não autorizado', { status: 401 });
    if (!env.LEADS) return new Response('Armazenamento não configurado', { status: 503 });

    const leads = [];
    let cursor;
    do {
        const pagina = await env.LEADS.list({ prefix: 'lead:', cursor });
        for (const k of pagina.keys) {
            const l = await env.LEADS.get(k.name, 'json');
            if (l) leads.push(l);
        }
        cursor = pagina.list_complete ? undefined : pagina.cursor;
    } while (cursor);
    leads.sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));

    const [visitas, cliques, contatos] = await Promise.all(
        ['visitas', 'cliques', 'contatos'].map((t) => env.LEADS.get(`total:${t}`)),
    );

    const colunas = ['criado_em', 'nome', 'whatsapp', 'instagram', 'cidade', 'local', 'utm_source', 'utm_medium', 'utm_campaign', 'referencia', 'pais', 'envios'];
    const linhas = [
        `# visitas=${visitas || 0}; cliques_eu_quero=${cliques || 0}; contatos=${contatos || leads.length}`,
        colunas.join(','),
        ...leads.map((l) => colunas.map((c) => csv(l[c])).join(',')),
    ];
    return new Response('﻿' + linhas.join('\n'), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="inkers-eu-quero-${hoje()}.csv"`,
            'Cache-Control': 'no-store',
        },
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            if (url.pathname === '/api/eu-quero' && request.method === 'POST') return euQuero(request, env, url);
            if (url.pathname === '/api/evento' && request.method === 'POST') return evento(request, env, url);
            if (url.pathname === '/api/eu-quero/lista' && request.method === 'GET') return lista(request, env, url);
            return resposta({ erro: 'nao_encontrado' }, 404);
        }

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
