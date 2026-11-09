// Inkers · landing page
(() => {
  document.documentElement.classList.add('js');

  const APP_URL = 'https://app.inkers.com.br';
  // A rota é da API do Inkers; o Worker de inkers.com.br repassa /api/v1/publico/* ao servidor.
  const API = '/api/v1/publico/interesse';
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

  // Contagem de visitas e cliques (só números; nenhum dado de quem visitou)
  const registrar = (evento) => {
    try {
      fetch(`${API}/evento`, {
        method: 'POST', keepalive: true, credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento }),
      }).catch(() => {});
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

  // ---------- Baralho do hero: deslize para trocar de tela ----------
  const baralho = $('[data-baralho]');
  if (baralho) {
    const area = $('.baralho', baralho);
    const cartas = $$('.carta', area);
    const pontos = $('[data-baralho-pontos]', baralho);
    const titulo = $('[data-aviso-titulo]', baralho);
    const sub = $('[data-aviso-sub]', baralho);
    const texto = $('.aviso-texto', baralho);
    const n = cartas.length;
    let atual = 0;
    let ocupado = false;
    cartas.forEach(() => pontos.appendChild(document.createElement('span')));

    const pos = (i) => ((i % n) + n) % n;
    const aplicar = () => {
      cartas.forEach((c, i) => {
        c.classList.remove('frente', 'atras');
        if (i === atual) c.classList.add('frente');
        else if (i === pos(atual + 1)) c.classList.add('atras');
      });
      $$('span', pontos).forEach((p, i) => p.classList.toggle('ativo', i === atual));
      const [t, s] = (cartas[atual].dataset.aviso || '|').split('|');
      texto.classList.add('trocando');
      setTimeout(() => { titulo.textContent = t; sub.textContent = s; texto.classList.remove('trocando'); }, 220);
    };

    const ir = (dir) => {
      if (ocupado) return;
      ocupado = true;
      const sai = cartas[atual];
      sai.classList.remove('arrastando', 'cutuca', 'frente');
      sai.style.removeProperty('--dx');
      sai.style.removeProperty('--dr');
      sai.classList.add(dir > 0 ? 'sai-esq' : 'sai-dir');
      atual = pos(atual + dir);
      aplicar();
      setTimeout(() => { sai.classList.remove('sai-esq', 'sai-dir'); ocupado = false; }, 480);
    };

    // Arrastar com o dedo (ou mouse): a carta da frente acompanha o gesto
    let inicioX = 0, inicioY = 0, dx = 0, arrastando = false, decidido = false;
    area.addEventListener('pointerdown', (e) => {
      if (ocupado || (e.pointerType === 'mouse' && e.button !== 0)) return;
      inicioX = e.clientX; inicioY = e.clientY; dx = 0; arrastando = true; decidido = false;
      cartas[atual].classList.remove('cutuca');
    });
    area.addEventListener('pointermove', (e) => {
      if (!arrastando) return;
      const mx = e.clientX - inicioX, my = e.clientY - inicioY;
      if (!decidido) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        decidido = true;
        // gesto mais vertical: deixa a página rolar
        if (Math.abs(my) > Math.abs(mx)) { arrastando = false; return; }
        try { area.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
        cartas[atual].classList.add('arrastando');
      }
      dx = mx;
      const c = cartas[atual];
      c.style.setProperty('--dx', `${dx}px`);
      c.style.setProperty('--dr', `${dx / 18}deg`);
    });
    const soltar = () => {
      if (!arrastando) return;
      arrastando = false;
      const c = cartas[atual];
      if (!decidido) { ir(1); return; } // toque simples: próxima tela
      if (Math.abs(dx) > 50) { ir(dx < 0 ? 1 : -1); return; }
      c.classList.remove('arrastando');
      c.style.removeProperty('--dx');
      c.style.removeProperty('--dr');
    };
    area.addEventListener('pointerup', soltar);
    area.addEventListener('pointercancel', soltar);

    $('[data-baralho-prox]', baralho).addEventListener('click', () => ir(1));
    $('[data-baralho-ant]', baralho).addEventListener('click', () => ir(-1));

    aplicar();
    // Uma "cutucada" na primeira vez, sugerindo que dá para deslizar
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) cartas[0].classList.add('cutuca');
    cartas[0].addEventListener('animationend', () => cartas[0].classList.remove('cutuca'), { once: true });
  }

  // ---------- Formulário "Eu quero" ----------
  const modal = $('[data-modal]');
  const form = $('[data-form]');
  const ok = $('[data-ok]');
  const erro = $('[data-erro]');
  const enviar = $('[data-enviar]');
  let localClique = '';

  // Turnstile (verificação da Cloudflare contra robôs). A API diz se está ligado e qual a chave pública.
  const caixaTurnstile = $('[data-turnstile]');
  let turnstile = null;   // Promise<{ id } | null>
  const prepararTurnstile = () => {
    if (turnstile || !caixaTurnstile) return turnstile;
    turnstile = fetch(API, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((cfg) => new Promise((resolve) => {
        if (!cfg || !cfg.turnstile) return resolve(null);
        window.__inkersTurnstile = () => {
          try {
            const id = window.turnstile.render(caixaTurnstile, {
              sitekey: cfg.turnstile, theme: 'dark', appearance: 'interaction-only', language: 'pt-br',
              action: 'eu-quero',
            });
            resolve({ id });
          } catch (_) { resolve(null); }
        };
        const sc = document.createElement('script');
        sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__inkersTurnstile';
        sc.async = true;
        sc.onerror = () => resolve(null);
        document.head.appendChild(sc);
      }))
      .catch(() => null);
    return turnstile;
  };
  // Espera o token por alguns segundos (a verificação costuma ser invisível e rápida).
  const tokenTurnstile = async () => {
    const w = await prepararTurnstile();
    if (!w || !window.turnstile) return '';
    for (let i = 0; i < 40; i++) {
      const t = window.turnstile.getResponse(w.id);
      if (t) return t;
      await new Promise((r) => setTimeout(r, 250));
    }
    return '';
  };
  const reiniciarTurnstile = async () => {
    const w = await prepararTurnstile();
    if (w && window.turnstile) try { window.turnstile.reset(w.id); } catch (_) { /* ok */ }
  };

  const abrir = (local) => {
    localClique = local;
    registrar('clique');
    prepararTurnstile();
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
    const porEmail = () => {
      const corpo = `Eu quero o Inkers!\n\nNome: ${dados.nome}\nWhatsApp: ${f.whatsapp.value}\nInstagram: ${dados.instagram ? '@' + dados.instagram : '-'}\nCidade: ${dados.cidade || '-'}`;
      mostrarErro('');
      erro.hidden = false;
      erro.innerHTML = 'Não conseguimos registrar agora. <a href="#" data-email>Toque aqui para enviar por e-mail</a> ou tente de novo em instantes.';
      $('[data-email]', erro).addEventListener('click', (ev) => {
        ev.preventDefault();
        location.href = `mailto:brunnoribeiroangra21@gmail.com?subject=${encodeURIComponent('Eu quero o Inkers')}&body=${encodeURIComponent(corpo)}`;
      });
    };
    try {
      dados.turnstile = await tokenTurnstile();
      const r = await fetch(API, {
        method: 'POST', credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (r.ok) {
        sucesso(nome);
      } else if (r.status === 400 || r.status === 429) {
        // Mensagem da própria API (dado inválido, verificação ou limite de envios)
        let msg = 'Confira os dados e tente de novo.';
        try { msg = (await r.json()).error || msg; } catch (_) { /* ok */ }
        mostrarErro(msg);
      } else {
        porEmail();
      }
    } catch (_) {
      porEmail();
    } finally {
      reiniciarTurnstile();
      enviar.disabled = false;
      enviar.textContent = textoBotao;
    }
  });

  // Visita (contagem simples, sem dados pessoais)
  registrar('visita');
})();
