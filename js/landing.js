// Inkers · landing page
(() => {
  document.documentElement.classList.add('js');

  const APP_URL = 'https://app.inkers.com.br';
  const API = '/api/eu-quero';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Origem da visita (UTM e referência), para saber de onde vem cada interessado
  const params = new URLSearchParams(location.search);
  const origem = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    referencia: document.referrer ? new URL(document.referrer).hostname : '',
  };

  const registrar = (evento, local) => {
    try {
      const corpo = JSON.stringify({ evento, local, ...origem });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/evento', new Blob([corpo], { type: 'application/json' }));
      else fetch('/api/evento', { method: 'POST', body: corpo, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    } catch (_) { /* contagem é opcional */ }
  };

  // ---------- Topo ao rolar e barra fixa ----------
  const topo = $('[data-topo]');
  const barra = $('[data-barra]');
  const hero = $('#inicio');
  const final = $('.final');
  let finalVisivel = false;
  const aoRolar = () => {
    const y = window.scrollY;
    topo && topo.classList.toggle('rolou', y > 12);
    if (barra && hero) barra.classList.toggle('visivel', y > hero.offsetHeight * 0.75 && !finalVisivel);
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();
  if (final && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { finalVisivel = e.isIntersecting; aoRolar(); }).observe(final);
  }

  // ---------- Revelar ao rolar ----------
  const revelar = $$('.revelar');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revelar.forEach((el) => io.observe(el));
  } else {
    revelar.forEach((el) => el.classList.add('visto'));
  }

  // ---------- Vitrine (carrossel) ----------
  const vitrine = $('[data-vitrine]');
  if (vitrine) {
    const trilho = $('[data-trilho]', vitrine);
    const itens = $$('.vitrine-item', trilho);
    const pontos = $('[data-pontos]', vitrine);
    const ant = $('[data-anterior]', vitrine);
    const prox = $('[data-proximo]', vitrine);
    itens.forEach(() => pontos.appendChild(document.createElement('span')));
    const passo = () => (itens[1] ? itens[1].offsetLeft - itens[0].offsetLeft : trilho.clientWidth);
    const atualizar = () => {
      const i = Math.round(trilho.scrollLeft / passo());
      $$('span', pontos).forEach((p, n) => p.classList.toggle('ativo', n === Math.min(i, itens.length - 1)));
      ant.disabled = trilho.scrollLeft < 8;
      prox.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 8;
    };
    ant.addEventListener('click', () => trilho.scrollBy({ left: -passo(), behavior: 'smooth' }));
    prox.addEventListener('click', () => trilho.scrollBy({ left: passo(), behavior: 'smooth' }));
    trilho.addEventListener('scroll', () => requestAnimationFrame(atualizar), { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  // ---------- Formulário "Eu quero" ----------
  const modal = $('[data-modal]');
  const form = $('[data-form]');
  const ok = $('[data-ok]');
  const erro = $('[data-erro]');
  const enviar = $('[data-enviar]');
  let localClique = '';

  const abrir = (local) => {
    localClique = local;
    registrar('eu_quero_clique', local);
    if (!modal) { location.href = APP_URL; return; }
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    setTimeout(() => form && !form.hidden && form.elements.nome.focus(), 60);
  };
  const fechar = () => (typeof modal.close === 'function' ? modal.close() : modal.removeAttribute('open'));

  $$('[data-eu-quero]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.euQuero)));
  $$('[data-fechar]', modal).forEach((b) => b.addEventListener('click', fechar));
  modal && modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  // Máscara do WhatsApp: (00) 00000-0000
  const whats = form && form.elements.whatsapp;
  whats && whats.addEventListener('input', () => {
    let d = whats.value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) d = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    else if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else if (d.length) d = `(${d}`;
    whats.value = d;
  });

  const mostrarErro = (msg, campo) => {
    erro.textContent = msg;
    erro.hidden = !msg;
    $$('input', form).forEach((i) => i.removeAttribute('aria-invalid'));
    if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
  };

  const sucesso = (nome) => {
    const primeiro = nome.split(' ')[0];
    $('[data-ok-titulo]').textContent = `Pronto, ${primeiro}! Você está na lista.`;
    form.hidden = true;
    ok.hidden = false;
    $('[data-abrir-app]', ok).focus();
  };

  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const nome = f.nome.value.trim();
    const digitos = f.whatsapp.value.replace(/\D/g, '');
    if (nome.length < 2) return mostrarErro('Conta pra gente como você quer ser chamado.', f.nome);
    if (digitos.length < 10 || digitos.length > 11) return mostrarErro('Confira o WhatsApp com DDD, por favor.', f.whatsapp);
    mostrarErro('');

    const dados = {
      nome,
      whatsapp: digitos,
      instagram: f.instagram.value.trim().replace(/^@+/, ''),
      cidade: f.cidade.value.trim(),
      site: f.site.value,
      local: localClique,
      ...origem,
    };

    enviar.disabled = true;
    const textoBotao = enviar.textContent;
    enviar.textContent = 'Enviando...';
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      if (!r.ok) throw new Error(String(r.status));
      sucesso(nome);
    } catch (_) {
      // Se o registro falhar, o contato não se perde: abre um e-mail já preenchido
      const corpo = `Eu quero o Inkers!\n\nNome: ${dados.nome}\nWhatsApp: ${f.whatsapp.value}\nInstagram: ${dados.instagram ? '@' + dados.instagram : '-'}\nCidade: ${dados.cidade || '-'}`;
      mostrarErro('');
      erro.hidden = false;
      erro.innerHTML = 'Não conseguimos registrar agora. <a href="#" data-email>Toque aqui para enviar por e-mail</a> ou tente de novo em instantes.';
      $('[data-email]', erro).addEventListener('click', (ev) => {
        ev.preventDefault();
        location.href = `mailto:brunnoribeiroangra21@gmail.com?subject=${encodeURIComponent('Eu quero o Inkers')}&body=${encodeURIComponent(corpo)}`;
      });
    } finally {
      enviar.disabled = false;
      enviar.textContent = textoBotao;
    }
  });

  // Visita (contagem simples, sem dados pessoais)
  registrar('visita', location.pathname);
})();
