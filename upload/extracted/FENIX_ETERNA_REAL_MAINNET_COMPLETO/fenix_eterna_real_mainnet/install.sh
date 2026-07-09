#!/bin/bash

# Fênix Eterna - Script de Instalação
# Sistema Bitcoin Real Mainnet - Protocolo TSRA 100%

echo "🔥 FÊNIX ETERNA - INSTALAÇÃO BITCOIN REAL 🔥"
echo "=============================================="
echo "📋 PROTOCOLO TSRA: 100% MAINNET"
echo "❌ SIMULAÇÕES: PROIBIDAS"
echo "🔐 SENHA: Benjamin2020*1981$"
echo "=============================================="

# Verificar Python
echo "🐍 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    echo "📥 Instale Python 3.8+ antes de continuar"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION encontrado"

# Verificar pip
echo "📦 Verificando pip..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 não encontrado!"
    echo "📥 Instalando pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi
echo "✅ pip3 disponível"

# Criar ambiente virtual
echo "🏗️ Criando ambiente virtual..."
python3 -m venv fenix_eterna_env
source fenix_eterna_env/bin/activate
echo "✅ Ambiente virtual criado"

# Atualizar pip
echo "⬆️ Atualizando pip..."
pip install --upgrade pip
echo "✅ pip atualizado"

# Instalar dependências
echo "📚 Instalando dependências..."
pip install -r requirements.txt
echo "✅ Dependências instaladas"

# Verificar instalação
echo "🔍 Verificando instalação..."
python3 -c "import requests, json, hashlib; print('✅ Bibliotecas básicas OK')"

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p logs
mkdir -p backups
mkdir -p wallets
echo "✅ Diretórios criados"

# Configurar permissões
echo "🔒 Configurando permissões..."
chmod +x bitcoin_automation_real.py
chmod 600 config_real.json
echo "✅ Permissões configuradas"

# Verificar conectividade
echo "🌐 Testando conectividade..."
python3 -c "
import requests
try:
    r = requests.get('https://mempool.space/api/v1/fees/recommended', timeout=5)
    if r.status_code == 200:
        print('✅ Conectividade com mempool.space OK')
    else:
        print('⚠️ Problema de conectividade')
except:
    print('❌ Falha na conectividade')
"

# Criar script de inicialização
echo "🚀 Criando script de inicialização..."
cat > start_fenix_eterna.sh << 'EOF'
#!/bin/bash
echo "🔥 Iniciando Fênix Eterna - Bitcoin Real 🔥"
source fenix_eterna_env/bin/activate
python3 bitcoin_automation_real.py
EOF

chmod +x start_fenix_eterna.sh
echo "✅ Script de inicialização criado"

# Criar script de backup
echo "💾 Criando script de backup..."
cat > backup_fenix_eterna.sh << 'EOF'
#!/bin/bash
echo "💾 Criando backup Fênix Eterna..."
BACKUP_DIR="backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp config_real.json "$BACKUP_DIR/"
cp -r logs "$BACKUP_DIR/"
cp -r wallets "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup criado em $BACKUP_DIR"
EOF

chmod +x backup_fenix_eterna.sh
echo "✅ Script de backup criado"

# Verificação final
echo ""
echo "🎯 INSTALAÇÃO CONCLUÍDA!"
echo "========================"
echo "📁 Arquivos principais:"
echo "   - index.html (Interface Web)"
echo "   - bitcoin_automation_real.py (Automação Python)"
echo "   - config_real.json (Configurações)"
echo "   - start_fenix_eterna.sh (Inicialização)"
echo ""
echo "🚀 Para iniciar:"
echo "   ./start_fenix_eterna.sh"
echo ""
echo "🌐 Para interface web:"
echo "   Abra index.html no navegador"
echo ""
echo "💾 Para backup:"
echo "   ./backup_fenix_eterna.sh"
echo ""
echo "⚠️ LEMBRE-SE:"
echo "   - Este sistema usa Bitcoin REAL"
echo "   - Todas as transações são na mainnet"
echo "   - Mantenha suas chaves privadas seguras"
echo "   - Faça backup regularmente"
echo ""
echo "🔥 FÊNIX ETERNA PRONTA PARA BITCOIN REAL! 🔥"

