// Admin Panel Management
class AdminManager {
    constructor() {
        this.currentEditScore = null;
        this.init();
    }

    async init() {
        // Wait for auth to initialize
        await this.waitForAuth();
        
        // Check admin access
        await this.checkAdminAccess();
    }

    async waitForAuth() {
        // Wait for auth manager to initialize
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
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

    async checkAdminAccess() {
        try {
            // Check if user is authenticated
            if (!authManager.isAuthenticated()) {
                this.redirectToLogin();
                return;
            }

            // Force reload user profile to ensure we have the latest role information
            await authManager.loadUserProfile();

            // Check if user is admin
            console.log('Checking admin access:', {
                isAuthenticated: authManager.isAuthenticated(),
                isAdmin: authManager.isUserAdmin(),
                userProfile: authManager.getUserProfile()
            });

            if (!authManager.isUserAdmin()) {
                this.showAccessDenied();
                return;
            }

            // User is admin, show dashboard
            this.showAdminDashboard();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error checking admin access:', error);
            this.showAccessDenied();
        }
    }

    redirectToLogin() {
        alert('Devi essere autenticato per accedere al pannello admin.');
        window.location.href = 'index.html';
    }

    showAccessDenied() {
        document.getElementById('adminLoading').classList.add('d-none');
        document.getElementById('accessDenied').classList.remove('d-none');
        document.getElementById('adminDashboard').classList.add('d-none');
    }

    showAdminDashboard() {
        document.getElementById('adminLoading').classList.add('d-none');
        document.getElementById('accessDenied').classList.add('d-none');
        document.getElementById('adminDashboard').classList.remove('d-none');
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadScores(),
                this.loadOrders(),
                this.loadUsers()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Errore nel caricamento dei dati del dashboard');
        }
    }

    async loadStats() {
        try {
            // Load scores count
            const { count: scoresCount } = await supabase
                .from('scores')
                .select('*', { count: 'exact', head: true });

            // Load orders count
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            // Load users count
            const { count: usersCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            // Load total revenue
            const { data: revenueData } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('status', 'completed');

            const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

            // Update stats display
            document.getElementById('totalScores').textContent = scoresCount || 0;
            document.getElementById('totalOrders').textContent = ordersCount || 0;
            document.getElementById('totalUsers').textContent = usersCount || 0;
            document.getElementById('totalRevenue').textContent = `€${totalRevenue.toFixed(2)}`;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadScores() {
        try {
            const { data: scores, error } = await supabase
                .from('scores')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tbody = document.getElementById('scoresTableBody');
            tbody.innerHTML = scores.map(score => `
                <tr>
                    <td>${score.id}</td>
                    <td>${this.escapeHtml(score.title)}</td>
                    <td>${this.escapeHtml(score.composer || 'N/A')}</td>
                    <td>€${score.price}</td>
                    <td>${new Date(score.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="adminManager.editScore(${score.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteScore(${score.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading scores:', error);
            this.showError('Errore nel caricamento degli spartiti');
        }
    }

    async loadOrders() {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users(email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tbody = document.getElementById('ordersTableBody');
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.id}</td>
                    <td>${this.escapeHtml(order.users?.email || 'N/A')}</td>
                    <td>€${order.total_amount}</td>
                    <td>
                        <span class="status-badge status-${order.status}">
                            ${order.status}
                        </span>
                    </td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="adminManager.viewOrderDetails(${order.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Errore nel caricamento degli ordini');
        }
    }

    async loadUsers() {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>
                        <select class="form-select form-select-sm" onchange="adminManager.updateUserRole('${user.id}', this.value)">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="adminManager.resetUserPassword('${user.id}')">
                            <i class="fas fa-key"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Errore nel caricamento degli utenti');
        }
    }

    async submitScore(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData();
            const title = document.getElementById('scoreTitle').value;
            const composer = document.getElementById('scoreComposer').value;
            const description = document.getElementById('scoreDescription').value;
            const price = parseFloat(document.getElementById('scorePrice').value);
            const category = document.getElementById('scoreCategory').value;
            
            const coverFile = document.getElementById('scoreCover').files[0];
            const pdfFile = document.getElementById('scorePdf').files[0];
            const audioFile = document.getElementById('scoreAudio').files[0];

            if (!title || !price || !pdfFile) {
                throw new Error('Titolo, prezzo e file PDF sono obbligatori');
            }

            let coverUrl = null;
            let pdfUrl = null;
            let audioUrl = null;

            // Upload cover image
            if (coverFile) {
                const coverPath = `${STORAGE_FOLDERS.COVERS}/${Date.now()}_${coverFile.name}`;
                const { error: coverError } = await supabase.storage
                    .from(STORAGE_BUCKETS.SCORES)
                    .upload(coverPath, coverFile);

                if (coverError) throw coverError;
                
                const { data: coverUrlData } = supabase.storage
                    .from(STORAGE_BUCKETS.SCORES)
                    .getPublicUrl(coverPath);
                
                coverUrl = coverUrlData.publicUrl;
            }

            // Upload PDF
            const pdfPath = `${STORAGE_FOLDERS.PDFS}/${Date.now()}_${pdfFile.name}`;
            const { error: pdfError } = await supabase.storage
                .from(STORAGE_BUCKETS.SCORES)
                .upload(pdfPath, pdfFile);

            if (pdfError) throw pdfError;
            pdfUrl = pdfPath; // Store relative path for signed URLs

            // Upload audio
            if (audioFile) {
                const audioPath = `${STORAGE_FOLDERS.AUDIO}/${Date.now()}_${audioFile.name}`;
                const { error: audioError } = await supabase.storage
                    .from(STORAGE_BUCKETS.SCORES)
                    .upload(audioPath, audioFile);

                if (audioError) throw audioError;
                
                const { data: audioUrlData } = supabase.storage
                    .from(STORAGE_BUCKETS.SCORES)
                    .getPublicUrl(audioPath);
                
                audioUrl = audioUrlData.publicUrl;
            }

            // Create score record
            const { error: scoreError } = await supabase
                .from('scores')
                .insert([
                    {
                        title,
                        composer,
                        description,
                        price,
                        category,
                        cover_url: coverUrl,
                        pdf_url: pdfUrl,
                        audio_url: audioUrl,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]);

            if (scoreError) throw scoreError;

            alert('Spartito aggiunto con successo!');
            this.resetScoreForm();
            await this.loadScores();
            await this.loadStats();

        } catch (error) {
            console.error('Error adding score:', error);
            this.showError('Errore nell\'aggiunta dello spartito: ' + error.message);
        }
    }

    resetScoreForm() {
        document.getElementById('scoreForm').reset();
    }

    async editScore(scoreId) {
        try {
            const { data: score, error } = await supabase
                .from('scores')
                .select('*')
                .eq('id', scoreId)
                .single();

            if (error) throw error;

            this.currentEditScore = score;

            // Populate edit form
            document.getElementById('editScoreId').value = score.id;
            document.getElementById('editScoreTitle').value = score.title;
            document.getElementById('editScoreComposer').value = score.composer || '';
            document.getElementById('editScoreDescription').value = score.description || '';
            document.getElementById('editScorePrice').value = score.price;
            document.getElementById('editScoreCategory').value = score.category || '';

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('editScoreModal'));
            modal.show();

        } catch (error) {
            console.error('Error loading score for edit:', error);
            this.showError('Errore nel caricamento dello spartito per la modifica');
        }
    }

    async updateScore() {
        try {
            const scoreId = document.getElementById('editScoreId').value;
            const title = document.getElementById('editScoreTitle').value;
            const composer = document.getElementById('editScoreComposer').value;
            const description = document.getElementById('editScoreDescription').value;
            const price = parseFloat(document.getElementById('editScorePrice').value);
            const category = document.getElementById('editScoreCategory').value;

            const { error } = await supabase
                .from('scores')
                .update({
                    title,
                    composer,
                    description,
                    price,
                    category,
                    updated_at: new Date().toISOString()
                })
                .eq('id', scoreId);

            if (error) throw error;

            alert('Spartito aggiornato con successo!');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editScoreModal'));
            modal.hide();

            await this.loadScores();
            await this.loadStats();

        } catch (error) {
            console.error('Error updating score:', error);
            this.showError('Errore nell\'aggiornamento dello spartito: ' + error.message);
        }
    }

    async deleteScore(scoreId) {
        if (!confirm('Sei sicuro di voler eliminare questo spartito?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('scores')
                .delete()
                .eq('id', scoreId);

            if (error) throw error;

            alert('Spartito eliminato con successo!');
            await this.loadScores();
            await this.loadStats();

        } catch (error) {
            console.error('Error deleting score:', error);
            this.showError('Errore nell\'eliminazione dello spartito: ' + error.message);
        }
    }

    async updateUserRole(userId, newRole) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            alert('Ruolo utente aggiornato con successo!');
            await this.loadUsers();

        } catch (error) {
            console.error('Error updating user role:', error);
            this.showError('Errore nell\'aggiornamento del ruolo utente: ' + error.message);
        }
    }

    async viewOrderDetails(orderId) {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users(email),
                    order_items(
                        *,
                        scores(title, composer, price)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            const details = `
                Ordine ID: ${order.id}
                Utente: ${order.users?.email || 'N/A'}
                Totale: €${order.total_amount}
                Stato: ${order.status}
                Data: ${new Date(order.created_at).toLocaleString()}
                
                Spartiti:
                ${order.order_items.map(item => 
                    `- ${item.scores.title} (${item.scores.composer}) - €${item.price}`
                ).join('\n')}
            `;

            alert(details);

        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Errore nel caricamento dei dettagli dell\'ordine');
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

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
    
    // Set up form event listeners
    const scoreForm = document.getElementById('scoreForm');
    if (scoreForm) {
        scoreForm.addEventListener('submit', (e) => adminManager.submitScore(e));
    }
});
