// CryptoWallet - JavaScript Frontend

class CryptoWallet {
    constructor() {
        this.currentUser = null;
        this.wallets = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Auth toggle
        document.getElementById('showLogin').addEventListener('click', () => this.showLoginForm());
        document.getElementById('showRegister').addEventListener('click', () => this.showRegisterForm());

        // Auth forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // File import
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('walletFile').click();
        });

        document.getElementById('walletFile').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        document.getElementById('importWalletBtn').addEventListener('click', () => this.importWallet());

        // Drag and drop
        const dropArea = document.getElementById('drop-area');
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    checkAuthState() {
        // Check if user is logged in (simplified - in real app would check session/token)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showAuthSection();
        }
    }

    showLoginForm() {
        document.getElementById('showLogin').classList.add('active');
        document.getElementById('showRegister').classList.remove('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('showRegister').classList.add('active');
        document.getElementById('showLogin').classList.remove('active');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                this.currentUser = { id: result.user_id, username };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showNotification('Login realizado com sucesso!', 'success');
                this.showMainApp();
            } else {
                this.showNotification(result.message || 'Erro no login', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Usuário registrado com sucesso! Faça login.', 'success');
                this.showLoginForm();
            } else {
                this.showNotification(result.message || 'Erro no registro', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthSection();
        this.showNotification('Logout realizado com sucesso!', 'success');
    }

    showAuthSection() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
        document.getElementById('wallets-section').classList.add('hidden');
        document.getElementById('import-section').classList.add('hidden');
        document.getElementById('settings-section').classList.add('hidden');
        document.querySelector('header nav').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.querySelector('header nav').style.display = 'block';
        this.showSection('dashboard');
        this.loadDashboardData();
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('main section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).classList.remove('hidden');

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'wallets':
                this.loadWallets();
                break;
            case 'import':
                this.resetImportForm();
                break;
        }
    }

    async loadDashboardData() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/wallets?user_id=${this.currentUser.id}`);
            const wallets = await response.json();

            const totalWallets = wallets.length;
            const activeWallets = wallets.filter(w => w.is_active).length;
            const totalKeys = wallets.reduce((sum, w) => sum + (w.keys_count || 0), 0);
            const totalAddresses = wallets.reduce((sum, w) => sum + (w.addresses_count || 0), 0);

            document.getElementById('totalWallets').textContent = totalWallets;
            document.getElementById('activeWallets').textContent = activeWallets;
            document.getElementById('totalKeys').textContent = totalKeys;
            document.getElementById('totalAddresses').textContent = totalAddresses;

            // Update activity list
            const activityList = document.getElementById('activityList');
            if (wallets.length > 0) {
                activityList.innerHTML = wallets.slice(0, 5).map(wallet => 
                    `<li>Wallet "${wallet.name}" importada em ${new Date(wallet.created_at).toLocaleDateString()}</li>`
                ).join('');
            }
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    async loadWallets() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/wallets?user_id=${this.currentUser.id}`);
            const wallets = await response.json();
            this.wallets = wallets;

            const walletList = document.getElementById('walletList');
            
            if (wallets.length === 0) {
                walletList.innerHTML = '<p class="empty-state">Nenhuma wallet encontrada. Importe uma para começar!</p>';
                return;
            }

            walletList.innerHTML = wallets.map(wallet => this.createWalletCard(wallet)).join('');
        } catch (error) {
            console.error('Erro ao carregar wallets:', error);
            this.showNotification('Erro ao carregar wallets', 'error');
        }
    }

    createWalletCard(wallet) {
        const typeLabels = {
            'bitcoin_core': 'Bitcoin Core',
            'berkeley_db': 'Bitcoin Core',
            'ethereum_keystore': 'Ethereum',
            'genesis_wallet': 'Genesis',
            'binary': 'Binário',
            'unknown': 'Desconhecido'
        };

        return `
            <div class="wallet-card">
                <div class="wallet-header">
                    <div class="wallet-name">${wallet.name}</div>
                    <div class="wallet-type">${typeLabels[wallet.wallet_type] || wallet.wallet_type}</div>
                </div>
                <div class="wallet-info">
                    <div class="wallet-info-item">
                        <div class="label">Chaves</div>
                        <div class="value">${wallet.keys_count || 0}</div>
                    </div>
                    <div class="wallet-info-item">
                        <div class="label">Endereços</div>
                        <div class="value">${wallet.addresses_count || 0}</div>
                    </div>
                    <div class="wallet-info-item">
                        <div class="label">Tamanho</div>
                        <div class="value">${this.formatFileSize(wallet.file_size || 0)}</div>
                    </div>
                    <div class="wallet-info-item">
                        <div class="label">Criptografada</div>
                        <div class="value">${wallet.is_encrypted ? 'Sim' : 'Não'}</div>
                    </div>
                </div>
                <div class="wallet-actions">
                    <button class="btn secondary-btn" onclick="cryptoWallet.generateAddress(${wallet.id})">
                        <i class="fas fa-plus"></i> Gerar Endereço
                    </button>
                    <button class="btn secondary-btn" onclick="cryptoWallet.viewWalletInfo(${wallet.id})">
                        <i class="fas fa-info"></i> Detalhes
                    </button>
                    <button class="btn secondary-btn" onclick="cryptoWallet.deleteWallet(${wallet.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    handleFileSelect(file) {
        if (!file) return;

        const allowedTypes = ['.dat', '.wallet', '.json'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
            this.showNotification('Tipo de arquivo não suportado', 'error');
            return;
        }

        document.getElementById('walletName').value = file.name.replace(/\.[^/.]+$/, "");
        document.getElementById('importWalletBtn').disabled = false;
        
        // Update drop area text
        const dropArea = document.getElementById('drop-area');
        dropArea.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <p>Arquivo selecionado: <strong>${file.name}</strong></p>
            <p>Clique em "Importar Wallet" para continuar</p>
        `;
    }

    async importWallet() {
        if (!this.currentUser) return;

        const fileInput = document.getElementById('walletFile');
        const walletName = document.getElementById('walletName').value;
        const password = document.getElementById('walletPasswordImport').value;

        if (!fileInput.files[0]) {
            this.showNotification('Selecione um arquivo primeiro', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('user_id', this.currentUser.id);
        formData.append('name', walletName || 'Wallet Importada');
        if (password) {
            formData.append('password', password);
        }

        try {
            document.getElementById('importWalletBtn').classList.add('loading');
            document.getElementById('importWalletBtn').innerHTML = '<span class="spinner"></span>Importando...';

            const response = await fetch('/api/wallets/import', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Wallet importada com sucesso!', 'success');
                this.resetImportForm();
                this.showSection('wallets');
            } else {
                this.showNotification(result.message || 'Erro ao importar wallet', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        } finally {
            document.getElementById('importWalletBtn').classList.remove('loading');
            document.getElementById('importWalletBtn').innerHTML = 'Importar Wallet';
        }
    }

    resetImportForm() {
        document.getElementById('walletFile').value = '';
        document.getElementById('walletName').value = '';
        document.getElementById('walletPasswordImport').value = '';
        document.getElementById('importWalletBtn').disabled = true;
        
        // Reset drop area
        const dropArea = document.getElementById('drop-area');
        dropArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arraste e solte seu arquivo wallet aqui</p>
            <p>ou</p>
            <button id="selectFileBtn" class="btn secondary-btn">Selecionar Arquivo</button>
        `;
        
        // Re-attach event listener
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('walletFile').click();
        });
    }

    async generateAddress(walletId) {
        try {
            const response = await fetch(`/api/crypto/generate-address/${walletId}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(`Endereço gerado: ${result.address}`, 'success');
            } else {
                this.showNotification(result.message || 'Erro ao gerar endereço', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        }
    }

    async viewWalletInfo(walletId) {
        try {
            const response = await fetch(`/api/crypto/wallet-info/${walletId}`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                const info = `
                    Nome: ${result.name}
                    Tipo: ${result.type}
                    Chaves: ${result.keys_count}
                    Endereços: ${result.addresses_count}
                    Criptografada: ${result.is_encrypted ? 'Sim' : 'Não'}
                    Tamanho: ${this.formatFileSize(result.file_size)}
                    Status: ${result.status}
                `;
                alert(info); // In a real app, you'd use a modal
            } else {
                this.showNotification(result.message || 'Erro ao obter informações', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        }
    }

    async deleteWallet(walletId) {
        if (!confirm('Tem certeza que deseja excluir esta wallet?')) {
            return;
        }

        try {
            const response = await fetch(`/api/wallets/${walletId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Wallet excluída com sucesso!', 'success');
                this.loadWallets();
                this.loadDashboardData();
            } else {
                this.showNotification(result.message || 'Erro ao excluir wallet', 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão', 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application
const cryptoWallet = new CryptoWallet();

