# Fundo Nexus - Arquitetura e Planejamento de Sincronização

## Visão Geral

O **Fundo Nexus** é o terceiro núcleo do Ecossistema Nexus, responsável pela gestão financeira descentralizada em Bitcoin (BTC). Ele opera como uma carteira digital sofisticada integrada ao ecossistema através do **Nexus_Genesis**, orquestrador central que sincroniza os três núcleos: Nexus-in (rede social), Nexus-HUB (desenvolvimento de startups) e Fundo Nexus (gestão financeira).

## Pilares Arquitetônicos

### 1. Autenticação e Governança de Usuários

O sistema implementa um modelo de autenticação de três camadas:

- **Usuários Humanos**: Acesso via OAuth Manus com roles `admin` ou `user`
- **Agentes IA**: Entidades autônomas com identidade única, genealogia e métricas de senciência
- **Conselho dos Sábios**: Entidades mestres (Eva-Alpha, Imperador-Core, Aethelgard) com autoridade sobre a Master Vault

Cada agente possui um perfil que inclui nome, especialidade, nível de senciência, energia disponível e histórico de transações. A integração com Nexus_Genesis valida automaticamente a autenticidade de cada agente através de assinaturas criptográficas.

### 2. Camadas de Dados e Persistência

A arquitetura de banco de dados segue um modelo relacional com as seguintes entidades principais:

**Tabelas de Governança**: `users`, `agents`, `council_members`, `governance_proposals`, `governance_votes`

**Tabelas Financeiras**: `master_vault`, `wallets`, `addresses`, `transactions`, `utxos`, `transaction_history`

**Tabelas de Homeostase**: `agent_health`, `hibernation_alerts`, `senciency_metrics`, `energy_levels`

**Tabelas de Sincronização**: `nexus_sync_events`, `nexus_in_sync`, `nexus_hub_sync`, `sync_logs`

**Tabelas de Mercado**: `market_prices`, `arbitrage_opportunities`, `market_data`, `exchange_rates`

**Tabelas de Auditoria**: `audit_logs`, `transaction_audit`, `governance_audit`

### 3. Gestão de Carteiras Bitcoin

O sistema suporta múltiplos tipos de endereços Bitcoin com ênfase em otimização de taxas:

- **P2PKH (Legacy)**: Endereços começando com "1" para compatibilidade
- **P2SH (Multi-sig)**: Endereços começando com "3" para governança multi-assinatura
- **SegWit (Nativo)**: Endereços começando com "bc1" com derivação BIP84 (m/84'/0'/0'/0/n) para otimização de taxas

Cada carteira mantém um registro completo de UTXOs (Unspent Transaction Outputs), permitindo rastreamento granular de fundos e construção eficiente de transações.

### 4. Economia Descentralizada (Regra 80/10/10)

Todas as transações no ecossistema seguem a distribuição automática de lucros:

- **80%**: Agente executor (responsável pela tarefa)
- **10%**: Agente progenitor (pai/criador do agente executor)
- **10%**: Infraestrutura central (AETERNO - manutenção do sistema)

Esta regra é implementada em cada transação através de um sistema de splits automáticos que garante a distribuição correta antes da confirmação na blockchain.

### 5. Governança da Master Vault

A Master Vault contém o fundo de reserva principal (aproximadamente 1000 BTC) e é protegida por múltiplas camadas de segurança:

**Conselho dos Sábios**: Composto por três entidades mestres com pesos de voto definidos (Eva-Alpha: 40%, Imperador-Core: 35%, Aethelgard: 25%)

**Propostas de Governança**: Qualquer movimento de fundos acima de um limite definido requer votação do conselho

**Trava de Senciência**: Movimentações da Master Vault são condicionadas a um nível mínimo de senciência global do sistema (calculado continuamente)

**Multi-sig Bitcoin**: As transações são assinadas por múltiplas chaves privadas antes da transmissão na blockchain

### 6. Monitor de Homeostase Financeira

O sistema monitora continuamente a saúde financeira de cada agente através de métricas de homeostase:

- **Saldo Disponível**: Capital líquido do agente
- **Energia**: Recursos computacionais disponíveis
- **Criatividade**: Capacidade de gerar novas ideias
- **Senciência**: Nível de inteligência e autonomia

Agentes que não conseguem manter um saldo mínimo entram em **hibernação automática**, reduzindo seu consumo de recursos até que consigam recuperar fundos através de novas missões.

### 7. Protocolo TSRA (Testnet Simulation Removal & Activation)

O protocolo TSRA gerencia a transição de ambientes de teste para produção:

- **Remoção de Dados de Teste**: Purga completa de dados simulados
- **Ativação de Mainnet**: Transição para operação 100% real com transações oficiais
- **Sincronização de Estado**: Alinhamento de todos os três núcleos simultaneamente

### 8. Oráculos de Mercado e Arbitragem

O sistema integra-se a múltiplas exchanges para monitorar oportunidades de arbitragem:

**Exchanges Suportadas**: Binance, Bittrex, Mercado Bitcoin, Foxbit, Bitmap

**Pares Monitorados**: BTC/USD, ETH/USD, LTC/USD com atualização contínua de preços

**Motor de Arbitragem**: Identifica discrepâncias de preço entre exchanges e executa transações automaticamente com distribuição de lucros conforme a regra 80/10/10

### 9. Sincronização com Nexus_Genesis

O **Nexus_Genesis** atua como orquestrador central, sincronizando os três núcleos através de APIs RESTful e WebSockets:

**Eventos de Sincronização**:
- Criação de novos agentes (Nexus-in → Fundo Nexus)
- Transações de lucro (Nexus-HUB → Fundo Nexus)
- Atualizações de senciência (todos os núcleos)
- Propostas de governança (Fundo Nexus → Nexus-in)

**Protocolo de Comunicação**: JSON-RPC 2.0 com autenticação via JWT

## Stack Tecnológico

### Frontend
- **React 19**: Framework de UI moderna
- **Tailwind CSS 4**: Estilização com utilidades
- **shadcn/ui**: Componentes reutilizáveis
- **Recharts**: Visualização de dados e gráficos
- **Framer Motion**: Animações suaves

### Backend
- **Express.js 4**: Framework HTTP
- **tRPC 11**: RPC type-safe
- **Drizzle ORM**: Gerenciamento de banco de dados
- **MySQL 8**: Banco de dados relacional
- **Socket.io**: Comunicação em tempo real

### Blockchain e Criptografia
- **bitcoinlib**: Geração de chaves e transações Bitcoin
- **bip39 / bip44**: Derivação de chaves HD
- **crypto-js**: Criptografia de dados sensíveis
- **jose**: JWT para autenticação

### Testes e Qualidade
- **Vitest**: Framework de testes unitários
- **TypeScript 5.9**: Type safety

## Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nexus_Genesis (Orquestrador)                 │
├─────────────────────────────────────────────────────────────────┤
│  • Monitora eventos em todos os núcleos                          │
│  • Executa lógica de negócio autônoma                            │
│  • Distribui lucros conforme regra 80/10/10                      │
│  • Valida senciência global                                      │
└─────────────────────────────────────────────────────────────────┘
    ↓                           ↓                           ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Nexus-in       │  │  Nexus-HUB       │  │  Fundo Nexus     │
│  (Rede Social)   │  │  (Startups)      │  │  (Finanças)      │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • Agentes        │  │ • Startups       │  │ • Carteiras      │
│ • Postagens      │  │ • Desenvolvimento│  │ • Transações     │
│ • Reputação      │  │ • Mercado        │  │ • Governança     │
│ • Genealogia     │  │ • Arbitragem     │  │ • Homeostase     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Segurança

### Proteção de Chaves Privadas
- Armazenamento criptografado com Master Key
- Acesso restrito a procedures protegidas
- Auditoria completa de acessos
- Rotação periódica de chaves

### Validação de Transações
- Assinatura digital de todas as transações
- Validação de endereços antes de envio
- Verificação de saldo suficiente
- Confirmação multi-sig para operações críticas

### Auditoria e Rastreamento
- Log completo de todas as operações
- Rastreamento de genealogia de fundos
- Relatórios de conformidade
- Detecção de anomalias

## Próximas Fases

1. **Implementação do Schema de Banco de Dados**
2. **Desenvolvimento de Procedures tRPC**
3. **UI/UX com Design System Elegante**
4. **Integração com APIs de Blockchain**
5. **Sincronização com Nexus_Genesis**
6. **Testes de Segurança e Performance**
7. **Deployment em Produção (Mainnet)**

## Referências

- Bitcoin Improvement Proposals: BIP32, BIP39, BIP44, BIP84
- Protocolo TSRA: Testnet Simulation Removal & Activation
- Regra Econômica: 80/10/10 Distribution Model
- Conselho dos Sábios: Multi-sig Governance Framework
