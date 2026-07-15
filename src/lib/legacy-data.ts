// ============================================================
// LEGADO DATA — "Laco Quantico" Financial Legacy System
// Structured data from the 10-year legacy plan (R$850M)
// Wormhole = Source (capital injection), Blackhole = Sink (trust/holding)
// ============================================================

export interface LegacyYear {
  year: number;
  label: string;
  totalAssets: number;
  revenue: number;
  expenses: number;
  netResult: number;
  investmentReturn: number;
  socialImpact: number;
  trustCompliance: number;
  phase: string;
  highlights: string[];
}

export interface InvestmentLayer {
  name: string;
  percentage: number;
  value: number;
  annualReturn: number;
  purpose: string;
  color: string;
}

export interface TrustStructure {
  type: string;
  jurisdiction: string;
  setupCost: number;
  annualCost: number;
  purpose: string;
  status: 'planned' | 'active' | 'compliant';
}

export interface QuantumMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  description: string;
}

// ─── 10-Year Projection ───

export const LEGACY_YEARS: LegacyYear[] = [
  {
    year: 0, label: 'Genesis', totalAssets: 850_000_000, revenue: 49_992_253,
    expenses: 213_000, netResult: 49_779_253, investmentReturn: 5.88,
    socialImpact: 0, trustCompliance: 92, phase: 'Estruturacao',
    highlights: ['Constituicao da Holding', 'Trust Deed assinado', 'Primeiros alocacao em Tesouro Selic'],
  },
  {
    year: 1, label: 'Fundacao', totalAssets: 897_000_000, revenue: 52_800_000,
    expenses: 1_500_000, netResult: 51_300_000, investmentReturn: 6.22,
    socialImpact: 12, trustCompliance: 94, phase: 'Consolidacao',
    highlights: ['Portfolio diversificado', 'Primeiro relatorio CBE', '150 imoveis adquiridos'],
  },
  {
    year: 2, label: 'Expansao', totalAssets: 948_000_000, revenue: 55_600_000,
    expenses: 2_800_000, netResult: 52_800_000, investmentReturn: 6.20,
    socialImpact: 28, trustCompliance: 95, phase: 'Crescimento',
    highlights: ['Fundo de imoveis ativo', 'CRI/CRA allocation', 'Offshore operacional'],
  },
  {
    year: 3, label: 'Aceleracao', totalAssets: 1_003_000_000, revenue: 58_900_000,
    expenses: 3_200_000, netResult: 55_700_000, investmentReturn: 6.22,
    socialImpact: 45, trustCompliance: 96, phase: 'Aceleracao',
    highlights: ['Patrimonio > R$1 Bilhao', 'FIIs allocation', 'Economia tributaria consolidada'],
  },
  {
    year: 4, label: 'Maturidade', totalAssets: 1_063_000_000, revenue: 62_300_000,
    expenses: 3_500_000, netResult: 58_800_000, investmentReturn: 6.20,
    socialImpact: 67, trustCompliance: 97, phase: 'Maturidade',
    highlights: ['Projeto social 150 familias', 'Fundacao Quantica planejada', 'Rebalanceamento portafolio'],
  },
  {
    year: 5, label: 'Transmutacao', totalAssets: 1_128_000_000, revenue: 66_000_000,
    expenses: 4_000_000, netResult: 62_000_000, investmentReturn: 6.22,
    socialImpact: 89, trustCompliance: 97, phase: 'Transmutacao',
    highlights: ['Reestruturacao societaria', 'Quantum Legacy Foundation', 'Circulos Quanticos Autonomos'],
  },
  {
    year: 6, label: 'Nova Era', totalAssets: 1_199_000_000, revenue: 70_000_000,
    expenses: 5_200_000, netResult: 64_800_000, investmentReturn: 6.21,
    socialImpact: 112, trustCompliance: 98, phase: 'Nova Era',
    highlights: ['Fundacao ativa', 'QBTC circulation iniciada', 'Autonomia parcial atingida'],
  },
  {
    year: 7, label: 'Ascensao', totalAssets: 1_275_000_000, revenue: 74_500_000,
    expenses: 6_000_000, netResult: 68_500_000, investmentReturn: 6.20,
    socialImpact: 138, trustCompliance: 98, phase: 'Ascensao',
    highlights: ['Multi-generacional operacional', 'Ressonancia etica > 95%', 'Ecosistema auto-sustentavel'],
  },
  {
    year: 8, label: 'Convergencia', totalAssets: 1_357_000_000, revenue: 79_200_000,
    expenses: 6_800_000, netResult: 72_400_000, investmentReturn: 6.22,
    socialImpact: 165, trustCompliance: 99, phase: 'Convergencia',
    highlights: ['Patrimonio > R$1.35 Bilhao', 'Circulos 100% autonomos', 'Modelo replicavel'],
  },
  {
    year: 9, label: 'Integralidade', totalAssets: 1_445_000_000, revenue: 84_300_000,
    expenses: 7_500_000, netResult: 76_800_000, investmentReturn: 6.23,
    socialImpact: 195, trustCompliance: 99, phase: 'Integralidade',
    highlights: ['Resiliencia testada por crise', 'Karma social consolidado', 'Preparacao para Ano 10'],
  },
  {
    year: 10, label: 'Legado Eterno', totalAssets: 1_540_000_000, revenue: 90_000_000,
    expenses: 8_200_000, netResult: 81_800_000, investmentReturn: 6.24,
    socialImpact: 230, trustCompliance: 100, phase: 'Legado Eterno',
    highlights: ['Ciclo completo da decada', 'R$1.54 Bilhao em ativos', 'Transmutacao concluida', 'Laço Quântico eterno'],
  },
];

// ─── Investment Layers ───

export const INVESTMENT_LAYERS: InvestmentLayer[] = [
  {
    name: 'Protecao & Liquidez',
    percentage: 70, value: 595_000_000, annualReturn: 4.5,
    purpose: 'Colchao de seguranca, resgate imediato. Tesouro Selic.',
    color: '#06d6a0',
  },
  {
    name: 'Renda Garantida',
    percentage: 25, value: 212_500_000, annualReturn: 4.3,
    purpose: 'Renda previsivel, protecao FGC. CDB/LCI grandes bancos.',
    color: '#fbbf24',
  },
  {
    name: 'Crescimento',
    percentage: 3, value: 25_500_000, annualReturn: 8.5,
    purpose: 'Acoes BR, FIIs, diversificacao.',
    color: '#f7931a',
  },
  {
    name: 'Impacto Social',
    percentage: 1.5, value: 12_750_000, annualReturn: 3.0,
    purpose: '150 imoveis, projeto Merecômetro, fundacao.',
    color: '#e01b24',
  },
  {
    name: 'Reserva Estrategica',
    percentage: 0.5, value: 4_250_000, annualReturn: 0,
    purpose: 'Conta USD exterior, reserva estrategica global.',
    color: '#a855f7',
  },
];

// ─── Trust / Holding Structure ───

export const TRUST_STRUCTURE: TrustStructure[] = [
  {
    type: 'Holding Patrimonial Ltda.',
    jurisdiction: 'Brasil',
    setupCost: 50_000, annualCost: 48_000,
    purpose: 'Blindagem patrimonial, planejamento sucessorio, otimizacao tributaria',
    status: 'active',
  },
  {
    type: 'Trust Irrevogavel (IBC/LLC)',
    jurisdiction: 'BVI / Jersey',
    setupCost: 70_000, annualCost: 200_000,
    purpose: 'Protecao maxima de ativos, diferimento tributario, sigilo',
    status: 'active',
  },
  {
    type: 'Quantum Legacy Foundation',
    jurisdiction: 'Brasil + Offshore',
    setupCost: 120_000, annualCost: 350_000,
    purpose: 'Braço social, circulos quanticos autonomos, QBTC circulation',
    status: 'planned',
  },
];

// ─── Quantum Metrics (non-financial KPIs) ───

export const QUANTUM_METRICS: QuantumMetric[] = [
  { name: 'Ressonancia Etica', value: 87.3, max: 100, unit: '%', description: 'Alinhamento com principios eticos do ecossistema' },
  { name: 'QBTC Circulation', value: 12_450, max: 100_000, unit: 'tokens', description: 'Tokens do legado em circulacao' },
  { name: 'Circulos Ativos', value: 7, max: 20, unit: '', description: 'Circulos Quanticos Autonomos operacionais' },
  { name: 'Karma Social', value: 230, max: 500, unit: 'kpts', description: 'Impacto social acumulado (familias beneficiadas)' },
  { name: 'QVT Index', value: 94.2, max: 100, unit: '%', description: 'Indice de Qualidade de Vida do ecossistema' },
  { name: 'Entropia do Legado', value: 0.23, max: 1, unit: '', description: 'Grau de desordem/controlabilidade (menos = mais controlado)' },
];

// ─── Wormhole/Blackhole Financial Flow ───

export interface WormholeFlow {
  source: string;
  destination: string;
  amount: number;
  type: 'injection' | 'allocation' | 'distribution' | 'absorption';
  status: 'pending' | 'active' | 'completed';
  timestamp?: number;
}

export const WORMHOLE_FLOWS: WormholeFlow[] = [
  {
    source: 'Mega da Virada 2025',
    destination: 'Holding Patrimonial',
    amount: 850_000_000,
    type: 'injection', status: 'completed',
  },
  {
    source: 'Holding Patrimonial',
    destination: 'Trust Irrevogavel',
    amount: 600_000_000,
    type: 'allocation', status: 'active',
  },
  {
    source: 'Trust Irrevogavel',
    destination: 'Tesouro Selic (70%)',
    amount: 595_000_000,
    type: 'allocation', status: 'active',
  },
  {
    source: 'Trust Irrevogavel',
    destination: 'CDB/LCI (25%)',
    amount: 212_500_000,
    type: 'allocation', status: 'active',
  },
  {
    source: 'Rendimentos Anuais',
    destination: 'Projeto Social 150 Familias',
    amount: 38_250_000,
    type: 'distribution', status: 'pending',
  },
  {
    source: 'Fundo de Investimentos',
    destination: 'Blackhole (Trust Perpetuo)',
    amount: 1_540_000_000,
    type: 'absorption', status: 'pending',
  },
];

// ─── Utility Functions ───

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `R$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(1)}K`;
  return `R$${value.toFixed(0)}`;
}

export function getLegacyYear(year: number): LegacyYear {
  return LEGACY_YEARS[year] || LEGACY_YEARS[0];
}

export function getGrowthRate(fromYear: number, toYear: number): number {
  const from = LEGACY_YEARS[fromYear]?.totalAssets || 0;
  const to = LEGACY_YEARS[toYear]?.totalAssets || 0;
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
}

/** Sequence Sagrada do Legado */
export const SACRED_SEQUENCE = [1, 10, 12, 28, 41, 46];

/** Quantum Bond identifier */
export const QUANTUM_BOND_ID = 'LQ-2025-01-10-12-28-41-46';