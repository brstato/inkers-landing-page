# Documentação de Desenvolvimento e Conformidade Google: Inkers

## 1. Visão Geral do Projeto e Proposta de Valor
Desenvolvimento da página oficial e interface de entrada do aplicativo **Inkers** (SaaS focado em gestão, posicionamento digital e agendamento para tatuadores).
O sistema é pensado e construído com empatia ("feito de tatuador para tatuador"), visando profissionalizar o estúdio e organizar a rotina do profissional.

* **Aplicação:** Inkers
* **Domínio do App/Login:** `https://app.inkers.com.br`
* **Tecnologias da Landing Page:** HTML5 Semântico, CSS3 e JavaScript Puro (Vanilla JS). Sem frameworks pesados.
* **Hospedagem da Landing Page:** Cloudflare Pages.
* **E-mail de Contato/Suporte Oficial:** `brunnoribeiroangra21@gmail.com`

---

## 2. Estrutura de Diretórios Recomendada
```text
/
├── index.html                    # Landing page otimizada (Funil de Vendas)
├── politica-de-privacidade.html  # Obrigatório para OAuth
├── termos-de-uso.html            # Regras do serviço
├── exclusao-de-dados.html        # Instruções de deleção (Obrigatório)
├── suporte.html                  # Canal de contato
├── css/
│   └── style.css                 # Estilos (Mobile-First) e Variáveis de UI
├── js/
│   └── main.js                   # Interatividade assíncrona
├── assets/
│   ├── favicon.png               # Ícone da página
│   └── inkers_logo.png           # Logotipo oficial
├── robots.txt                    # Diretrizes de rastreamento
├── sitemap.xml                   # Mapa do site
└── _headers                      # Regras de Cache-Control para Cloudflare
```

---

## 3. Diretrizes de UI/UX e Performance

### 3.1. Arquitetura Mobile-First e Identidade Visual
* **CSS Base:** Desenvolver primeiro para mobile. Utilizar `min-width` para media queries (tablets e desktops).
* **Cores:** Fundo Dark Mode (`#121212`), Destaques em Coral (`#FF7F50`), Textos de botões em Old Lace (`#FDF5E6`).
* **Usabilidade:** Áreas de toque de no mínimo 44x44px. Imagens fluidas (`max-width: 100%`).
* **Performance:** CSS crítico inline, `font-display: swap`, imagens otimizadas com `loading="lazy"`, e JS com `defer`.

### 3.2. SEO e Acessibilidade
* Meta tags completas (Title, Description, Open Graph e Twitter Cards).
* Tag `<link rel="canonical">` e Schema.org (`SoftwareApplication`).
* Contraste acessível em botões e atributos `alt` em todas as imagens.

---

## 4. Conformidade: Google OAuth2 & Google Calendar

### 4.1. Escopos e Segurança
* **Escopos Solicitados:** `openid`, `userinfo.email`, `https://www.googleapis.com/auth/calendar.events`.
* **Isolamento:** Todo o fluxo de login ocorre estritamente e com segurança em `https://app.inkers.com.br`.
* **Segurança:** Os tokens de acesso do Google (pessoais ou de calendário) são armazenados de forma extremamente segura e criptografada no banco de dados.

### 4.2. Política de Privacidade (`politica-de-privacidade.html`)
A documentação de privacidade deve obrigatoriamente incluir a seção **"Tratamento de Dados do Google"**:
* O Inkers acessa o Google Calendar **exclusivamente** para sincronizar agendamentos e lembretes de sessões de tatuagem.
* Os dados pessoais da agenda do usuário não são comercializados, extraídos ou usados para anúncios/publicidade de nenhuma forma.
* O uso dessas informações atende estritamente à **Política de Dados do Usuário dos Serviços de API do Google**, incluindo todos os requisitos de Uso Limitado.
* **Contato para dúvidas de privacidade:** `brunnoribeiroangra21@gmail.com`

### 4.3. Exclusão de Dados (`exclusao-de-dados.html`)
* Rota pública explicando claramente que o tatuador pode revogar o acesso via painel administrativo do aplicativo a qualquer momento.
* Para solicitar a **exclusão total e permanente de dados** (incluindo remoção em cascata dos tokens criptografados) sem necessidade de fazer login, o usuário deve enviar um e-mail formal para `brunnoribeiroangra21@gmail.com`.

### 4.4. Suporte (`suporte.html`)
* Centralizar todo o atendimento e abertura de tickets no e-mail oficial: `brunnoribeiroangra21@gmail.com`.
* Incluir na página de suporte um guia visual (passo a passo) de como desconectar o Google Calendar pela conta Google do usuário.

---

## 5. Checklist de Deploy e Submissão
- [ ] Criar as páginas HTML auxiliares (`politica-de-privacidade.html`, `termos-de-uso.html`, `exclusao-de-dados.html`, `suporte.html`).
- [ ] Fazer o deploy da pasta raiz no Cloudflare Pages (*Build command em branco, output /*).
- [ ] Configurar `https://app.inkers.com.br` como **origem autorizada** no Google Cloud Console.
- [ ] Garantir que os links de Privacidade e Termos estejam sempre visíveis no footer da landing page e na tela de login.
- [ ] Gravar o **vídeo de demonstração** exibindo o fluxo de login no app via OAuth, a tela de consentimento e a criação real de um evento no calendário para o review do Google.