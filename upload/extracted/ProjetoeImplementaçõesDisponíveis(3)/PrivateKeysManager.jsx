import React, { useState, useEffect } from 'react';
import { Upload, Key, Shield, Eye, EyeOff, Download, Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const PrivateKeysManager = () => {
  const [wallets, setWallets] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState({});
  const [validationResults, setValidationResults] = useState({});
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    private_key_wif: '',
    address: '',
    notes: '',
    validate: true
  });
  
  // Estados de upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadText, setUploadText] = useState('');
  const [showUploadText, setShowUploadText] = useState(false);

  useEffect(() => {
    loadWallets();
    loadStatistics();
  }, []);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/private-keys/wallets');
      const data = await response.json();
      
      if (data.success) {
        setWallets(data.wallets);
      }
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/private-keys/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAddPrivateKey = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch('/api/private-keys/wallet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          private_key_wif: '',
          address: '',
          notes: '',
          validate: true
        });
        setShowAddForm(false);
        loadWallets();
        loadStatistics();
        
        if (data.validation_result) {
          setValidationResults(prev => ({
            ...prev,
            [data.address]: data.validation_result
          }));
        }
      } else {
        alert('Erro ao adicionar chave privada: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao adicionar chave privada:', error);
      alert('Erro ao adicionar chave privada');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile) {
      alert('Selecione um arquivo');
      return;
    }
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const response = await fetch('/api/private-keys/import/file', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Importação concluída: ${data.import_result.imported_count} chaves importadas`);
        setUploadFile(null);
        loadWallets();
        loadStatistics();
      } else {
        alert('Erro na importação: ' + data.error);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro no upload do arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleTextImport = async (e) => {
    e.preventDefault();
    
    if (!uploadText.trim()) {
      alert('Digite o conteúdo para importar');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/private-keys/import/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text_content: uploadText }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Importação concluída: ${data.import_result.imported_count} chaves importadas`);
        setUploadText('');
        setShowUploadText(false);
        loadWallets();
        loadStatistics();
      } else {
        alert('Erro na importação: ' + data.error);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      alert('Erro na importação de texto');
    } finally {
      setLoading(false);
    }
  };

  const togglePrivateKey = async (walletId) => {
    if (showPrivateKey[walletId]) {
      setShowPrivateKey(prev => ({ ...prev, [walletId]: false }));
      return;
    }
    
    try {
      const response = await fetch(`/api/private-keys/wallet/${walletId}/private-key`, {
        headers: {
          'Authorization': 'Bearer FDR_MASTER_KEY_2025'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowPrivateKey(prev => ({ 
          ...prev, 
          [walletId]: data.private_key_wif 
        }));
      } else {
        alert('Erro ao obter chave privada: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao obter chave privada:', error);
      alert('Erro ao obter chave privada');
    }
  };

  const syncBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/private-keys/sync/balances', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Sincronização concluída: ${data.sync_results.synced_wallets} carteiras atualizadas`);
        loadWallets();
        loadStatistics();
      } else {
        alert('Erro na sincronização: ' + data.error);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização de saldos');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/private-keys/backup', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Backup criado com sucesso!');
      } else {
        alert('Erro ao criar backup: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('Erro ao criar backup');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'custody':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatBTC = (amount) => {
    return parseFloat(amount || 0).toFixed(8);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="w-8 h-8 text-yellow-500" />
              Gerenciador de Chaves Privadas
            </h1>
            <p className="text-gray-400 mt-2">
              Sistema seguro de gerenciamento de chaves privadas Bitcoin
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={syncBalances}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar Saldos
            </button>
            
            <button
              onClick={createBackup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Backup
            </button>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Chave
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Carteiras</p>
                <p className="text-2xl font-bold">{statistics.total_wallets || 0}</p>
              </div>
              <Key className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Carteiras Ativas</p>
                <p className="text-2xl font-bold text-green-500">{statistics.active_wallets || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Saldo Total</p>
                <p className="text-2xl font-bold text-orange-500">{formatBTC(statistics.total_balance_btc)} BTC</p>
              </div>
              <div className="text-orange-500 text-2xl font-bold">₿</div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Valor USD</p>
                <p className="text-2xl font-bold text-green-500">${(statistics.total_balance_usd || 0).toLocaleString()}</p>
              </div>
              <div className="text-green-500 text-2xl font-bold">$</div>
            </div>
          </div>
        </div>

        {/* Seção de Upload */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Importar Chaves Privadas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload de Arquivo */}
            <div>
              <h3 className="font-semibold mb-3">Upload de Arquivo</h3>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".txt,.dat,.core,.wif,.key"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Formatos suportados: .txt, .dat, .core, .wif, .key
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={!uploadFile || loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Importando...' : 'Importar Arquivo'}
                </button>
              </form>
            </div>
            
            {/* Import de Texto */}
            <div>
              <h3 className="font-semibold mb-3">Importar de Texto</h3>
              <button
                onClick={() => setShowUploadText(!showUploadText)}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mb-3"
              >
                {showUploadText ? 'Ocultar' : 'Mostrar'} Campo de Texto
              </button>
              
              {showUploadText && (
                <form onSubmit={handleTextImport} className="space-y-4">
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="Cole aqui o conteúdo com chaves privadas..."
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                  />
                  
                  <button
                    type="submit"
                    disabled={!uploadText.trim() || loading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Importando...' : 'Importar Texto'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Carteiras */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Carteiras ({Object.keys(wallets).length})
          </h2>
          
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-gray-400">Carregando carteiras...</p>
            </div>
          )}
          
          {!loading && Object.keys(wallets).length === 0 && (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">Nenhuma carteira encontrada</p>
              <p className="text-sm text-gray-500">Adicione ou importe chaves privadas para começar</p>
            </div>
          )}
          
          <div className="space-y-4">
            {Object.entries(wallets).map(([walletId, wallet]) => (
              <div key={walletId} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(wallet.status)}
                    <div>
                      <p className="font-semibold">{wallet.address}</p>
                      <p className="text-sm text-gray-400">
                        {wallet.wallet_type} • {wallet.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-orange-500">
                      {formatBTC(wallet.balance_btc)} BTC
                    </p>
                    <p className="text-sm text-gray-400">
                      {wallet.utxo_count} UTXOs
                    </p>
                  </div>
                </div>
                
                {wallet.notes && (
                  <p className="text-sm text-gray-400 mb-3">
                    📝 {wallet.notes}
                  </p>
                )}
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePrivateKey(walletId)}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors"
                  >
                    {showPrivateKey[walletId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPrivateKey[walletId] ? 'Ocultar' : 'Mostrar'} Chave
                  </button>
                  
                  <span className="text-sm text-gray-400">
                    Importado: {new Date(wallet.imported_at).toLocaleDateString()}
                  </span>
                  
                  {wallet.last_balance_check && (
                    <span className="text-sm text-gray-400">
                      Último check: {new Date(wallet.last_balance_check).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {showPrivateKey[walletId] && (
                  <div className="mt-3 p-3 bg-gray-900 rounded border border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-500">
                        CHAVE PRIVADA SENSÍVEL
                      </span>
                    </div>
                    <p className="font-mono text-sm break-all bg-black p-2 rounded">
                      {showPrivateKey[walletId]}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ⚠️ Mantenha esta informação segura e privada
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Adicionar Chave */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Adicionar Chave Privada</h3>
              
              <form onSubmit={handleAddPrivateKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chave Privada WIF *
                  </label>
                  <input
                    type="text"
                    value={formData.private_key_wif}
                    onChange={(e) => setFormData({...formData, private_key_wif: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Endereço Bitcoin (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Se não fornecido, será derivado automaticamente
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Descrição da carteira..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="validate"
                    checked={formData.validate}
                    onChange={(e) => setFormData({...formData, validate: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="validate" className="text-sm">
                    Validar chave privada e verificar saldo
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateKeysManager;

