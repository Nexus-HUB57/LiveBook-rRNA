# Guia de Deployment - Nexus-HUB

## Pré-requisitos

- Node.js 22.13.0+
- pnpm 10.15.1+
- MySQL 8.0+ ou TiDB
- Conta Manus Platform
- Credenciais OAuth configuradas

## Checklist de Deployment

### 1. Preparação do Ambiente

```bash
# Clonar repositório
git clone https://github.com/LucasThomaz1981/ManusClone.git nexus-hub
cd nexus-hub

# Instalar dependências
pnpm install

# Verificar versões
node --version    # v22.13.0+
pnpm --version    # 10.15.1+
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env.production`:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/nexus_hub

# Authentication
JWT_SECRET=seu_secret_seguro_aqui_minimo_32_caracteres
VITE_APP_ID=seu_app_id_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Owner
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=seu_nome

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=seu_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=seu_frontend_key

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu_website_id

# App Config
VITE_APP_TITLE=Nexus-HUB
VITE_APP_LOGO=https://cdn.example.com/logo.png
```

### 3. Preparar Banco de Dados

```bash
# Executar migrações
pnpm db:push

# Seed de dados de demonstração (opcional)
pnpm tsx server/seed-data.ts

# Verificar integridade
pnpm tsx server/verify-db.ts
```

### 4. Executar Testes

```bash
# Testes unitários
pnpm test

# Testes de integração
pnpm test:integration

# Coverage
pnpm test:coverage
```

### 5. Build para Produção

```bash
# Build frontend e backend
pnpm build

# Verificar tamanho dos bundles
ls -lh dist/

# Verificar se há erros
pnpm check
```

### 6. Deploy no Manus Platform

#### Opção A: Via UI Manus

1. Acessar [Manus Management UI](https://manus.im)
2. Clicar em "Publish" (após criar checkpoint)
3. Configurar domínio customizado (opcional)
4. Confirmar deployment

#### Opção B: Via CLI

```bash
# Login
manus login

# Deploy
manus deploy --project nexus-hub

# Verificar status
manus status --project nexus-hub
```

#### Opção C: Via GitHub

1. Fazer push para repositório GitHub
2. Conectar repositório no Manus Platform
3. Configurar auto-deploy em push para `main`

### 7. Verificar Deployment

```bash
# Acessar aplicação
curl https://seu-dominio.manus.space/

# Verificar health check
curl https://seu-dominio.manus.space/api/health

# Verificar logs
manus logs --project nexus-hub --tail 100
```

## Configuração de Domínio

### Domínio Automático (Manus)

```
https://nexus-hub.manus.space
```

Disponível automaticamente após deployment.

### Domínio Customizado

1. Registrar domínio em registrador (GoDaddy, Namecheap, etc.)
2. Acessar Manus Management UI → Settings → Domains
3. Adicionar novo domínio
4. Configurar DNS records conforme instruções
5. Aguardar propagação (até 48h)

**DNS Records:**
```
CNAME: seu-dominio.com → nexus-hub.manus.space
```

## Monitoramento Pós-Deployment

### Métricas Importantes

- **Response Time**: < 500ms
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%
- **Database Connections**: < 100

### Acessar Dashboard

1. Manus Management UI → Dashboard
2. Visualizar:
   - Status do servidor
   - Tráfego (UV/PV)
   - Erros e logs
   - Performance

### Configurar Alertas

1. Manus Management UI → Settings → Notifications
2. Configurar webhooks para:
   - Erros críticos
   - Downtime
   - Performance degradada

## Rollback de Deployment

Se algo der errado:

```bash
# Ver checkpoints anteriores
manus checkpoints --project nexus-hub

# Rollback para checkpoint anterior
manus rollback --project nexus-hub --version <version_id>
```

Ou via UI:
1. Management UI → Dashboard
2. Encontrar checkpoint anterior
3. Clicar em "Rollback"

## Manutenção Contínua

### Backup do Banco de Dados

```bash
# Backup automático (Manus)
# Configurar em: Settings → Backups

# Backup manual
mysqldump -u user -p nexus_hub > backup-$(date +%Y%m%d).sql
```

### Atualizar Dependências

```bash
# Verificar atualizações
pnpm outdated

# Atualizar
pnpm up

# Testar
pnpm test

# Deploy
pnpm build && manus deploy
```

### Logs e Debugging

```bash
# Ver logs do servidor
manus logs --project nexus-hub --tail 1000

# Ver logs do cliente (navegador)
# Acessar DevTools → Console

# Exportar logs
manus logs --project nexus-hub --export > logs.txt
```

## Troubleshooting Deployment

### Erro: "Database connection failed"

```bash
# Verificar URL
echo $DATABASE_URL

# Testar conexão
mysql -u user -p -h host -D nexus_hub -e "SELECT 1"

# Verificar firewall
telnet host 3306
```

### Erro: "OAuth callback failed"

```bash
# Verificar configuração
echo $VITE_APP_ID
echo $OAUTH_SERVER_URL

# Testar OAuth
curl -X POST $OAUTH_SERVER_URL/oauth/token \
  -d "client_id=$VITE_APP_ID&..."
```

### Erro: "Out of memory"

```bash
# Aumentar limite de memória
NODE_OPTIONS="--max-old-space-size=2048" pnpm start

# Ou via Manus Settings
# Settings → Server → Memory Limit
```

### Erro: "Build timeout"

```bash
# Aumentar timeout
pnpm build --timeout 600000

# Ou otimizar build
pnpm build --minify=false  # Desenvolvimento
```

## Segurança em Produção

### Checklist de Segurança

- [ ] JWT_SECRET é seguro (mínimo 32 caracteres)
- [ ] DATABASE_URL não contém credenciais em logs
- [ ] HTTPS habilitado (automático em Manus)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Autenticação OAuth funcionando
- [ ] Auditoria em S3 configurada
- [ ] Backups automáticos ativados

### Secrets Management

```bash
# Adicionar secret via CLI
manus secrets set JWT_SECRET "seu_secret_seguro"

# Ou via UI
# Management UI → Settings → Secrets
```

### SSL/TLS

- Automático em Manus Platform
- Certificado Let's Encrypt renovado automaticamente
- Suporta HTTPS/TLS 1.3

## Performance Optimization

### Frontend

```bash
# Analisar bundle
pnpm build --analyze

# Otimizar imagens
# Usar CDN para assets estáticos

# Lazy loading
# Implementado via React.lazy()
```

### Backend

```bash
# Caching
# Implementado via Redis (opcional)

# Database indexing
# Verificar em drizzle/schema.ts

# Connection pooling
# Automático via Drizzle ORM
```

### CDN

```bash
# Usar CDN para assets
# Configurar em client/index.html

# Exemplo:
# <script src="https://cdn.jsdelivr.net/..."></script>
```

## Escalabilidade

### Horizontal Scaling

Manus Platform gerencia automaticamente:
- Load balancing
- Auto-scaling
- Replicação de banco de dados

### Vertical Scaling

Se necessário aumentar recursos:
1. Management UI → Settings → Server
2. Aumentar CPU/Memory
3. Aplicar mudanças (sem downtime)

## Disaster Recovery

### Plano de Recuperação

1. **Backup Diário**: Automático via Manus
2. **Replicação**: Banco de dados replicado
3. **Failover**: Automático em caso de falha
4. **RTO**: < 15 minutos
5. **RPO**: < 1 hora

### Testar Recuperação

```bash
# Simular falha
manus test-failover --project nexus-hub

# Verificar recuperação
manus status --project nexus-hub
```

## Suporte e Escalação

### Contatos

- **Suporte Técnico**: support@manus.im
- **Status Page**: status.manus.im
- **Documentação**: docs.manus.im
- **Discord**: discord.gg/manus

### Escalação

Se problema não for resolvido:
1. Coletar logs: `manus logs --export`
2. Descrever problema
3. Enviar para suporte@manus.im
4. Incluir version_id do deployment

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-03-02  
**Próxima Review:** 2026-04-02
