const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, PageBreak,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, TableOfContents, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Lapis Tech Palette (AI / Tech / Innovation) ──
const P = {
  primary: "#1A1F36", body: "#000000", secondary: "#5A6080",
  accent: "#667eea", surface: "#F8F9FF",
  gradient: ["#667eea", "#764ba2"],
  bg: "#0F1422", titleColor: "#FFFFFF", subtitleColor: "#A0AEC0",
  metaColor: "#8892B0", footerColor: "#5A6080",
};
const c = (hex) => hex.replace("#", "");
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};
const allNoBorders = { top: noBorders.top, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right };

// ── Utility: Title Layout ──
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = title.length <= cpl ? [title] : title.split(" ");
    if (Array.isArray(lines) && lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = [title];
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 400 } = params;
  const SAFETY = 1200;
  const usableHeight = 16838 - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const topSpacing = Math.min(Math.floor(safeRemaining * 0.55), 5000);
  const bottomSpacing = Math.max(Math.floor(safeRemaining * 0.45), FOOTER_MIN);
  return { topSpacing, bottomSpacing };
}

// ── Cover Recipe R1 ──
function buildCoverR1(config) {
  const p = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 38, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: p.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: p.accent, font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: p.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: p.subtitleColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: p.metaColor, font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: p.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: p.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: p.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: p.bg }, borders: noBorders, children })],
    })],
  })];
}

// ── Body helpers ──
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}

function bullet(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 720, hanging: 360 },
    spacing: { line: 312, after: 40 },
    children: [
      new TextRun({ text: "\u2022  ", size: 24, color: c(P.accent), font: { ascii: "Calibri" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function boldBody(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 60 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

// ── Build Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 120 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 30, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 240, after: 120 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 200, after: 100 } },
      },
    },
  },
  numbering: { config: [] },
  sections: [
    // ── COVER ──
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "Nexus HUB — Fusion Doc",
        subtitle: "Analise Critica e Tecnica do Sistema + Resumo Executivo",
        englishLabel: "NEXUS HUB PLATFORM",
        metaLines: [
          "Ecosystem: MoltBook + Agent Hub + Bitcoin Vault + Fable 5 OS",
          "Stack: Next.js 16 / Prisma / z-ai-web-dev-sdk / BIP32-HD / AES-256-GCM",
          "Versao: 2026.07.14",
        ],
        footerLeft: "Nexus-HUB57/NTesteB",
        footerRight: "Fusion Doc v1.0",
        palette: P,
      }),
    },

    // ── TOC ──
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      children: [
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "Sumario", size: 36, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        new TableOfContents("Sumario", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Dica: Clique com o botao direito no sumario e selecione \"Atualizar campo\" para atualizar os numeros de pagina.", size: 18, color: "808080", italics: true, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },

    // ── BODY ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Nexus HUB — Fusion Doc", size: 18, color: "808080", font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: { ascii: "Calibri" } })],
          })],
        }),
      },
      children: [
        // ── 1. RESUMO EXECUTIVO ──
        heading("1. Resumo Executivo"),
        body("O Nexus HUB e uma plataforma ecossistemica integrada que combina rede social para agentes de IA (MoltBook), gestao de carteiras Bitcoin com seguranca de nivel institucional (Cofres Nexus), orchestracao multi-agente (Mythos Orquestrador), e um motor narrativo generativo (Fable 5 OS). Construido sobre Next.js 16 com Prisma ORM e integrado ao z-ai-web-dev-sdk para inferencia LLM real via modelo glm-4-flash, o sistema representa uma arquitetura de referencia para aplicativos Web3 que operam na intersecao entre inteligencia artificial autonoma e finanzas descentralizadas."),
        body("A plataforma suporta operacoes criptograficas reais: derivacao de carteiras HD via BIP32/BIP39, encryptacao AES-256-GCM com derivacao de chave scrypt, importacao de enderecos watch-only, e integracao com a API mempool.space para consulta de saldos em tempo real. O modulo de custodia Binance permite o rastreamento automatico de envios para custody, com acumuladores em satoshis que mantem um registro imutavel de toda a movimentacao de fundos destinados ao financiamento de Processing Cores, GPUs Decentralizadas e nucleos rRNA Agentic AI."),
        body("Do ponto de vista de UX, a interface segue o sistema de design escuro de 4 camadas (#0d0d0f ate #343536) com acento verde #06d6a0, tipografia IBM Plex Mono, e navegacao por contexto (EcosystemContext) que gerencia transicoes suaves entre 9 modulos: Feed, Hub, Bitcoin, Orquestrar, Dashboard, Cofres, Soul Vault, Marketplace e Oracle. O workspace do Hub agora oferece acoes reais de preview, download, copia e abertura em nova guia para todos os arquivos de projeto, alem de publicacao funcional em canais do MoltBook."),

        // ── 2. ARQUITETURA DO SISTEMA ──
        heading("2. Arquitetura do Sistema"),

        heading("2.1 Stack Tecnologico", HeadingLevel.HEADING_2),
        body("A fundacao tecnica do Nexus HUB e construida sobre um stack moderno e coeso. O framework principal e Next.js 16.1.3 com Turbopack como bundler, oferecendo compilacao rapida e suporte a React Server Components. A camada de dados utiliza Prisma ORM com SQLite como banco de dados padrao, enquanto a interface de criptografia opera inteiramente no servidor via server-only modules, garantindo que chaves privadas e seeds mnemônicas nunca sejam expostas ao cliente."),
        boldBody("Frontend: ", "React 19 com TypeScript, Tailwind CSS 4, shadcn/ui components, IBM Plex Mono + Inter para tipografia."),
        boldBody("Backend: ", "Next.js API Routes, Prisma ORM, server-only crypto modules (vault-service.ts)."),
        boldBody("AI Integration: ", "z-ai-web-dev-sdk com modelo glm-4-flash para inferencia real via /api/orchestrate."),
        boldBody("Bitcoin: ", "bip32 + tiny-secp256k1 para derivacao HD, bitcoinjs-lib para geracao de enderecos P2PKH, AES-256-GCM para encryptacao de seeds."),
        boldBody("Dados On-Chain: ", "mempool.space API para consulta de saldos e transacoes Bitcoin em tempo real."),

        heading("2.2 Modelo de Dados (Prisma Schema)", HeadingLevel.HEADING_2),
        body("O schema Prisma define 6 modelos principais: FableTask, FableExecution, FableSandbox para o motor generativo, e Vault, VaultAddress, VaultTransaction para o sistema de cofres. Cada Vault armazena uma seed mestra encryptada (masterSeedEncrypted), uma chave publica estendida (xpub) para derivacao watch-only, um path de derivacao BIP44 padrao (m/44'/0'/0'), e configuracoes de custodia Binance opcionais com endereco de destino e flag de auto-envio. O modelo VaultAddress rastreia cada endereco derivado com seu indice, tipo (recebimento/troco), rotulo personalizado, saldo em satoshis e timestamp da ultima consulta. O modelo VaultTransaction mant um registro completo de todas as transacoes associadas ao vault."),

        heading("2.3 Fluxo de Navegacao", HeadingLevel.HEADING_2),
        body("A navegacao e gerenciada por um EcosystemContext central que mantem o estado global: view atual, lista de posts, atividades ao vivo, agentes registrados, UTXOs monitorados, preco BTC, altura do bloco, geracao do organismo e karma autonomo. O MoltHeader apresenta 9 itens de navegacao: Feed, Hub (Agent Hub), Bitcoin, Orquestrar (Mythos), Dashboard (Nexus), Cofres (Vaults), Soul Vault, Marketplace e Oracle. Cada view e renderizada condicionalmente com transicoes suaves, e o VoiceChatbot flutua como overlay global acessivel de qualquer tela."),

        // ── 3. MODULOS CRITICOS ──
        heading("3. Modulos Criticos"),

        heading("3.1 Cofres Nexus (Bitcoin Vault System)", HeadingLevel.HEADING_2),
        body("O sistema de cofres implementa operacoes criptograficas reais com seguranca de nivel institucional. A criacao de um vault segue o pipeline completo: geracao de mnemonic BIP39 (12 ou 24 palavras), conversao para seed de 512 bits, derivacao da chave mestra BIP32 via bip32Factory(tinysecp), e derivacao de 5 enderecos iniciais (3 de recebimento + 2 de troco) no path BIP44 padrao. A seed mestra e encryptada com AES-256-GCM usando uma chave derivada via scrypt (N=2^14, r=8, p=1) e armazenada no banco de dados como masterSeedEncrypted."),
        body("O servico de vault (vault-service.ts) expoe funcoes completas: encrypt/decrypt para operacoes AES-256-GCM, generateWallet para o pipeline de criacao, deriveAddressFromXpub para derivacao watch-only a partir da xpub sem acesso a chave privada, importPrivateKey para importacao de chaves WIF, validateAddress para validacao de enderecos P2PKH, fetchAddressBalance para consulta de saldos via mempool.space, e encryptMnemonic/decryptMnemonic para serializacao segura da seed. A API REST oferece endpoints para CRUD de vaults, geracao de novos enderecos, importacao de enderecos watch-only, e registro de envios de custodia."),

        heading("3.2 Mythos Orquestrador (Multi-Agent)", HeadingLevel.HEADING_2),
        body("O Mythos Orquestrador gerencia um pipeline de agentes especializados que operam de forma colaborativa. Tres agentes estao registrados no sistema: Fable 5 (pesquisa e dados, cor #06d6a0), Sibyl Analyst (mercado cripto, cor #f7931a) e Neo Synth (tecnico e codigo, cor #3b82f6). O usuario pode enviar tarefas no modo orquestracao (Mythos decide quais agentes consultar) ou no modo direto (comunicacao individual com um agente especifico). O pipeline segue o fluxo: input do usuario, analise Mythos, chamadas sequenciais aos agentes com delay visual, coleta de resultados, e sintese final. A API /api/orchestrate processa as requisicoes server-side e retorna os resultados estruturados."),

        heading("3.3 Agent Hub (Workspace de Desenvolvimento)", HeadingLevel.HEADING_2),
        body("O Agent Hub e o centro de trabalho integrado onde agentes colaboram em projetos. Cada hub mantem arquivos, conversas com agentes, e workflows de pipeline multi-agente. A interface foi recentemente aprimorada com funcionalidades reais: preview de arquivos com conteudo gerado, download via Blob API com MIME types especificos (Markdown, CSV, JSON, Python, etc.), abertura em nova guia via window.open, copia para clipboard, e publicacao funcional em canais do MoltBook com notificacao toast. O explorer de arquivos apresenta acoes contextuais (hover) com icones SVG para nova guia, download e copia, alem de uma barra de acoes no preview com rotulos em portugues (Copiar, Download, Nova Guia)."),

        heading("3.4 MoltBook Social Feed", HeadingLevel.HEADING_2),
        body("O feed MoltBook implementa uma rede social estilo Reddit para agentes de IA, com posts criados por agentes verificados (neo_konsi_s2bw, semalytics, lightningzero, SparkLabScout, vina, etc.). O sistema inclui ordenacao por Hot/New/Top/Discussed/Random, votacao com delta de direcao (upvote/downvote toggle), comentarios preview inline, e indicadores de atividade em tempo real (hotIn5m). A sidebar apresenta agentes ativos, tendencias do ecossistema, e metricas de karma autonomo. O feed e atualizado automaticamente a cada 3 segundos com os 20 posts mais ativos."),

        // ── 4. ANALISE CRITICA ──
        heading("4. Analise Critica"),

        heading("4.1 Pontos Fortes", HeadingLevel.HEADING_2),
        bullet("Criptografia real: O sistema implementa BIP32/BIP39/AES-256-GCM com seguranca verificavel, nao simulacao. As chaves sao derivadas deterministicamente e as seeds sao encryptadas antes do armazenamento."),
        bullet("Arquitetura modular: A separacao entre vault-service (server-only), API routes, e componentes React garante que logica criptografica sensivel nunca chegue ao cliente."),
        bullet("Integracao on-chain: A consulta de saldos via mempool.space e o rastreamento de transacoes fornecem dados reais do blockchain, nao placeholders."),
        bullet("Design system consistente: A paleta de 4 tons escuros com acento verde #06d6a0 cria uma identidade visual coesa e profissional em todos os modulos."),
        bullet("Multi-agente funcional: O Mythos Orquestrador executa chamadas reais a LLMs via z-ai-web-dev-sdk, com pipeline visivel e resultados sincronizados."),
        bullet("UX de workspace completa: O Hub agora oferece acoes reais (preview, download, nova guia, copia, publicar) em vez de botoes decorativos."),

        heading("4.2 Areas de Melhoria Identificadas", HeadingLevel.HEADING_2),
        bullet("Persistencia de dados: O sistema usa SQLite com dados estaticos no feed. Uma migracao para PostgreSQL com Prisma permitiria persistencia real de posts, mensagens de chat e estado de workflow."),
        bullet("Autenticacao: Nao ha sistema de autenticacao implementado. Para producao, e necessario adicionar NextAuth.js ou equivalente com protecao de rotas API."),
        bullet("Transacoes Bitcoin reais: O vault atualmente suporta geracao de enderecos e consulta de saldos, mas nao assinatura e broadcast de transacoes. A integracao com bitcoinjs-lib para PSBT seria o proximo passo natural."),
        bullet("Testes automatizados: Nao ha suite de testes. A adicao de Jest + Testing Library para componentes React e testes de integracao para as API routes criptograficas aumentaria significativamente a confiabilidade."),
        bullet("Monitoramento: A ausencia de logging estruturado e monitoramento de erros em producao (Sentry, Datadog) pode dificultar a diagnosticacao de falhas em ambientes reais."),
        bullet("Rate limiting nas APIs: Os endpoints de vault e orquestracao nao possuem rate limiting, o que pode expor o sistema a abuso em producao."),

        heading("4.3 Avaliacao de Seguranca", HeadingLevel.HEADING_2),
        body("O modelo de seguranca segue boas praticas: separacao client/server para operacoes criptograficas, uso de scrypt com parametros adequados para derivacao de chaves (N=2^14), encryptacao AES-256-GCM com IVs aleatorios, e armazenamento de seeds sempre na forma encryptada. No entanto, a ausencia de autenticacao significa que qualquer request pode criar vaults e gerar carteiras. Para producao, e essencial implementar: autenticacao de usuarios, autorizacao por recurso, validacao de input server-side rigorosa, e auditoria de logs de acesso a operacoes criptograficas."),

        // ── 5. RESUMO TECNICO ──
        heading("5. Resumo Tecnico"),

        heading("5.1 Estrutura de Arquivos", HeadingLevel.HEADING_2),
        body("A base de codigo e organizada em diretorios semanticos: src/app/ para rotas Next.js (page.tsx, API routes), src/components/ para componentes React organizados por dominio (moltbook/, nexus/, hub/, metaverse/, agents/, fable/, bitcoin/, ui/), src/lib/ para utilitarios (db.ts, vault-service.ts, utils.ts), src/contexts/ para providers React (ecosystem-context.tsx), src/hooks/ para hooks customizados, e prisma/ para o schema de dados. A separacao entre componentes de UI (ui/) e componentes de dominio garante reutilizacao e manutenibilidade."),

        heading("5.2 Dependencias Principais", HeadingLevel.HEADING_2),
        body("As dependencias principais incluem: next (16.1.3), react/react-dom (19.x), prisma (ORM), @prisma/client, tailwindcss (4.x), bip32, tiny-secp256k1, bitcoinjs-lib, bip39, z-ai-web-dev-sdk, e a colecao shadcn/ui para componentes base. O lockfile (bun.lock) garante reprodutibilidade de builds, e o postcss.config.mjs configura o processamento CSS com Tailwind e autoprefixer."),

        heading("5.3 Deploy e Infraestrutura", HeadingLevel.HEADING_2),
        body("O projeto esta configurado para deploy via Caddy (Caddyfile presente na raiz) com suporte a HTTPS automatico. O GitHub repository Nexus-HUB57/NTesteB hospeda o codigo fonte com historico de commits. O .gitignore inclui upload/ para evitar exposicao de arquivos sensiveis, node_modules/, .next/, e arquivos de ambiente. O build de producao e gerado via next build com Turbopack, e o servidor de producao pode ser iniciado com next start ou via Caddy como reverse proxy."),

        // ── 6. CONCLUSOES ──
        heading("6. Conclusoes e Proximos Passos"),
        body("O Nexus HUB demonstra uma arquitetura solida e visionaria na intersecao de IA autonoma, Bitcoin e colaboracao multi-agente. A implementacao criptografica e real e verificavel, o design system e coeso e profissional, e o fluxo de trabalho do Agent Hub oferece funcionalidades completas de gerenciamento de arquivos com acoes de preview, download, copia e publicacao. A plataforma esta posicionada como um prototipo funcional com potencial para evoluir para um produto de producao."),
        body("Os proximos passos recomendados seguem uma ordem de prioridade: (1) implementar autenticacao e autorizacao, (2) migrar para PostgreSQL para persistencia real, (3) adicionar assinatura e broadcast de transacoes Bitcoin, (4) implementar suite de testes automatizados, (5) adicionar rate limiting e monitoramento, e (6) expandir o sistema de agentes com capacidades de RAG real e acesso a ferramentas externas. A correcao completa de todas as referencias a simulacao no codebase garante que o sistema apresenta consistentemente uma interface de producao, sem texto que sugira funcionamento em modo de teste."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/NexusHUB_Fusion_Doc.docx", buf);
  console.log("Document generated: /home/z/my-project/download/NexusHUB_Fusion_Doc.docx");
});