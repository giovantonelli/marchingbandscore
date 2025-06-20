// Profile Page Management
class ProfileManager {
    constructor() {
        this.userOrders = [];
        this.purchasedScores = [];
        this.init();
    }

    async init() {
        // Wait for auth to initialize
        await this.waitForAuth();
        
        // Check if user is authenticated
        if (!authManager.isAuthenticated()) {
            this.showAccessDenied();
            return;
        }

        // Load profile data
        this.showProfileDashboard();
        await this.loadProfileData();
    }

    async waitForAuth() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!authManager && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!authManager) {
            this.showAccessDenied();
            return;
        }

        // Wait for auth to fully load
        attempts = 0;
        while (!authManager.currentUser && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    showAccessDenied() {
        document.getElementById('profileLoading').classList.add('d-none');
        document.getElementById('accessDenied').classList.remove('d-none');
        document.getElementById('profileDashboard').classList.add('d-none');
    }

    showProfileDashboard() {
        document.getElementById('profileLoading').classList.add('d-none');
        document.getElementById('accessDenied').classList.add('d-none');
        document.getElementById('profileDashboard').classList.remove('d-none');
    }

    async loadProfileData() {
        try {
            await Promise.all([
                this.loadUserInfo(),
                this.loadPurchasedScores(),
                this.loadOrderHistory()
            ]);
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showError('Errore nel caricamento dei dati del profilo');
        }
    }

    async loadUserInfo() {
        try {
            const user = authManager.getCurrentUser();
            const profile = authManager.getUserProfile();

            if (user) {
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('profileEmail').textContent = user.email;
                document.getElementById('profileRole').textContent = profile?.role || 'user';
                
                if (profile?.created_at) {
                    document.getElementById('profileDate').textContent = 
                        new Date(profile.created_at).toLocaleDateString();
                }
            }

            // Show admin nav if user is admin
            if (authManager.isUserAdmin()) {
                document.getElementById('adminNavItem')?.classList.remove('d-none');
            }

        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async loadPurchasedScores() {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(
                        *,
                        scores(*)
                    )
                `)
                .eq('user_id', authManager.getCurrentUser().id)
                .eq('status', 'completed');

            if (error) throw error;

            // Extract all purchased scores
            this.purchasedScores = [];
            let totalSpent = 0;

            orders.forEach(order => {
                totalSpent += parseFloat(order.total_amount);
                order.order_items.forEach(item => {
                    this.purchasedScores.push({
                        ...item.scores,
                        purchaseDate: order.created_at,
                        orderId: order.id
                    });
                });
            });

            // Update stats
            document.getElementById('purchasedCount').textContent = this.purchasedScores.length;
            document.getElementById('totalSpent').textContent = totalSpent.toFixed(2);

            // Render purchased scores
            this.renderPurchasedScores();

        } catch (error) {
            console.error('Error loading purchased scores:', error);
            this.showError('Errore nel caricamento degli spartiti acquistati');
        }
    }

    renderPurchasedScores() {
        const container = document.getElementById('purchasedScores');
        
        if (this.purchasedScores.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Non hai ancora acquistato nessuno spartito.
                    <br><a href="index.html" class="alert-link">Esplora i nostri spartiti</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.purchasedScores.map(score => `
            <div class="purchased-score">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <div class="score-image">
                            ${score.cover_url ? 
                                `<img src="${score.cover_url}" alt="${score.title}" class="img-fluid rounded" style="width: 80px; height: 80px; object-fit: cover;">` :
                                `<div class="text-center p-3 bg-light rounded"><i class="fas fa-music fa-2x text-muted"></i></div>`
                            }
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h5>${this.escapeHtml(score.title)}</h5>
                        <p class="text-muted mb-1">${this.escapeHtml(score.composer || 'Compositore sconosciuto')}</p>
                        <small class="text-muted">Acquistato il ${new Date(score.purchaseDate).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="badge bg-success">€${score.price}</span>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-success btn-sm w-100" onclick="profileManager.downloadScore(${score.id})">
                            <i class="fas fa-download me-1"></i>Scarica
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadOrderHistory() {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', authManager.getCurrentUser().id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.userOrders = orders;

            const tbody = document.getElementById('orderHistoryBody');
            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">
                            <i class="fas fa-info-circle me-2"></i>
                            Nessun ordine trovato
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                    <td>#${order.id}</td>
                    <td>€${order.total_amount}</td>
                    <td>
                        <span class="status-badge status-${order.status}">
                            ${order.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="profileManager.showOrderDetails(${order.id})">
                            <i class="fas fa-eye me-1"></i>Dettagli
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading order history:', error);
            this.showError('Errore nel caricamento della cronologia ordini');
        }
    }

    async showOrderDetails(orderId) {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items(
                        *,
                        scores(title, composer, price)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            const modalBody = document.getElementById('orderDetailsBody');
            modalBody.innerHTML = `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h6>Informazioni Ordine</h6>
                        <p><strong>ID Ordine:</strong> #${order.id}</p>
                        <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        <p><strong>Stato:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                        <p><strong>Totale:</strong> €${order.total_amount}</p>
                    </div>
                </div>
                
                <h6>Spartiti Acquistati</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Spartito</th>
                                <th>Compositore</th>
                                <th>Prezzo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.order_items.map(item => `
                                <tr>
                                    <td>${this.escapeHtml(item.scores.title)}</td>
                                    <td>${this.escapeHtml(item.scores.composer || 'N/A')}</td>
                                    <td>€${item.price}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            modal.show();

        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Errore nel caricamento dei dettagli dell\'ordine');
        }
    }

    async downloadScore(scoreId) {
        try {
            // Find the score in purchased scores
            const score = this.purchasedScores.find(s => s.id === scoreId);
            if (!score || !score.pdf_url) {
                throw new Error('File PDF non disponibile');
            }

            // Generate signed URL for download
            const { data, error } = await supabase.storage
                .from('scores')
                .createSignedUrl(score.pdf_url, 3600); // 1 hour expiry

            if (error) {
                throw error;
            }

            // Download the file
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = `${score.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error downloading score:', error);
            this.showError('Errore durante il download: ' + error.message);
        }
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});
