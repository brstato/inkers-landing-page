export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\/+|\/+$/g, '');

    // Só aceita um único segmento (ex: "bruno"), nunca "bruno/algo" ou vazio
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