// Enhanced CryptoWallet JavaScript
class CryptoWalletApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.wallets = [];
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.checkAuthStatus();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 1500);
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check-session', {
                method: 'GET',
                credentials: 'include' // Importante para incluir cookies de sessão
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.currentUser = {
                        id: data.user_id,
                        username: data.username
                    };
                    this.showMainApp();
                    this.loadUserData();
                } else {
                    this.showAuthForm();
                }
            } else {
                this.showAuthForm();
            }
        } catch (error) {
            console.error('Erro ao verificar status de autenticação:', error);
            this.showAuthForm();
        }
    }

    setupEventListeners() {
        // Auth form listeners
        this.setupAuthListeners();
        
        // Navigation listeners
        this.setupNavigationListeners();
        
        // Import form listeners
        this.setupImportListeners();
        
        // Modal listeners
        this.setupModalListeners();
        
        // User menu listeners
        this.setupUserMenuListeners();
        
        // Analysis tools listeners
        this.setupAnalysisListeners();
        
        // Market data listeners
        this.setupMarketListeners();
    }

    setupAuthListeners() {
        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchAuthTab(tabType);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Password toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.closest('.input-group').querySelector('input');
                const icon = e.target.querySelector('i') || e.target;
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }

    setupNavigationListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.showSection(section);
            });
        });

        // Section buttons
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    setupImportListeners() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('wallet-file');
        const selectFileBtn = document.getElementById('select-file-btn');
        const importForm = document.getElementById('import-form');
        const cancelBtn = document.getElementById('cancel-import');

        // Dropzone events
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });

            dropzone.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }

        // Select file button
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Import form
        if (importForm) {
            importForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleWalletImport();
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetImportForm();
            });
        }
    }

    setupModalListeners() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Modal background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
    }

    setupUserMenuListeners() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }
    }

    setupAnalysisListeners() {
        // Analysis tool buttons
        const addressExplorerBtn = document.getElementById('address-explorer-btn');
        const portfolioAnalysisBtn = document.getElementById('portfolio-analysis-btn');
        const securityAuditBtn = document.getElementById('security-audit-btn');

        if (addressExplorerBtn) {
            addressExplorerBtn.addEventListener('click', () => {
                this.showAddressExplorer();
            });
        }

        if (portfolioAnalysisBtn) {
            portfolioAnalysisBtn.addEventListener('click', () => {
                this.showPortfolioAnalysis();
            });
        }

        if (securityAuditBtn) {
            securityAuditBtn.addEventListener('click', () => {
                this.showSecurityAudit();
            });
        }
    }

    setupMarketListeners() {
        const refreshMarketBtn = document.getElementById('refresh-market');
        if (refreshMarketBtn) {
            refreshMarketBtn.addEventListener('click', () => {
                this.loadMarketData();
            });
        }
    }

    // Authentication Methods
    switchAuthTab(tabType) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });

        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        document.getElementById(`${tabType}-form`).classList.remove('hidden');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showToast('error', 'Erro', 'Por favor, preencha todos os campos');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Importante para incluir cookies de sessão
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = { 
                    id: data.user_id,
                    username: data.username 
                };
                this.showMainApp();
                this.loadUserData();
                this.showToast('success', 'Sucesso', 'Login realizado com sucesso!');
            } else {
                this.showToast('error', 'Erro', data.message || 'Erro no login');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showToast('error', 'Erro', 'Por favor, preencha todos os campos');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('success', 'Sucesso', 'Conta criada com sucesso!');
                this.switchAuthTab('login');
            } else {
                this.showToast('error', 'Erro', data.message || 'Erro no registro');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.currentUser = null;
                this.showAuthForm();
                this.showToast('info', 'Logout', 'Você foi desconectado');
            } else {
                this.showToast('error', 'Erro', 'Erro ao fazer logout');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    showAuthForm() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.querySelectorAll('.section:not(#auth-section)').forEach(section => {
            section.classList.add('hidden');
        });
    }

    showMainApp() {
        document.getElementById('auth-section').classList.add('hidden');
        this.showSection('dashboard');
        this.updateUserDisplay();
        this.loadDashboardData();
    }

    updateUserDisplay() {
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay && this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username;
        }
    }

    // Navigation Methods
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`${sectionName}-section`)?.classList.remove('hidden');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'wallets':
                this.loadWallets();
                break;
            case 'market':
                this.loadMarketData();
                break;
        }
    }

    // Dashboard Methods
    async loadDashboardData() {
        try {
            await this.loadWallets();
            this.updateDashboardStats();
            this.createCharts();
            this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats() {
        const totalWallets = this.wallets.length;
        const totalKeys = this.wallets.reduce((sum, wallet) => sum + wallet.keys_count, 0);
        const totalAddresses = this.wallets.reduce((sum, wallet) => sum + wallet.addresses_count, 0);
        const encryptedWallets = this.wallets.filter(wallet => wallet.is_encrypted).length;

        document.getElementById('total-wallets').textContent = totalWallets;
        document.getElementById('total-keys').textContent = totalKeys;
        document.getElementById('total-addresses').textContent = totalAddresses;
        document.getElementById('encrypted-wallets').textContent = encryptedWallets;
    }

    createCharts() {
        this.createWalletTypeChart();
        this.createActivityChart();
    }

    createWalletTypeChart() {
        const ctx = document.getElementById('walletTypeChart');
        if (!ctx) return;

        const walletTypes = {};
        this.wallets.forEach(wallet => {
            walletTypes[wallet.wallet_type] = (walletTypes[wallet.wallet_type] || 0) + 1;
        });

        if (this.charts.walletType) {
            this.charts.walletType.destroy();
        }

        this.charts.walletType = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(walletTypes),
                datasets: [{
                    data: Object.values(walletTypes),
                    backgroundColor: [
                        '#00d4ff',
                        '#0099cc',
                        '#00ff88',
                        '#ffaa00',
                        '#ff4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#b3b3b3',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Generate mock activity data
        const days = 7;
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
            data.push(Math.floor(Math.random() * 10) + 1);
        }

        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Atividade',
                    data: data,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    },
                    y: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    }
                }
            }
        });
    }

    loadRecentActivity() {
        const activityList = document.getElementById('recent-activity');
        if (!activityList) return;

        const activities = [
            {
                icon: 'fas fa-upload',
                title: 'Carteira importada',
                description: 'Bitcoin Core wallet.dat',
                time: '2 horas atrás'
            },
            {
                icon: 'fas fa-key',
                title: 'Chaves analisadas',
                description: '15 chaves privadas encontradas',
                time: '4 horas atrás'
            },
            {
                icon: 'fas fa-shield-alt',
                title: 'Auditoria de segurança',
                description: 'Carteira Ethereum verificada',
                time: '1 dia atrás'
            }
        ];

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    // Wallet Methods
    async loadWallets() {
        try {
            const response = await fetch('/api/wallets');
            if (response.ok) {
                this.wallets = await response.json();
                this.displayWallets();
            }
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.wallets = [];
        }
    }

    displayWallets() {
        const walletsGrid = document.getElementById('wallets-grid');
        if (!walletsGrid) return;

        if (this.wallets.length === 0) {
            walletsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <h3>Nenhuma carteira encontrada</h3>
                    <p>Importe sua primeira carteira para começar</p>
                    <button class="btn btn-primary" data-section="import">
                        <i class="fas fa-upload"></i>
                        Importar Carteira
                    </button>
                </div>
            `;
            return;
        }

        walletsGrid.innerHTML = this.wallets.map(wallet => `
            <div class="wallet-card" onclick="app.showWalletDetails(${wallet.id})">
                <div class="wallet-header">
                    <div class="wallet-info">
                        <h3>${wallet.name}</h3>
                        <div class="wallet-type">
                            <i class="fas fa-tag"></i>
                            ${this.formatWalletType(wallet.wallet_type)}
                        </div>
                    </div>
                    <div class="wallet-status">
                        <div class="status-indicator ${wallet.is_encrypted ? 'encrypted' : 'unencrypted'}"></div>
                        <span>${wallet.is_encrypted ? 'Criptografada' : 'Não Criptografada'}</span>
                    </div>
                </div>
                <div class="wallet-stats">
                    <div class="wallet-stat">
                        <h4>${wallet.keys_count}</h4>
                        <p>Chaves</p>
                    </div>
                    <div class="wallet-stat">
                        <h4>${wallet.addresses_count}</h4>
                        <p>Endereços</p>
                    </div>
                    <div class="wallet-stat">
                        <h4>${this.formatFileSize(wallet.file_size)}</h4>
                        <p>Tamanho</p>
                    </div>
                </div>
                <div class="wallet-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.analyzeWallet(${wallet.id})">
                        <i class="fas fa-microscope"></i>
                        Analisar
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.generateAddress(${wallet.id})">
                        <i class="fas fa-plus"></i>
                        Endereço
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatWalletType(type) {
        const types = {
            'bitcoin_core': 'Bitcoin Core',
            'electrum': 'Electrum',
            'ethereum_keystore': 'Ethereum',
            'berkeley_db': 'Berkeley DB'
        };
        return types[type] || type;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Import Methods
    handleFileSelect(file) {
        const fileInfo = document.getElementById('file-info');
        const importForm = document.getElementById('import-form');
        const dropzone = document.getElementById('dropzone');

        // Display file information
        fileInfo.innerHTML = `
            <h4><i class="fas fa-file"></i> ${file.name}</h4>
            <p>Tamanho: ${this.formatFileSize(file.size)}</p>
            <p>Tipo: ${file.type || 'Desconhecido'}</p>
            <p>Última modificação: ${new Date(file.lastModified).toLocaleString('pt-BR')}</p>
        `;

        // Show import form
        importForm.classList.remove('hidden');
        dropzone.style.display = 'none';

        // Set default wallet name
        const walletNameInput = document.getElementById('wallet-name');
        walletNameInput.value = file.name.replace(/\.[^/.]+$/, '');

        this.selectedFile = file;
    }

    async handleWalletImport() {
        if (!this.selectedFile) {
            this.showToast('error', 'Erro', 'Nenhum arquivo selecionado');
            return;
        }

        const walletName = document.getElementById('wallet-name').value;
        const walletPassword = document.getElementById('wallet-password').value;

        if (!walletName) {
            this.showToast('error', 'Erro', 'Nome da carteira é obrigatório');
            return;
        }

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('name', walletName);
        if (walletPassword) {
            formData.append('password', walletPassword);
        }

        try {
            const response = await fetch('/api/wallets/upload', {
                method: 'POST',
                credentials: 'include', // Importante para incluir cookies de sessão
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('success', 'Sucesso', 'Carteira importada com sucesso!');
                this.resetImportForm();
                this.loadWallets();
                this.showSection('wallets');
            } else {
                this.showToast('error', 'Erro', data.message || 'Erro na importação');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    resetImportForm() {
        const importForm = document.getElementById('import-form');
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('wallet-file');

        importForm.classList.add('hidden');
        dropzone.style.display = 'block';
        fileInput.value = '';
        importForm.reset();
        this.selectedFile = null;
    }

    // Wallet Detail Methods
    async showWalletDetails(walletId) {
        try {
            const response = await fetch(`/api/crypto/wallet-info/${walletId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const walletInfo = await response.json();
                this.displayWalletModal(walletInfo);
            } else {
                this.showToast('error', 'Erro', 'Erro ao carregar detalhes da carteira');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    displayWalletModal(walletInfo) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = `Detalhes: ${walletInfo.name}`;

        modalBody.innerHTML = `
            <div class="wallet-details">
                <div class="detail-section">
                    <h4>Informações Básicas</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Nome:</label>
                            <span>${walletInfo.name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Tipo:</label>
                            <span>${this.formatWalletType(walletInfo.type)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status ${walletInfo.status}">${walletInfo.status}</span>
                        </div>
                        <div class="detail-item">
                            <label>Criptografada:</label>
                            <span>${walletInfo.is_encrypted ? 'Sim' : 'Não'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Estatísticas</h4>
                    <div class="stats-row">
                        <div class="stat-box">
                            <h3>${walletInfo.keys_count}</h3>
                            <p>Chaves</p>
                        </div>
                        <div class="stat-box">
                            <h3>${walletInfo.addresses_count}</h3>
                            <p>Endereços</p>
                        </div>
                        <div class="stat-box">
                            <h3>${this.formatFileSize(walletInfo.file_size)}</h3>
                            <p>Tamanho</p>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Ações</h4>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="app.generateAddress(${walletInfo.id})">
                            <i class="fas fa-plus"></i>
                            Gerar Endereço
                        </button>
                        <button class="btn btn-secondary" onclick="app.analyzeWallet(${walletInfo.id})">
                            <i class="fas fa-microscope"></i>
                            Análise Avançada
                        </button>
                        <button class="btn btn-secondary" onclick="app.backupWallet(${walletInfo.id})">
                            <i class="fas fa-download"></i>
                            Backup
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.showModal();
    }

    async generateAddress(walletId) {
        try {
            const response = await fetch(`/api/crypto/generate-address/${walletId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                this.showToast('success', 'Endereço Gerado', `Novo endereço: ${data.address}`);
            } else {
                this.showToast('error', 'Erro', 'Erro ao gerar endereço');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    async analyzeWallet(walletId) {
        this.showSection('analysis');
        // Implement wallet analysis logic
        this.showToast('info', 'Análise', 'Iniciando análise da carteira...');
    }

    async backupWallet(walletId) {
        try {
            const response = await fetch(`/api/crypto/backup-wallet/${walletId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                this.showToast('success', 'Backup', 'Backup criado com sucesso!');
            } else {
                this.showToast('error', 'Erro', 'Erro ao criar backup');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    // Analysis Methods
    showAddressExplorer() {
        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.innerHTML = `
            <div class="analysis-tool">
                <h3><i class="fas fa-search"></i> Explorador de Endereços</h3>
                <div class="tool-form">
                    <div class="form-group">
                        <label>Endereço:</label>
                        <input type="text" id="address-input" placeholder="Digite um endereço Bitcoin ou Ethereum">
                    </div>
                    <div class="form-group">
                        <label>Rede:</label>
                        <select id="network-select">
                            <option value="bitcoin">Bitcoin</option>
                            <option value="ethereum">Ethereum</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="app.exploreAddress()">
                        <i class="fas fa-search"></i>
                        Explorar
                    </button>
                </div>
                <div id="address-results" class="results-container"></div>
            </div>
        `;
    }

    async exploreAddress() {
        const address = document.getElementById('address-input').value;
        const network = document.getElementById('network-select').value;
        const resultsContainer = document.getElementById('address-results');

        if (!address) {
            this.showToast('error', 'Erro', 'Digite um endereço válido');
            return;
        }

        try {
            const response = await fetch('/api/crypto/explore-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, network })
            });

            if (response.ok) {
                const data = await response.json();
                resultsContainer.innerHTML = `
                    <div class="address-info">
                        <h4>Informações do Endereço</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Endereço:</label>
                                <span class="address-text">${data.address}</span>
                            </div>
                            <div class="info-item">
                                <label>Rede:</label>
                                <span>${data.network}</span>
                            </div>
                            <div class="info-item">
                                <label>Saldo:</label>
                                <span>${data.balance || 0} ${network.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                this.showToast('error', 'Erro', 'Erro ao explorar endereço');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    showPortfolioAnalysis() {
        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.innerHTML = `
            <div class="analysis-tool">
                <h3><i class="fas fa-chart-pie"></i> Análise de Portfólio</h3>
                <p>Selecione uma carteira para analisar seu portfólio:</p>
                <div class="wallet-selector">
                    ${this.wallets.map(wallet => `
                        <div class="wallet-option" onclick="app.analyzePortfolio(${wallet.id})">
                            <i class="fas fa-wallet"></i>
                            <span>${wallet.name}</span>
                            <small>${this.formatWalletType(wallet.wallet_type)}</small>
                        </div>
                    `).join('')}
                </div>
                <div id="portfolio-results" class="results-container"></div>
            </div>
        `;
    }

    async analyzePortfolio(walletId) {
        const resultsContainer = document.getElementById('portfolio-results');
        
        try {
            const response = await fetch(`/api/crypto/portfolio-analysis/${walletId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                resultsContainer.innerHTML = `
                    <div class="portfolio-analysis">
                        <h4>Análise de Portfólio</h4>
                        <div class="portfolio-summary">
                            <div class="summary-item">
                                <h3>$${data.portfolio.total_value_usd.toFixed(2)}</h3>
                                <p>Valor Total (USD)</p>
                            </div>
                            <div class="summary-item">
                                <h3>R$${data.portfolio.total_value_brl.toFixed(2)}</h3>
                                <p>Valor Total (BRL)</p>
                            </div>
                            <div class="summary-item">
                                <h3>${data.portfolio.addresses_analyzed}</h3>
                                <p>Endereços Analisados</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                this.showToast('error', 'Erro', 'Erro na análise de portfólio');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    showSecurityAudit() {
        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.innerHTML = `
            <div class="analysis-tool">
                <h3><i class="fas fa-shield-alt"></i> Auditoria de Segurança</h3>
                <p>Selecione uma carteira para auditoria de segurança:</p>
                <div class="wallet-selector">
                    ${this.wallets.map(wallet => `
                        <div class="wallet-option" onclick="app.auditSecurity(${wallet.id})">
                            <i class="fas fa-wallet"></i>
                            <span>${wallet.name}</span>
                            <small>${wallet.is_encrypted ? 'Criptografada' : 'Não Criptografada'}</small>
                        </div>
                    `).join('')}
                </div>
                <div id="security-results" class="results-container"></div>
            </div>
        `;
    }

    async auditSecurity(walletId) {
        const resultsContainer = document.getElementById('security-results');
        
        try {
            const response = await fetch(`/api/crypto/security-audit/${walletId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                resultsContainer.innerHTML = `
                    <div class="security-audit">
                        <h4>Auditoria de Segurança</h4>
                        <div class="security-score">
                            <div class="score-circle ${data.security_level}">
                                <span>${data.security_score}/100</span>
                            </div>
                            <div class="score-info">
                                <h3>Nível: ${data.security_level.toUpperCase()}</h3>
                                <p>Pontuação de segurança</p>
                            </div>
                        </div>
                        <div class="recommendations">
                            <h4>Recomendações:</h4>
                            <ul>
                                ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                this.showToast('error', 'Erro', 'Erro na auditoria de segurança');
            }
        } catch (error) {
            this.showToast('error', 'Erro', 'Erro de conexão');
        }
    }

    // Market Methods
    async loadMarketData() {
        try {
            const response = await fetch('/api/crypto/market-data');
            if (response.ok) {
                const data = await response.json();
                this.displayMarketData(data);
            }
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    displayMarketData(data) {
        const marketPrices = document.getElementById('market-prices');
        if (!marketPrices) return;

        const prices = Object.entries(data.prices).map(([symbol, priceData]) => ({
            symbol,
            name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
            ...priceData
        }));

        marketPrices.innerHTML = prices.map(crypto => `
            <div class="price-card">
                <div class="price-header">
                    <div class="crypto-icon">
                        <i class="fab fa-${crypto.symbol === 'bitcoin' ? 'bitcoin' : 'ethereum'}"></i>
                    </div>
                    <div class="price-info">
                        <h3>${crypto.name}</h3>
                        <p>${crypto.symbol.toUpperCase()}</p>
                    </div>
                </div>
                <div class="price-value">$${crypto.usd.toLocaleString()}</div>
                <div class="price-change">
                    <span class="trend ${crypto.usd_24h_change >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${crypto.usd_24h_change >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(crypto.usd_24h_change).toFixed(2)}%
                    </span>
                    <span>24h</span>
                </div>
            </div>
        `).join('');

        // Update market stats
        document.getElementById('total-market-cap').textContent = `$${(data.total_market_cap / 1e12).toFixed(1)}T`;
        document.getElementById('total-volume').textContent = `$${(data.total_volume_24h / 1e9).toFixed(0)}B`;
        document.getElementById('btc-dominance').textContent = `${data.bitcoin_dominance}%`;
    }

    // Modal Methods
    showModal() {
        const modal = document.getElementById('wallet-modal');
        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('wallet-modal');
        modal.classList.remove('show');
    }

    // Toast Methods
    showToast(type, title, message) {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="toast-close" onclick="app.closeToast('${toastId}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.closeToast(toastId);
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CryptoWalletApp();
});

// Add some additional CSS for new components
const additionalStyles = `
<style>
.wallet-details {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.detail-section h4 {
    margin-bottom: 1rem;
    color: var(--accent-primary);
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.detail-item label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.detail-item span {
    font-weight: 500;
}

.stats-row {
    display: flex;
    gap: 2rem;
}

.stat-box {
    text-align: center;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    flex: 1;
}

.stat-box h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--accent-primary);
}

.action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.wallet-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.wallet-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition);
    text-align: center;
}

.wallet-option:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
}

.wallet-option i {
    font-size: 2rem;
    color: var(--accent-primary);
}

.wallet-option span {
    font-weight: 600;
}

.wallet-option small {
    color: var(--text-secondary);
}

.results-container {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
}

.tool-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

.address-info {
    background: var(--bg-tertiary);
    padding: 2rem;
    border-radius: var(--radius-md);
}

.info-grid {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-card);
    border-radius: var(--radius-sm);
}

.address-text {
    font-family: monospace;
    font-size: 0.9rem;
    word-break: break-all;
}

.portfolio-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-top: 1rem;
}

.summary-item {
    text-align: center;
    padding: 1.5rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
}

.summary-item h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--accent-primary);
}

.security-audit {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.security-score {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.score-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    border: 4px solid;
}

.score-circle.high {
    border-color: var(--success);
    background: rgba(0, 255, 136, 0.1);
    color: var(--success);
}

.score-circle.medium {
    border-color: var(--warning);
    background: rgba(255, 170, 0, 0.1);
    color: var(--warning);
}

.score-circle.low {
    border-color: var(--error);
    background: rgba(255, 68, 68, 0.1);
    color: var(--error);
}

.recommendations ul {
    list-style: none;
    padding: 0;
}

.recommendations li {
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    border-left: 3px solid var(--accent-primary);
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
}

.empty-state i {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: var(--text-muted);
}

.empty-state h3 {
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

