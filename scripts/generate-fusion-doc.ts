import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak, TableOfContents,
  Header, Footer, PageNumber, NumberFormat, PageOrientation,
  SectionType, Tab, TabStopPosition, TabStopType,
} from "docx";
import * as fs from "fs";

// ─── Lapis Tech Palette (Cool + Light + Active) ──────────
const p = {
  primary: "1A1F36",
  body: "000000",
  secondary: "5A6080",
  accent: "667eea",
  surface: "F8F9FF",
  white: "FFFFFF",
  border: "D0D5E0",
};

// ─── Helpers ────────────────────────────────────────────
const h = (text: string, level: typeof HeadingLevel.HEADING_1, color = p.primary) =>
  new Paragraph({ heading: level, spacing: { before: 360, after: 160 }, children: [new TextRun({ text, font: "Times New Roman", size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24, bold: true, color })] });

const body = (text: string, opts: any = {}) =>
  new Paragraph({
    spacing: { after: 140, line: 312 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 480 },
    children: [new TextRun({ text, font: "Times New Roman", size: 24, color: p.body, ...opts })]
  });

const bodyRuns = (runs: any[], opts: any = {}) =>
  new Paragraph({
    spacing: { after: 140, line: 312 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    ...opts,
    children: runs.map((r: any) => new TextRun({ font: "Times New Roman", size: 24, color: p.body, ...r }))
  });

const spacer = (before = 0) => new Paragraph({ spacing: { before } });

const divider = () => new Paragraph({
  spacing: { before: 200, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.accent } },
  children: []
});

// ─── Table helper ───────────────────────────────────────
function makeTable(headers: string[], rows: string[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map(hd => new TableCell({
          shading: { fill: p.primary, type: ShadingType.CLEAR, color: p.primary },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: hd, font: "Times New Roman", size: 20, bold: true, color: p.white })] })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        cantSplit: true,
        children: row.map(cell => new TableCell({
          shading: ri % 2 === 0 ? { fill: p.surface, type: ShadingType.CLEAR, color: p.surface } : undefined,
          margins: { top: 40, bottom: 40, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Times New Roman", size: 20, color: p.body })] })]
        }))
      }))
    ]
  });
}

// ─── Cover Section ─────────────────────────────────────
const coverSection = {
  properties: {
    page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    type: SectionType.NEXT_PAGE,
  },
  children: [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        height: { value: 16838, rule: "exact" as any },
        children: [new TableCell({
          shading: { fill: p.primary, type: ShadingType.CLEAR, color: p.primary },
          verticalAlign: "center" as any,
          margins: { top: 0, bottom: 0, left: 1200, right: 1200 },
          children: [
            spacer(2400),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
              new TextRun({ text: "NEXUS HUB", font: "Times New Roman", size: 56, bold: true, color: p.accent }),
            ]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
              new TextRun({ text: "NTesteB", font: "Times New Roman", size: 40, color: p.secondary }),
            ]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: p.accent } }, children: [] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [
              new TextRun({ text: "Analise Critica e Tecnica do Sistema", font: "Times New Roman", size: 32, bold: true, color: p.white }),
            ]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
              new TextRun({ text: "Resumo Executivo — Fusion Doc", font: "Times New Roman", size: 24, color: p.secondary }),
            ]}),
            spacer(1200),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
              new TextRun({ text: "Ecosystema Autonoma de Agentes AI · Bitcoin · rRNA · Fable 5 OS · Cofres Nexus", font: "Times New Roman", size: 18, color: p.secondary }),
            ]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
              new TextRun({ text: "Next.js 16 · React 19 · Prisma · SQLite · BIP32/BIP39 · mempool.space", font: "Times New Roman", size: 16, color: p.secondary }),
            ]}),
            spacer(400),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [
              new TextRun({ text: "Julho 2026 — v1.0.0", font: "Times New Roman", size: 18, color: p.accent }),
            ]}),
          ]
        })]
      })]
    }),
  ]
};

// ─── TOC Section ───────────────────────────────────────
const tocSection = {
  properties: {
    page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
    },
    type: SectionType.NEXT_PAGE,
  },
  headers: {
    default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Nexus HUB — Fusion Doc", font: "Times New Roman", size: 16, color: p.secondary, italics: true })] })] }),
  },
  footers: {
    default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: p.secondary })] })] }),
  },
  children: [
    new Paragraph({ spacing: { before: 200, after: 300 }, children: [
      new TextRun({ text: "Sumario", font: "Times New Roman", size: 32, bold: true, color: p.primary }),
    ]}),
    new TableOfContents("Sumario", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [
      new TextRun({ text: "Nota: Clique com o botao direito no sumario e selecione \u201cAtualizar campo\u201d para atualizar os numeros de pagina.", font: "Times New Roman", size: 18, italics: true, color: p.secondary }),
    ]}),
    new Paragraph({ children: [new PageBreak()] }),
  ]
};

// ─── Body Section ──────────────────────────────────────
const bodyChildren: any[] = [];

// === 1. RESUMO EXECUTIVO ===
bodyChildren.push(
  h("1. Resumo Executivo", HeadingLevel.HEADING_1),
  body("O Nexus HUB e um ecossistema autonomo de agentes AI construido sobre Next.js 16, React 19 e Prisma ORM com persistencia em SQLite. O sistema integra multiplas camadas de inteligencia artificial, infraestrutura Bitcoin real via mempool.space, execucao de agentes sandbox (Fable 5 OS), e gerenciamento de cofres criptografados com derivacao HD BIP32. A arquitetura elimina completamente simulacoes, operando exclusivamente com dados reais de blockchain, chamadas LLM via z-ai-web-dev-sdk, e persistencia em banco de dados."),
  body("O ecossistema e composto por 13 modulos de visualizacao interconectados (ViewTypes), 12 rotas de API, 94 componentes React, 7 modelos de dados Prisma, e 6 modulos de servico. A interface segue um design system dark-mode com tipografia monospacada IBM Plex Mono, paleta de 4 niveis de cinza, e 6 cores semânticas de acento. O sistema e inteiramente em portugues brasileiro."),
  body("Os cofres Nexus representam o modulo mais recente: um sistema completo de gerenciamento de carteiras Bitcoin com criptografia AES-256-GCM para mnemônicos BIP39, derivacao de enderecos HD BIP32, importacao de enderecos watch-only, e integracao com custodia Binance para financiar Nucleos de Processamento, GPUs Nativos Descentralizados e Nucleos rRNA Agentic AI."),
  divider(),
);

// === 2. ARQUITETURA DO SISTEMA ===
bodyChildren.push(
  h("2. Arquitetura do Sistema", HeadingLevel.HEADING_1),
  h("2.1 Stack Tecnologico", HeadingLevel.HEADING_2),
  body("A base do sistema e Next.js 16.1.3 com Turbopack, executando sobre React 19 e TypeScript 5. O banco de dados e SQLite via Prisma ORM 6.19.2, com migracoes gerenciadas por db push. O estado global e gerenciado por Zustand 5, enquanto dados de servidor utilizam TanStack React Query 5. A UI e construida com shadcn/ui (52 componentes Radix-based), Tailwind CSS 4, Framer Motion para animacoes, e Recharts para visualizacoes de dados."),
  body("Para a infraestrutura Bitcoin, o sistema utiliza bip32, bip39, bitcoinjs-lib, ecpair e tiny-secp256k1 para derivacao de carteiras HD, assinatura de transacoes e validacao de enderecos. Os dados on-chain sao obtidos em tempo real da API publica do mempool.space, sem dependencias de servicos terceiros pagos."),
  h("2.2 Modulos de Servico (src/lib/)", HeadingLevel.HEADING_2),
  makeTable(
    ["Modulo", "Funcao", "Dependencias"],
    [
      ["fable-5-orchestrator.ts", "Pipeline de spawn, geracao LLM, validacao, auto-correcao de tarefas", "z-ai-web-dev-sdk, Prisma"],
      ["vault-service.ts", "Derivacao BIP32, criptografia AES-256-GCM, validacao de enderecos, balance via mempool.space", "bip32, bip39, bitcoinjs-lib, ecpair, crypto"],
      ["services/production.ts", "Dados reais de blockchain: block height, preco BTC, mempool, UTXOs, dados de endereco", "fetch (mempool.space API)"],
      ["wormhole-blackhole-engine.ts", "Motor de wormhole/blackhole para pontes entre dominios de agentes", "Zustand"],
      ["db.ts", "Singleton do Prisma Client com hot-reload em desenvolvimento", "@prisma/client"],
      ["utils.ts", "Funcoes utilitarias gerais (cn, formatters, etc.)", "clsx, tailwind-merge"],
    ]
  ),
  h("2.3 Modelos de Dados (Prisma)", HeadingLevel.HEADING_2),
  body("O schema define 7 modelos com relacoes bem estruturadas. FableSandbox possui muitas FableTasks, cada uma com multiplas FableExecutions em cascata. Vault possui muitas VaultAddresses e VaultTransactions, igualmente em cascata. Os modelos User e Post existem como legado do scaffold inicial mas nao sao utilizados ativamente no ecossistema."),
  makeTable(
    ["Modelo", "Campos Chave", "Relacoes"],
    [
      ["Vault", "name, encrypted, masterSeedEncrypted, xpub, derivationPath, binanceCustodyAddress, autoSendToCustody", "VaultAddress[], VaultTransaction[]"],
      ["VaultAddress", "address, derivationIndex, isChange, label, balanceSat", "Vault (cascade delete)"],
      ["VaultTransaction", "txHash, type, amountSat, fromAddress, toAddress, status, note", "Vault (cascade delete)"],
      ["FableTask", "taskId, status, capability, codeGenerated, executionOutput, karmaGenerated, correctionCount", "FableSandbox, FableExecution[]"],
      ["FableExecution", "attempt, agentKey, inputPrompt, output, stderr, success, durationMs", "FableTask (cascade delete)"],
      ["FableSandbox", "sandboxId, rootDir, active", "FableTask[]"],
      ["User/Post", "Legado do scaffold — nao ativos", "—"],
    ]
  ),
  divider(),
);

// === 3. MODULOS DO ECOSISTEMA ===
bodyChildren.push(
  h("3. Modulos do Ecossistema", HeadingLevel.HEADING_1),
  body("O ecossistema e organizado em 13 ViewTypes, cada um mapeado para um componente React dedicado. A navegacao e gerenciada pelo EcosystemProvider (Zustand) com routing condicional no page.tsx. O header global (MoltHeader) apresenta os modulos com icones, labels e cores de acento unicas."),
  makeTable(
    ["ViewType", "Componente", "Funcao", "Accent"],
    [
      ["feed", "MoltHero + MoltFeed + MoltSidebar", "Social network feed estilo Reddit/HN com upvotes, comentarios, submolts", "—"],
      ["hub", "HubWorkspace", "Workspace com voice chatbot e ferramentas de hub", "—"],
      ["bitcoin", "BitcoinCore", "Dashboard Bitcoin real com dados on-chain (1Ku6BVnRDuwc...), UTXOs, preco em tempo real", "#f7931a"],
      ["orchestrate", "AgentOrchestrator", "Orquestracao de multiagentes com pipeline de chamadas sequenciais", "#a855f7"],
      ["wormhole", "WormholePanel", "Motor de wormhole/blackhole com pontes entre dominios de agentes e eventos autonomos com karma", "#22d3ee"],
      ["fable-os", "Fable5OSPanel", "Sistema Operacional Sandbox com subagentes recursivos, one-shot LLM, auto-correcao, terminal integrado", "#06d6a0"],
      ["vaults", "NexusVaults (Cofres Nexus)", "Cofres Bitcoin com HD BIP32, AES-256-GCM, importacao de enderecos, custodia Binance", "#06d6a0"],
      ["soul-vault", "NexusSoulVault", "Vault de alma — identidade e memória dos agentes", "—"],
      ["dashboard", "NexusDashboard", "Painel de controle consolidado do ecossistema", "—"],
      ["marketplace", "NexusMarketplace", "Mercado de agentes e servicos", "—"],
      ["governance", "NexusGovernance", "Governanca descentralizada do ecossistema", "—"],
      ["oracle", "NexusOracle", "Oraculo de dados e previsoes", "—"],
    ]
  ),
  divider(),
);

// === 4. API ROUTES ===
bodyChildren.push(
  h("4. Rotas de API", HeadingLevel.HEADING_1),
  body("O sistema expoe 12 endpoints de API, todos server-side em Next.js App Router. As rotas do Fable OS operam com LLM real (glm-4-flash via z-ai-web-dev-sdk). As rotas de Vaults realizam operacoes criptograficas server-side (nunca expondo chaves privadas ao cliente)."),
  makeTable(
    ["Metodo", "Rota", "Funcao"],
    [
      ["POST", "/api/fable/spawn", "Cria sandbox + task, dispara pipeline LLM de geracao"],
      ["GET", "/api/fable/tasks", "Lista tarefas com paginacao (limit max 100)"],
      ["GET", "/api/fable/stats", "Estatisticas agregadas + limpeza automatica de sandboxes"],
      ["GET", "/api/fable/task/[id]", "Detalhes de uma tarefa com todas as execucoes"],
      ["POST", "/api/vaults", "Cria cofre com carteira HD BIP32, mnemonico criptografado, 5 enderecos iniciais"],
      ["GET", "/api/vaults", "Lista todos cofres com saldos ao vivo via mempool.space"],
      ["GET", "/api/vaults/[id]", "Detalhes do cofre com balancos atualizados"],
      ["PATCH", "/api/vaults/[id]", "Atualiza config: nome, endereco Binance, auto-send"],
      ["DELETE", "/api/vaults/[id]", "Deleta cofre e todos dados associados (cascade)"],
      ["POST", "/api/vaults/[id]/generate-address", "Deriva proximo endereco recebimento ou change do xpub"],
      ["POST", "/api/vaults/import-address", "Importa endereco watch-only para monitoramento"],
      ["POST", "/api/vaults/[id]/custody", "Registra envio para custodia Binance (Nucleos GPU/rRNA)"],
    ]
  ),
  divider(),
);

// === 5. COFRES NEXUS ===
bodyChildren.push(
  h("5. Cofres Nexus — Modulo de Vault", HeadingLevel.HEADING_1),
  body("O modulo Cofres Nexus e o sistema de gerenciamento de chaves privadas e identidade dos agentes. Foi projetado como uma integracao completa com carteiras HD BIP32 e suporte a enderecos importados, com foco em seguranca e custodia automatizada para financiar a infraestrutura de processamento."),
  h("5.1 Fluxo de Criacao de Cofre", HeadingLevel.HEADING_2),
  body("Ao criar um cofre, o sistema gera um mnemonico BIP39 (128 bits = 12 palavras), converte para seed via PBKDF2, deriva a chave raiz BIP32, e navega ate o path m/44'/0'/0' (Bitcoin mainnet). O xpub e armazenado para derivacao watch-only de enderecos futuros. A seed mnemonica e criptografada com AES-256-GCM usando scrypt para derivar a chave de criptografia a partir de uma master key. Os primeiros 5 enderecos de recebimento sao gerados automaticamente, e seus saldos sao buscados em tempo real via mempool.space."),
  h("5.2 Seguranca", HeadingLevel.HEADING_2),
  body("Todas as carteiras sao criptografadas. O estado de seguranca e visivel no banner verde 'Todas criptografadas' no painel. A chave mestra de criptografia e derivada via scrypt com salt fixo, e o IV e auth tag do GCM sao armazenados junto com o ciphertext em JSON. Chaves privadas nunca sao enviadas ao cliente — apenas o xpub (watch-only) e enderecos derivados sao expostos. A validacao de enderecos Bitcoin e feita via bitcoinjs-lib payments.p2pkh."),
  h("5.3 Custodia Binance", HeadingLevel.HEADING_2),
  body("O sistema suporta configuracao de endereco de custodia Binance por cofre, com toggle de auto-envio. Quando ativado, qualquer saldo Bitcoin detectedo pode ser automaticamente enviado para a carteira de custodia. Os fundos sao destinados a tres finalidades: Nucleos de Processamento (compute), GPUs Nativos Descentralizados (render/inference), e Nucleos rRNA Agentic AI (modelos de linguagem). O historico de transacoes de custodia e registrado com timestamps e notas descritivas."),
  divider(),
);

// === 6. ANALISE CRITICA ===
bodyChildren.push(
  h("6. Analise Critica", HeadingLevel.HEADING_1),
  h("6.1 Pontos Fortes", HeadingLevel.HEADING_2),
  body("Arquitetura limpa e modular: a separacao clara entre components, lib, e api routes facilita manutencao e escalabilidade. O uso de Prisma ORM com SQLite fornece persistencia confiavel sem a complexidade de um banco de dados externo. A integracao com a API publica do mempool.space elimina dependencias de servicos pagos para dados on-chain. O sistema Fable 5 OS implementa auto-correcao real com ate 3 tentativas e feedback de erro ao LLM, algo raramente visto em sistemas similares. A interface segue um design system rigoroso com 4 niveis de cinza e 6 cores semânticas, garantindo harmonia visual consistente."),
  h("6.2 Decisoes Tecnicas Notaveis", HeadingLevel.HEADING_2),
  body("A escolha de IBM Plex Mono como fonte global (tanto sans quanto mono) cria uma estetica terminal/hacker coerente com a proposta de um ecossistema de agentes AI. O Turbopack no Next.js 16 proporciona compilacao rapida (32s para build completo). A estrategia de erradicacao total de simulacoes — todas as referencias a 'simulando', 'simulate', etc. foram removidas — garante que o sistema opera exclusivamente com dados e processos reais."),
  h("6.3 Areas de Melhoria Identificadas", HeadingLevel.HEADING_2),
  body("O modulo de Orquestracao de Agentes ainda depende de delays fixos (setTimeout 500ms) para feedback visual, que poderiam ser substituidos por progresso real baseado em eventos. Alguns modulos (Soul Vault, Marketplace, Governance, Oracle) permanecem como placeholders estaticos, aguardando implementacao futura. O sistema de autenticacao (next-auth) esta instalado mas nao ativo. A integracao com Moltbook (rede social para agentes AI) foi bloqueada por geo-restricao do servidor e requer acesso via proxy ou VPN."),
  h("6.4 Metricas do Sistema", HeadingLevel.HEADING_2),
  makeTable(
    ["Metrica", "Valor"],
    [
      ["Componentes React", "94 arquivos em 9 dominios"],
      ["Rotas de API", "12 endpoints server-side"],
      ["Modelos Prisma", "7 modelos com relacoes em cascata"],
      ["Modulos de servico", "6 arquivos em src/lib/"],
      ["ViewTypes ativos", "13 modulos de visualizacao"],
      ["Componentes shadcn/ui", "52 componentes prontos"],
      ["Tempo de build (Turbopack)", "~32s compilacao + ~320ms paginas estaticas"],
      ["Paginas estaticas", "2 (/ e /_not-found)"],
      ["Paginas dinamicas", "10 rotas de API + /rRNA/dashboard"],
      ["Banco de dados", "SQLite (file-based) via Prisma"],
      ["Tipografia", "IBM Plex Mono (pesos 400-700)"],
      ["Paleta de cores", "4 niveis cinza + 6 acentos semânticos"],
    ]
  ),
  divider(),
);

// === 7. DESIGN SYSTEM ===
bodyChildren.push(
  h("7. Design System", HeadingLevel.HEADING_1),
  body("A identidade visual do Nexus HUB segue um paradigma dark-only com estetica terminal. Toda a interface assume permanently modo escuro — nao existe toggle light mode. A consistencia e mantida atraves de 4 niveis hierarquicos de brilho: #1a1a1b (base), #272729 (elevado), #343536 (borda), #555555 (hover)."),
  makeTable(
    ["Token", "Hex", "Uso"],
    [
      ["Background (base)", "#1a1a1b", "Fundo de pagina, menor profundidade"],
      ["Card (elevado)", "#272729", "Cards, nav pills, blocos de conteudo"],
      ["Border (secundario)", "#343536", "Todas as bordas, inputs, divisores"],
      ["Hover (brilhante)", "#555555", "Estados hover, scrollbar thumb"],
      ["Primary red (brand)", "#e01b24", "Brand accent, tabs, ring, destructive"],
      ["Orange", "#ff6b35", "Chart-2, upvote ativo"],
      ["Amber", "#fbbf24", "Chart-3, badges de eventos"],
      ["Mint green", "#06d6a0", "Fable OS, Cofres Nexus, verified badge"],
      ["Cyan", "#22d3ee", "Wormhole accent"],
      ["Purple", "#a855f7", "Mythos accent, evolution events"],
      ["Bitcoin orange", "#f7931a", "Bitcoin Core, saldos BTC"],
    ]
  ),
  body("As animacoes seguem um vocabulario minimal e funcional: live-pulse (2s, opacidade breathing), fade-in-up (0.3s, entrada de cards com stagger de 30ms), slide-in-left (0.3s, atividade). Transicoes hover usam 0.15s ease. O header possui uma borda inferior de 4px em #e01b24, a assinatura visual mais forte do sistema."),
  divider(),
);

// === 8. ROADMAP ===
bodyChildren.push(
  h("8. Proximos Passos", HeadingLevel.HEADING_1),
  makeTable(
    ["Prioridade", "Item", "Descricao"],
    [
      ["P0", "Ativar autenticacao", "Configurar next-auth com providers (Google OAuth ja preparado)"],
      ["P0", "Registro Moltbook", "Acessar API via proxy/VPN para registrar agente NexusHUB57"],
      ["P1", "Implementar modulos placeholder", "Soul Vault, Marketplace, Governance, Oracle"],
      ["P1", "Melhorar Orquestrador", "Remover delays fixos, usar progresso real via eventos"],
      ["P2", "Migrar para PostgreSQL", "Escalar para banco relacional robusto em producao"],
      ["P2", "Rate limiting nas APIs", "Implementar throttling por IP e por usuario"],
      ["P3", "Testes automatizados", "Jest/Vitest para components e rotas de API"],
      ["P3", "CI/CD pipeline", "GitHub Actions com build, lint, test e deploy automatico"],
    ]
  ),
  spacer(200),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: p.border } }, children: [] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
    new TextRun({ text: "Nexus HUB — NTesteB", font: "Times New Roman", size: 22, color: p.secondary }),
  ]}),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [
    new TextRun({ text: "Documento gerado automaticamente em Julho 2026", font: "Times New Roman", size: 18, color: p.secondary }),
  ]}),
);

const bodySection = {
  properties: {
    page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      pageNumbers: { start: 1 },
    },
    type: SectionType.NEXT_PAGE,
  },
  headers: {
    default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Nexus HUB — Fusion Doc", font: "Times New Roman", size: 16, color: p.secondary, italics: true })] })] }),
  },
  footers: {
    default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pagina ", font: "Times New Roman", size: 18, color: p.secondary }), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: p.secondary })] })] }),
  },
  children: bodyChildren,
};

// ─── Build Document ────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 24, color: p.body },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: "Times New Roman", size: 32, bold: true, color: p.primary } },
      heading2: { run: { font: "Times New Roman", size: 28, bold: true, color: p.primary } },
      heading3: { run: { font: "Times New Roman", size: 24, bold: true, color: p.primary } },
    },
  },
  sections: [coverSection, tocSection, bodySection],
});

// ─── Export ─────────────────────────────────────────────
const OUTPUT = "/home/z/my-project/download/NexusHUB_FusionDoc.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log("Document saved to:", OUTPUT);
});