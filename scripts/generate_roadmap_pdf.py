#!/usr/bin/env python3
"""
CHIMERA Ecosystem — Deployment Roadmap End-to-End
Dark premium ReportLab PDF with TOC and cover
"""
import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══════════════════════════════════════════════════════════
# FONT REGISTRATION
# ═══════════════════════════════════════════════════════════
FONT_DIR = '/usr/share/fonts'

pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
# NotoSansSC is variable font - not compatible with ReportLab TTFont
# Use SarasaMonoSC as CJK sans fallback instead
pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold', italic='FreeSerif-Italic')

# Font fallback for mixed PT/EN text
def install_font_fallback():
    from reportlab.platypus import Paragraph
    _orig_init = Paragraph.__init__
    def _patched_init(self, text, *args, **kwargs):
        _orig_init(self, text, *args, **kwargs)
        style = kwargs.get('styleName') or (args[0] if args else None)
    Paragraph.__init__ = _patched_init
install_font_fallback()

# ═══════════════════════════════════════════════════════════
# CASCADE PALETTE — DARK MODE
# ═══════════════════════════════════════════════════════════
PAGE_BG       = colors.HexColor('#0b0c0c')
SECTION_BG    = colors.HexColor('#171a18')
CARD_BG       = colors.HexColor('#18201c')
TABLE_STRIPE  = colors.HexColor('#1b211e')
HEADER_FILL   = colors.HexColor('#375144')
COVER_BLOCK   = colors.HexColor('#36463e')
BORDER        = colors.HexColor('#365244')
ICON          = colors.HexColor('#80bd9e')
ACCENT        = colors.HexColor('#4ecf8f')
ACCENT_2      = colors.HexColor('#7dcd7d')
TEXT_PRIMARY   = colors.HexColor('#dfe2e1')
TEXT_MUTED     = colors.HexColor('#919a95')
SEM_SUCCESS   = colors.HexColor('#6fc08a')
SEM_WARNING   = colors.HexColor('#bea572')
SEM_ERROR     = colors.HexColor('#c67b74')
SEM_INFO      = colors.HexColor('#7192b3')

# ═══════════════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════════════
styles = getSampleStyleSheet()

s_h1 = ParagraphStyle(
    name='H1', fontName='FreeSerif-Bold', fontSize=20, leading=28,
    textColor=ACCENT, spaceBefore=18, spaceAfter=12, alignment=TA_LEFT
)
s_h2 = ParagraphStyle(
    name='H2', fontName='FreeSerif-Bold', fontSize=14, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8, alignment=TA_LEFT
)
s_h3 = ParagraphStyle(
    name='H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=16,
    textColor=ICON, spaceBefore=10, spaceAfter=6, alignment=TA_LEFT
)
s_body = ParagraphStyle(
    name='Body', fontName='FreeSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6, alignment=TA_JUSTIFY
)
s_body_pt = ParagraphStyle(
    name='BodyPT', fontName='NotoSansSC', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK'
)
s_bullet = ParagraphStyle(
    name='Bullet', fontName='FreeSerif', fontSize=10, leading=16,
    textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, spaceBefore=2, spaceAfter=2,
    alignment=TA_LEFT
)
s_callout = ParagraphStyle(
    name='Callout', fontName='FreeSerif-Italic', fontSize=10.5, leading=17,
    textColor=ACCENT, leftIndent=18, borderPadding=6, spaceBefore=8, spaceAfter=8,
    alignment=TA_LEFT
)
s_meta = ParagraphStyle(
    name='Meta', fontName='FreeSerif', fontSize=9, leading=13,
    textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=2, alignment=TA_LEFT
)
s_caption = ParagraphStyle(
    name='Caption', fontName='FreeSerif-Italic', fontSize=9, leading=13,
    textColor=TEXT_MUTED, spaceBefore=3, spaceAfter=6, alignment=TA_CENTER
)

# Table styles
s_th = ParagraphStyle(
    name='TH', fontName='FreeSerif-Bold', fontSize=9.5, leading=13,
    textColor=colors.white, alignment=TA_CENTER
)
s_td = ParagraphStyle(
    name='TD', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
s_td_c = ParagraphStyle(
    name='TDC', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER
)
s_td_err = ParagraphStyle(
    name='TDErr', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=SEM_ERROR, alignment=TA_LEFT
)
s_td_warn = ParagraphStyle(
    name='TDWarn', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=SEM_WARNING, alignment=TA_LEFT
)
s_td_ok = ParagraphStyle(
    name='TDOk', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=SEM_SUCCESS, alignment=TA_LEFT
)

# TOC styles
toc_h1 = ParagraphStyle(name='TOCH1', fontSize=12, leftIndent=20, fontName='FreeSerif', textColor=TEXT_PRIMARY, spaceBefore=4, spaceAfter=2)
toc_h2 = ParagraphStyle(name='TOCH2', fontSize=10.5, leftIndent=40, fontName='FreeSerif', textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=1)

# ═══════════════════════════════════════════════════════════
# DOCUMENT TEMPLATE WITH TOC
# ═══════════════════════════════════════════════════════════
class TocDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.page_count = 0

    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

    def afterPage(self):
        self.page_count += 1

def page_template(canvas, doc):
    canvas.saveState()
    # Footer
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(A4[0]/2, 25, f'CHIMERA Ecosystem — Deployment Roadmap  |  Page {doc.page}')
    # Top line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, A4[1] - doc.topMargin + 8, A4[0] - doc.rightMargin, A4[1] - doc.topMargin + 8)
    canvas.restoreState()

# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════
def heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceBefore=6, spaceAfter=6)

def make_table(headers, rows, col_widths=None):
    avail = A4[0] - 1.0*inch - 1.0*inch
    data = [[Paragraph(f'<b>{h}</b>', s_th) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), s_td) for c in row])
    if col_widths is None:
        n = len(headers)
        col_widths = [avail / n] * n
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ]
    for i in range(1, len(data)):
        bg = TABLE_STRIPE if i % 2 == 0 else CARD_BG
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def make_status_table(headers, rows, col_widths=None):
    """Table with color-coded status column (last column)."""
    avail = A4[0] - 1.0*inch - 1.0*inch
    data = [[Paragraph(f'<b>{h}</b>', s_th) for h in headers]]
    for row in rows:
        cells = [Paragraph(str(c), s_td) for c in row[:-1]]
        status_text = str(row[-1])
        if 'CRITICAL' in status_text.upper() or 'BLOQUEIO' in status_text.upper():
            cells.append(Paragraph(status_text, s_td_err))
        elif 'WARN' in status_text.upper() or 'MED' in status_text.upper() or 'ALTA' in status_text.upper():
            cells.append(Paragraph(status_text, s_td_warn))
        elif 'OK' in status_text.upper() or 'LOW' in status_text.upper() or 'BAIXA' in status_text.upper() or 'INFO' in status_text.upper():
            cells.append(Paragraph(status_text, s_td_ok))
        else:
            cells.append(Paragraph(status_text, s_td))
        data.append(cells)
    if col_widths is None:
        n = len(headers)
        col_widths = [avail / n] * n
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ]
    for i in range(1, len(data)):
        bg = TABLE_STRIPE if i % 2 == 0 else CARD_BG
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ═══════════════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════════════
OUTPUT = '/home/z/my-project/download/CHIMERA_Roadmap_Deploy.pdf'

doc = TocDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=1.0*inch, rightMargin=1.0*inch,
    topMargin=1.0*inch, bottomMargin=0.8*inch,
    title='CHIMERA Ecosystem — Deployment Roadmap',
    author='Nexus-HUB57',
    creator='Z.ai'
)

story = []

# ── TOC ──
toc = TableOfContents()
toc.levelStyles = [toc_h1, toc_h2]
story.append(Paragraph('<b>Sumario</b>', ParagraphStyle(
    name='TOCTitle', fontName='FreeSerif-Bold', fontSize=22, leading=30,
    textColor=ACCENT, spaceBefore=0, spaceAfter=18, alignment=TA_LEFT
)))
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# CHAPTER 1 — EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════
story.append(heading('<b>1. Resumo Executivo</b>', s_h1, 0))

story.append(Paragraph(
    'O ecossistema CHIMERA e uma plataforma de fusao multi-agente que integra 5 agentes de IA, '
    'um motor de inferencia LLM em C puro (Colibri GLM-5.2 744B MoE), 34 rotas de API, '
    'pipeline RAG rRNA, auto-cura reativa de 6 fases, e operacoes Bitcoin BIP32/PSBT v2. '
    'O projeto raiz e uma aplicacao Next.js 16 com React 19, tRPC v11, Prisma 6 e SQLite, '
    'projetada como plano de controle unificado para todos os subsistemas. '
    'Alem do projeto raiz, o ecossistema contem 4 subprojetos agentes independentes (Zettascale, '
    'GenesisFlow, S-bio Heroi, Nexus Sidian) e o motor Colibri com frontend web/desktop.',
    s_body))

story.append(Paragraph(
    'Esta varredura completa identificou 67 componentes de UI, 34 endpoints de API, 8 modelos Prisma, '
    '19 modulos de biblioteca, 4 routers tRPC, 5 subprojetos deployaveis e 22 scripts de automacao. '
    'A build de producao compila com sucesso (36 rotas em 37s via Turbopack), porem foram encontrados '
    '7 bloqueios criticos, 8 alertas de severidade media e 4 observacoes informativas que precisam '
    'ser enderecados antes de um deploy produtivo seguro. Este documento apresenta o roadmap completo '
    'de deploy end-to-end, desde a correcao de bloqueios ate a orchestracao de producao.',
    s_body))

story.append(Spacer(1, 12))

# Metrics table
avail = A4[0] - 2*inch
metrics = [
    ['Componentes de UI', '67 arquivos (~1 MB)'],
    ['Rotas de API', '34 endpoints (tRPC + REST)'],
    ['Modelos Prisma', '8 modelos + 3 faltantes (Fable)'],
    ['Modulos de Biblioteca', '19 arquivos (~223 KB)'],
    ['Routers tRPC', '4 routers (dashboard, agents, colibri, orchestration)'],
    ['Subprojetos Agentes', '5 (Zettascale, GenesisFlow, S-bio, Nexus Sidian, Antrophexus)'],
    ['Motor Colibri', 'C puro, 5.194 linhas, CUDA/Metal, OpenAI-compatible'],
    ['Scripts de Automacao', '22 (seed, validation, smoke test, PDF gen)'],
    ['Tempo de Build', '37.0s (Turbopack), 36 rotas estaticas'],
    ['Tamanho do Banco', '200 KB SQLite (custom.db)'],
]
story.append(make_table(['Metrica', 'Valor'], metrics, [avail*0.45, avail*0.55]))
story.append(Paragraph('Tabela 1: Panorama geral do ecossistema CHIMERA', s_caption))

# ═══════════════════════════════════════════════════════════
# CHAPTER 2 — AUDIT FINDINGS
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>2. Resultados da Auditoria</b>', s_h1, 0))

# 2.1 Critical
story.append(heading('<b>2.1 Bloqueios Criticos (Corrigir Obrigatoriamente)</b>', s_h2, 1))

story.append(Paragraph(
    'Os itens a seguir representam falhas que causam crash de runtime, '
    'vulnerabilidades de seguranca, ou bloqueiam completamente o processo de deploy. '
    'Cada um foi verificado contra o codigo-fonte atual e classificado com base no impacto '
    'potencial em producao. A prioridade de correcao e absoluta antes de qualquer deploy.',
    s_body))

story.append(Spacer(1, 12))
story.append(make_status_table(
    ['#', 'Bloqueio', 'Arquivo', 'Impacto', 'Status'],
    [
        ['1', 'Modelos Prisma Fable faltantes', 'fable-5-orchestrator.ts', 'CRITICAL — Crash em runtime ao usar Fable', 'Corrigir: adicionar 3 modelos'],
        ['2', 'Chave de criptografia hardcoded', 'vault-service.ts:17', 'CRITICAL — Seguranca: chave padrao exposta', 'Corrigir: exigir VAULT_ENCRYPTION_KEY'],
        ['3', 'Binance API sem guard', 'binance/route.ts:9-10', 'CRITICAL — Crash sem env vars', 'CORRIGIDO nesta sessao'],
        ['4', 'Sem autenticacao em nenhuma rota', 'todos os routers tRPC', 'CRITICAL — Zero auth em producao', 'Corrigir: implementar middleware'],
        ['5', 'Sem Dockerfile para deploy', 'raiz do projeto', 'ALTA — Impede deploy containerizado', 'Corrigir: criar Dockerfile'],
        ['6', 'TS errors suprimidos no build', 'next.config.ts', 'MEDIA — Erros ocultos passam', 'Corrigir: remover ignoreBuildErrors'],
        ['7', 'tsconfig varre agents/ e upload/', 'tsconfig.json', 'MEDIA — 289 erros falsos de tipo', 'CORRIGIDO nesta sessao'],
    ],
    [avail*0.05, avail*0.22, avail*0.22, avail*0.30, avail*0.21]
))
story.append(Paragraph('Tabela 2: Bloqueios criticos e alertas identificados na auditoria', s_caption))

# 2.2 Environment
story.append(Spacer(1, 12))
story.append(heading('<b>2.2 Variaveis de Ambiente Nao Documentadas</b>', s_h2, 1))

story.append(Paragraph(
    'O arquivo .env contem apenas uma variavel (DATABASE_URL). Porem, o codigo referencia '
    '8 variaveis adicionais que nao estao documentadas em nenhum .env.example. Sem essa documentacao, '
    'qualquer operador de deploy ficara sem conhecimento das configuracoes necessarias, '
    'o que leva a falhas silenciosas ou crashes em producao. A tabela abaixo detalha cada variavel, '
    'seu proposito, e o comportamento atual quando ausente.',
    s_body))

story.append(Spacer(1, 12))
story.append(make_status_table(
    ['Variavel', 'Uso', 'Fallback Atual', 'Risco'],
    [
        ['COLIBRI_URL', 'Conexao ao motor LLM', 'http://127.0.0.1:8000', 'BAIXA — tem default funcional'],
        ['ZAI_API_BASE_URL', 'Endpoint LLM (chat/analyze)', 'Nenhum (desabilitado)', 'BAIXA — graceful disable'],
        ['ZAI_API_KEY', 'Autenticacao LLM', 'Nenhum (desabilitado)', 'BAIXA — graceful disable'],
        ['BINANCE_API_KEY', 'Assinatura HMAC Binance', 'Non-null assertion (!)', 'ALTA — crash sem variavel'],
        ['BINANCE_API_SECRET', 'Assinatura HMAC Binance', 'Non-null assertion (!)', 'ALTA — crash sem variavel'],
        ['VAULT_ENCRYPTION_KEY', 'Criptografia AES-256-GCM', 'Chave hardcoded insegura', 'CRITICO — seguranca'],
        ['WEBHOOK_SECRET', 'Validacao de webhook', 'String vazia (desabilitado)', 'MEDIA — sem validacao'],
        ['GITHUB_TOKEN', 'Sync de repositorios', 'String vazia (falha silenciosa)', 'MEDIA — sync quebra'],
    ],
    [avail*0.20, avail*0.22, avail*0.30, avail*0.28]
))
story.append(Paragraph('Tabela 3: Variaveis de ambiente referenciadas no codigo mas nao documentadas', s_caption))

# ═══════════════════════════════════════════════════════════
# CHAPTER 3 — ARCHITECTURE MAP
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>3. Mapa de Arquitetura do Ecossistema</b>', s_h1, 0))

story.append(heading('<b>3.1 Projeto Raiz — CHIMERA Dashboard</b>', s_h2, 1))

story.append(Paragraph(
    'O projeto raiz e a aplicacao Next.js 16 primaria que serve como plano de controle unificado. '
    'E uma SPA (Single Page Application) com 10 tabs client-side: Dashboard, Agent Hub, Chat GLM-5.2, '
    'Invocacao, Orquestracao, Metaverso, Recuperacao, rRNA Systems, Moltbook e Governanca. '
    'Todos os tabs sao renderizados via useState sem roteamento Next.js entre eles, o que significa '
    'que a aplicacao carrega como um unico bundle e alterna visualmente entre secoes. '
    'O layout usa background #080b0d (dark premium), fonte IBM Plex Mono, e badges para '
    'GLM-5.2 744B, tRPC v11, Auto-Cura e 19k Experts no header.',
    s_body))

story.append(Paragraph(
    'A stack tecnica inclui: Next.js 16.1.1 com output standalone, React 19, TypeScript 5, '
    'Tailwind CSS 4 via @tailwindcss/postcss, shadcn/ui (new-york style, 37 componentes), '
    'tRPC v11 com superjson, Prisma 6.11 (SQLite), TanStack Query 5, Recharts 2, '
    'Framer Motion para animacoes, Zustand 5 para estado, e bitcoinjs-lib 7 para operacoes Bitcoin. '
    'O proxy reverso Caddy escuta na porta 81 e redireciona para localhost:3000.',
    s_body))

story.append(Spacer(1, 12))
story.append(heading('<b>3.2 Subprojetos Agentes</b>', s_h2, 1))

story.append(Spacer(1, 12))
story.append(make_status_table(
    ['Subprojeto', 'Stack', 'Estado', 'Deployavel?', 'Integracao CHIMERA'],
    [
        ['Zettascale', 'Next.js 15 + Genkit + Firebase + MySQL', 'Completo (100+ modulos, 37 AI flows)', 'Parcial — precisa Firebase/MySQL', 'Seed no DB, nao importado'],
        ['GenesisFlow', 'Next.js 15 + Genkit + Firebase', 'Completo (35 flows, 30 cards)', 'Sim — Firebase App Hosting', 'Seed no DB, nao importado'],
        ['S-bio Heroi', 'pnpm monorepo + Hono + Drizzle + PG', 'Completo (5 pacotes, 70+ arquivos)', 'Parcial — precisa PostgreSQL', 'Seed no DB, nao importado'],
        ['Antrophexus AI', 'Next.js + Firebase + AI flows', 'Completo (25+ paginas, 30 flows)', 'Sim — Firebase', 'Seed no DB, nao importado'],
        ['Nexus Sidian', 'Electron binary (pre-built)', 'Congelado — sem codigo-fonte', 'Nao — binario Windows', 'Seed no DB, sem link'],
    ],
    [avail*0.13, avail*0.22, avail*0.20, avail*0.22, avail*0.23]
))
story.append(Paragraph('Tabela 4: Subprojetos agentes — estado e viabilidade de deploy', s_caption))

story.append(Spacer(1, 12))
story.append(heading('<b>3.3 Motor Colibri</b>', s_h2, 1))

story.append(Paragraph(
    'O Colibri e o nucleo de inferencia LLM do ecossistema, implementado inteiramente em C puro '
    '(glm.c, 5.194 linhas). Suporta o modelo GLM-5.2 744B com arquitetura Mixture-of-Experts '
    '(19.456 experts), com cache de 3 niveis (VRAM/RAM/Disco), roteamento tiered de experts, '
    'e backends GPU opcionais (CUDA e Metal). O motor pode ser compilado com zero dependencias '
    '(build CPU portatil) ou com aceleracao GPU. Inclui um servidor OpenAI-compatible em Python '
    '(openai_server.py) e um frontend web React/Vite para visualizacao do cortex de experts. '
    'O binario compilado ainda nao existe no workspace — precisa ser gerado via "make glm".',
    s_body))

# ═══════════════════════════════════════════════════════════
# CHAPTER 4 — DEPLOYMENT ROADMAP
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>4. Roadmap de Deploy End-to-End</b>', s_h1, 0))

story.append(Paragraph(
    'O roadmap esta organizado em 5 fases sequenciais, cada uma com entradas claras, '
    'acoes especificas, e criterios de saida verificaveis. As fases devem ser executadas '
    'em ordem, pois cada uma depende dos artefatos da anterior. O tempo estimado total '
    'e de 5 a 8 dias para um desenvolvedor familiarizado com o ecossistema.',
    s_body))

# Phase 1
story.append(Spacer(1, 12))
story.append(heading('<b>4.1 Fase 1 — Estabilizacao do Core (Dias 1-2)</b>', s_h2, 1))

story.append(Paragraph(
    'Esta fase foca em eliminar todos os bloqueios criticos que impedem o funcionamento basico '
    'do sistema em producao. Sem estas correcoes, o deploy resultara em crashes de runtime, '
    'vulnerabilidades de seguranca expostas, ou falhas silenciosas de funcionalidades criticas. '
    'Cada item deve ser verificado individualmente antes de prosseguir para a Fase 2.',
    s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Acao 1.1: Adicionar modelos Prisma Fable faltantes</b>', s_h3))
story.append(Paragraph(
    'O fable-5-orchestrator.ts referencia db.fableTask, db.fableExecution e db.fableSandbox, '
    'mas estes modelos nao existem no schema.prisma. A correcao envolve adicionar tres modelos '
    'ao schema (FableTask, FableExecution, FableSandbox) com campos minimos: id, taskId, '
    'description, status, capability, subAgentId, sandboxId, codeGenerated, executionOutput, '
    'executionStderr, executionMs, karmaGenerated, correctionCount, maxCorrections, '
    'createdAt e updatedAt. Apos adicionar, executar "npx prisma db push" para sincronizar '
    'o banco de dados sem perder dados existentes.',
    s_body))

story.append(Paragraph('<b>Acao 1.2: Criar .env.example com todas as variaveis</b>', s_h3))
story.append(Paragraph(
    'Criar arquivo .env.example na raiz do projeto documentando todas as 9 variaveis de ambiente '
    'necessarias, com descricao, obrigatoriedade e valores de exemplo. Incluir DATABASE_URL, '
    'COLIBRI_URL, ZAI_API_BASE_URL, ZAI_API_KEY, BINANCE_API_KEY, BINANCE_API_SECRET, '
    'VAULT_ENCRYPTION_KEY (com aviso de seguranca), WEBHOOK_SECRET e GITHUB_TOKEN. '
    'Este arquivo deve ser commitado ao repositorio para guiar futuros operadores de deploy.',
    s_body))

story.append(Paragraph('<b>Acao 1.3: Corrigir chave de criptografia hardcoded</b>', s_h3))
story.append(Paragraph(
    'O vault-service.ts linha 17 usa uma chave de criptografia hardcoded como fallback: '
    '"nexus-hub-cofres-default-key-change-in-prod!!". Em producao, se VAULT_ENCRYPTION_KEY nao '
    'estiver configurada, todos os cofres usam essa chave insegura. A correcao e remover o '
    'fallback e lancar um erro explicito se a variavel nao estiver definida em NODE_ENV=production, '
    'obrigando o operador a configurar uma chave segura de 32+ caracteres.',
    s_body))

story.append(Paragraph('<b>Acao 1.4: Implementar middleware de autenticacao basico</b>', s_h3))
story.append(Paragraph(
    'Atualmente, TODOS os procedures tRPC e TODOS os endpoints REST sao publicos (sem autenticacao). '
    'Para um deploy seguro, implementar no minimo: (a) um middleware tRPC que valide um Bearer token '
    'via ZAI_API_KEY para rotas de administracao, (b) rate limiting basico nas rotas publicas, '
    'e (c) protecao CSRF nas rotas de escrita (POST/PUT/DELETE). Isso nao precisa ser um sistema '
    'de auth completo — apenas uma camada de seguranca minima para producao.',
    s_body))

# Phase 2
story.append(Spacer(1, 12))
story.append(heading('<b>4.2 Fase 2 — Infraestrutura de Deploy (Dias 2-3)</b>', s_h2, 1))

story.append(Paragraph(
    'Com o core estabilizado, esta fase cria os artefatos de infraestrutura necessarios para '
    'deploy reproduzivel e automatizado. O objetivo e que qualquer pessoa com acesso ao '
    'repositorio possa fazer o deploy com um unico comando.',
    s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Acao 2.1: Criar Dockerfile multi-stage</b>', s_h3))
story.append(Paragraph(
    'Criar um Dockerfile na raiz do projeto com build multi-stage: Stage 1 (deps) instala '
    'dependencias com bun, Stage 2 (build) executa "next build" e copia static/public para '
    'standalone, Stage 3 (production) usa a imagem node:20-alpine com apenas os artefatos '
    'necessarios. Incluir COPY prisma/schema.prisma e RUN npx prisma generate. '
    'O Dockerfile deve expor a porta 3000 e usar CMD ["node", ".next/standalone/server.js"]. '
    'Tamanho alvo da imagem final: menor que 500 MB.',
    s_body))

story.append(Paragraph('<b>Acao 2.2: Criar docker-compose.yml de desenvolvimento</b>', s_h3))
story.append(Paragraph(
    'Criar docker-compose.yml com tres servicos: chimera-app (build do Dockerfile, porta 3000), '
    'colibri-engine (build do colibri/c, porta 8000), e caddy (reverse proxy, porta 80/443). '
    'Incluir volumes para o banco SQLite e configuracao de rede interna. '
    'Isso permite um "docker compose up" para ter o ecossistema completo rodando localmente.',
    s_body))

story.append(Paragraph('<b>Acao 2.3: Criar script de deploy automatizado</b>', s_h3))
story.append(Paragraph(
    'Criar scripts/deploy.sh que executa: (1) verificacao de prerequisitos (node, bun, prisma), '
    '(2) install de dependencias, (3) prisma generate + db push, (4) next build, '
    '(5) copia de static/public para standalone, (6) reinicio do processo com pm2 ou systemd. '
    'Incluir rollback automatico se o build falhar e health check pos-deploy '
    '(curl localhost:3000/api/colibri/health com timeout de 30s).',
    s_body))

# Phase 3
story.append(Spacer(1, 12))
story.append(heading('<b>4.3 Fase 3 — Banco de Dados e Seeds (Dia 3)</b>', s_h2, 1))

story.append(Paragraph(
    'Esta fase garante que o banco de dados de producao esteja populado com os dados minimos '
    'necessarios para o funcionamento do dashboard e de todas as features visiveis ao usuario.',
    s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Acao 3.1: Executar seeds de producao</b>', s_h3))
story.append(Paragraph(
    'Executar os tres scripts de seed em sequencia: (1) seed-agents.ts para popular os 5 agentes '
    '(Nexus Prime, Sabio Heroi, Zettascale, GenesisFlow, Moltbook) com suas skills, '
    '(2) seed-projects.ts para os 2.402+ projetos de desenvolvedores independentes, '
    'e (3) seed-knowledge-rag.ts para popular a base de conhecimento RAG com conteudo '
    'extraido dos READMEs dos agentes. Validar a contagem de registros apos cada seed.',
    s_body))

story.append(Paragraph('<b>Acao 3.2: Migrar de db push para migracoes formais</b>', s_h3))
story.append(Paragraph(
    'O projeto atualmente usa "prisma db push" que nao gera historico de migracoes. '
    'Para producao, executar "prisma migrate dev --name init" para criar a migracao inicial, '
    'e usar "prisma migrate deploy" em vez de "db push" no pipeline de deploy. '
    'Isso garante rastreabilidade e rollback seguro de mudancas de schema.',
    s_body))

# Phase 4
story.append(Spacer(1, 12))
story.append(heading('<b>4.4 Fase 4 — Colibri e Integracao LLM (Dias 4-5)</b>', s_h2, 1))

story.append(Paragraph(
    'Esta fase prepara o motor de inferencia Colibri e garante a integracao funcionando '
    'entre o dashboard CHIMERA e o motor LLM. O Colibri e o coracao do sistema — sem ele, '
    'as funcionalidades de chat, RAG e orquestracao ficam sem processamento LLM local.',
    s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Acao 4.1: Compilar o motor Colibri</b>', s_h3))
story.append(Paragraph(
    'Navegar ate colibri/c/ e executar "make glm" para compilar o binario de inferencia. '
    'Em ambientes sem GPU, o build CPU padrao e suficiente e nao requer dependencias extras. '
    'Para producao com GPU, instalar CUDA toolkit e usar "make glm CUDA=1". '
    'Validar a compilacao executando "./glm --help" e verificando a saida. '
    'O binario final deve ser copiado para um local acessivel pelo servico de producao.',
    s_body))

story.append(Paragraph('<b>Acao 4.2: Configurar servidor OpenAI-compatible</b>', s_h3))
story.append(Paragraph(
    'O Colibri inclui openai_server.py que expoe o motor como API REST compativel com OpenAI. '
    'Configurar este servidor para rodar na porta 8000 (ou a porta definida em COLIBRI_URL). '
    'O dashboard CHIMERA conecta-se automaticamente via /api/colibri/* que faz proxy '
    'para este servidor. Validar com: curl localhost:8000/v1/models (deve retornar lista de modelos) '
    'e curl localhost:8000/v1/chat/completions (deve retornar resposta do modelo).',
    s_body))

story.append(Paragraph('<b>Acao 4.3: Testar pipeline RAG end-to-end</b>', s_h3))
story.append(Paragraph(
    'Executar um teste completo do pipeline RAG: (1) verificar que a base de conhecimento '
    'foi populada via seed, (2) enviar uma query via /api/rag/query, (3) validar que o pipeline '
    'RecursiveChunk / TF-IDF / BM25 / Cross-Encoder Rerank / LLM executa sem erros, '
    'e (4) verificar que as fontes (sources) sao retornadas na resposta. '
    'Se ZAI_API_KEY nao estiver configurado, o fallback de resposta por palavras-chave deve funcionar.',
    s_body))

# Phase 5
story.append(Spacer(1, 12))
story.append(heading('<b>4.5 Fase 5 — Producao e Monitoramento (Dias 5-8)</b>', s_h2, 1))

story.append(Paragraph(
    'A fase final configura o sistema para operacao continua em producao, incluindo '
    'monitoramento, backup, restart automatico, e otimizacao de performance. '
    'Apos esta fase, o sistema estara pronto para uso operacional.',
    s_body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Acao 5.1: Configurar PM2 para gerenciamento de processo</b>', s_h3))
story.append(Paragraph(
    'Instalar pm2 globalmente e criar ecosys.config.js com: (1) processo chimera-app na porta 3000 '
    'com restart automatico, max_memory_restart de 1GB, e log rotation, (2) processo colibri-engine '
    'na porta 8000 com restart automatico. Executar "pm2 start ecosys.config.js" e habilitar '
    'startup script com "pm2 startup" para reinicio automatico apos reboot do servidor.',
    s_body))

story.append(Paragraph('<b>Acao 5.2: Configurar Caddy com SSL automatico</b>', s_h3))
story.append(Paragraph(
    'Atualizar o Caddyfile para producao com: (1) dominio real em vez de localhost, '
    '(2) auto-SSL via Letus Encrypt (Caddy faz isso automaticamente), '
    '(3) headers de seguranca (HSTS, X-Frame-Options, X-Content-Type-Options), '
    '(4) rate limiting basico, e (5) gzip compression. '
    'O Caddy deve escutar nas portas 80 (HTTP redirect) e 443 (HTTPS) e proxy para 3000.',
    s_body))

story.append(Paragraph('<b>Acao 5.3: Implementar health checks e backup</b>', s_h3))
story.append(Paragraph(
    'Configurar: (1) cron job a cada 5 minutos que verifica /api/colibri/health e reinicia '
    'o servico se necessario, (2) backup diario do SQLite (sqlite3 .backup) para /backups/ '
    'com retention de 7 dias, (3) log rotation via pm2-logrotate, e (4) alerta via webhook '
    'se o servico ficar down por mais de 2 minutos consecutivos.',
    s_body))

# ═══════════════════════════════════════════════════════════
# CHAPTER 5 — TIMELINE
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>5. Cronograma e Dependencias</b>', s_h1, 0))

story.append(Paragraph(
    'O cronograma abaixo resume as 5 fases com suas dependencias, tempo estimado e criterios de saida. '
    'As fases devem ser executadas sequencialmente. Dentro de cada fase, as acoes podem ser '
    'paralelizadas quando nao houver dependencia entre elas. O tempo total estimado e de 5 a 8 '
    'dias uteis para um desenvolvedor solo, ou 3 a 5 dias com uma equipe de 2 pessoas.',
    s_body))

story.append(Spacer(1, 12))
story.append(make_table(
    ['Fase', 'Dias', 'Depende de', 'Criterio de Saida'],
    [
        ['1. Estabilizacao do Core', '1-2', 'Nenhuma', 'Build passa, 0 crashes de runtime'],
        ['2. Infraestrutura de Deploy', '1', 'Fase 1', 'Docker build OK, deploy.sh funcional'],
        ['3. Banco de Dados e Seeds', '1', 'Fase 1', 'Todos os seeds executados, dados validados'],
        ['4. Colibri e LLM', '1-2', 'Fase 1, 2', 'Colibri responde, RAG funciona end-to-end'],
        ['5. Producao e Monitoramento', '2-3', 'Fase 2, 3, 4', 'PM2 estavel, SSL ativo, health check OK'],
    ],
    [avail*0.22, avail*0.08, avail*0.18, avail*0.52]
))
story.append(Paragraph('Tabela 5: Cronograma de deploy com dependencias e criterios de saida', s_caption))

# ═══════════════════════════════════════════════════════════
# CHAPTER 6 — SECURITY RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>6. Recomendacoes de Seguranca</b>', s_h1, 0))

story.append(Paragraph(
    'Alem dos bloqueios criticos ja identificados, esta secao apresenta recomendacoes adicionais '
    'de seguranca que devem ser implementadas progressivamente apos o deploy inicial. '
    'Estas nao sao bloqueadoras para o primeiro deploy, mas sao essenciais para a seguranca '
    'a longo prazo do ecossistema, especialmente considerando a natureza sensivel das operacoes '
    'Bitcoin e de carteiras digitais envolvidas.',
    s_body))

story.append(Spacer(1, 8))
story.append(make_status_table(
    ['#', 'Recomendacao', 'Prioridade', 'Impacto'],
    [
        ['1', 'Remover upload/ do .gitignore — contem chaves privadas Bitcoin', 'CRITICA', 'Chaves expostas no historico git'],
        ['2', 'Implementar auth tRPC com NextAuth v4 (ja instalado)', 'ALTA', 'Zero auth em producao hoje'],
        ['3', 'Adicionar rate limiting nas rotas publicas', 'ALTA', 'Protecao contra abuso e DDoS'],
        ['4', 'Migrar vault-service para usar KMS ou HSM', 'MEDIA', 'Chaves AES em env var sao fracas'],
        ['5', 'Auditar logs de acesso as APIs Bitcoin', 'MEDIA', 'Rastreabilidade de transacoes'],
        ['6', 'Implementar CSRF tokens em rotas de escrita', 'MEDIA', 'Protecao contra ataques CSRF'],
        ['7', 'Configurar Content-Security-Policy headers', 'BAIXA', 'Reducao de superficie de ataque XSS'],
    ],
    [avail*0.05, avail*0.48, avail*0.15, avail*0.32]
))
story.append(Paragraph('Tabela 6: Recomendacoes de seguranca pos-deploy', s_caption))

# ═══════════════════════════════════════════════════════════
# CHAPTER 7 — CORRECTIONS APPLIED
# ═══════════════════════════════════════════════════════════
story.append(Spacer(1, 18))
story.append(heading('<b>7. Correcoes Aplicadas Nesta Sessao</b>', s_h1, 0))

story.append(Paragraph(
    'Durante a varredura do ecossistema, tres correcoes foram aplicadas imediatamente ao codigo-fonte '
    'para eliminar riscos criticos. Estas correcoes ja estao commitadas no repositorio e serao '
    'incluidas no proximo deploy sem acao adicional do operador.',
    s_body))

story.append(Spacer(1, 12))
story.append(make_table(
    ['Correcao', 'Arquivo', 'Antes', 'Depois'],
    [
        ['Binance crash sem env vars', 'src/app/api/binance/route.ts',
         'process.env.BINANCE_API_KEY! (crash)',
         '?? "" + guard 503 (graceful)'],
        ['289 erros de tipo falsos', 'tsconfig.json',
         'include varre agents/ e upload/',
         'exclude: agents, upload, colibri'],
        ['Fallback DB path inconsistente', 'src/lib/db.ts (sessao anterior)',
         'file:./chimera.db (stale)',
         'file:./chimera.db com fallback'],
    ],
    [avail*0.20, avail*0.25, avail*0.25, avail*0.30]
))
story.append(Paragraph('Tabela 7: Correcoes de codigo aplicadas durante esta sessao de auditoria', s_caption))

# ═══════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════
print("Building PDF body...")
doc.multiBuild(story, onLaterPages=page_template, onFirstPage=page_template)
print(f"Body PDF generated: {OUTPUT}")
print(f"Pages: {doc.page_count}")