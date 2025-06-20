// Main application script
class ScoreApp {
    constructor() {
        this.scores = [];
        this.currentScore = null;
        this.init();
    }

    async init() {
        await this.loadScores();
        this.setupEventListeners();
    }

    async loadScores() {
        try {
            this.showLoading(true);
            
            const { data: scores, error } = await supabase
                .from('scores')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Database error:', error);
                this.showDatabaseSetupMessage();
                this.loadDemoScores();
                return;
            }

            this.scores = scores || [];
            console.log('Scores loaded from database:', this.scores.length);
            this.renderScores();
        } catch (error) {
            console.error('Error loading scores:', error);
            this.showDatabaseSetupMessage();
            this.loadDemoScores();
        } finally {
            this.showLoading(false);
        }
    }
    
    loadDemoScores() {
        // Demo data to show the interface working
        this.scores = [
            {
                id: 1,
                title: "Marcia Trionfale",
                composer: "Giuseppe Verdi",
                description: "Una magnifica marcia per banda musicale con arrangiamenti professionali.",
                price: 15.99,
                category: "marcia",
                cover_url: null,
                audio_url: null,
                preview_url: null
            },
            {
                id: 2,
                title: "Sinfonia della Primavera",
                composer: "Antonio Vivaldi",
                description: "Adattamento per banda dell'opera classica Le Quattro Stagioni.",
                price: 22.50,
                category: "sinfonia",
                cover_url: null,
                audio_url: null,
                preview_url: null
            },
            {
                id: 3,
                title: "Concerto per Tromba",
                composer: "Johann Hummel",
                description: "Splendido concerto solistico per tromba e banda musicale.",
                price: 18.75,
                category: "concerto",
                cover_url: null,
                audio_url: null,
                preview_url: null
            }
        ];
        this.renderScores();
    }

    renderScores() {
        const container = document.getElementById('scoresContainer');
        if (!container) return;

        if (this.scores.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nessuno spartito disponibile al momento
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.scores.map(score => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card score-card h-100">
                    <div class="score-image">
                        ${score.cover_url ? 
                            `<img src="${score.cover_url}" alt="${score.title}" class="card-img-top" style="width: 100%; height: 200px; object-fit: cover;">` :
                            `<i class="fas fa-music"></i>`
                        }
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${this.escapeHtml(score.title)}</h5>
                        <p class="card-text text-muted">${this.escapeHtml(score.composer || 'Compositore sconosciuto')}</p>
                        <p class="card-text">${this.escapeHtml(score.description || 'Nessuna descrizione disponibile')}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="score-price">€${score.price}</span>
                            <button class="btn btn-primary" onclick="app.showScoreDetail(${score.id})">
                                <i class="fas fa-eye me-1"></i>Dettagli
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async showScoreDetail(scoreId) {
        try {
            const score = this.scores.find(s => s.id === scoreId);
            if (!score) return;

            this.currentScore = score;

            // Check if user has purchased this score (only if database is available)
            let hasPurchased = false;
            try {
                hasPurchased = await this.checkUserPurchase(scoreId);
            } catch (error) {
                // Database not available, demo mode
                hasPurchased = false;
            }

            const modal = document.getElementById('scoreModal');
            const modalTitle = document.getElementById('scoreModalTitle');
            const modalBody = document.getElementById('scoreModalBody');
            const modalFooter = document.getElementById('scoreModalFooter');

            modalTitle.textContent = score.title;

            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="score-image mb-3">
                            ${score.cover_url ? 
                                `<img src="${score.cover_url}" alt="${score.title}" class="img-fluid rounded">` :
                                `<div class="text-center p-5 bg-light rounded"><i class="fas fa-music fa-3x text-muted"></i></div>`
                            }
                        </div>
                    </div>
                    <div class="col-md-8">
                        <h6>Compositore</h6>
                        <p>${this.escapeHtml(score.composer || 'Sconosciuto')}</p>
                        
                        <h6>Descrizione</h6>
                        <p>${this.escapeHtml(score.description || 'Nessuna descrizione disponibile')}</p>
                        
                        <h6>Prezzo</h6>
                        <p class="score-price">€${score.price}</p>
                        
                        ${score.audio_url ? `
                            <h6>Anteprima Audio</h6>
                            <div class="audio-player">
                                <audio controls>
                                    <source src="${score.audio_url}" type="audio/mpeg">
                                    Il tuo browser non supporta l'elemento audio.
                                </audio>
                            </div>
                        ` : ''}
                        
                        ${score.preview_url ? `
                            <h6>Anteprima PDF</h6>
                            <div class="preview-section">
                                <iframe src="${score.preview_url}" class="preview-pdf"></iframe>
                            </div>
                        ` : ''}
                        
                        ${document.querySelector('.database-setup-alert') ? `
                            <div class="alert alert-warning mt-3">
                                <i class="fas fa-info-circle me-2"></i>
                                Modalità demo attiva. Le funzioni di acquisto e download richiedono il setup del database.
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // Set up modal footer based on user status and database availability
            const isDemoMode = document.querySelector('.database-setup-alert') !== null;
            
            if (isDemoMode) {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    <button type="button" class="btn btn-outline-primary" disabled>
                        <i class="fas fa-database me-1"></i>Setup Database Richiesto
                    </button>
                `;
            } else if (!authManager.isAuthenticated()) {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    <button type="button" class="btn btn-primary" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt me-1"></i>Accedi per Acquistare
                    </button>
                `;
            } else if (hasPurchased) {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    <button type="button" class="btn btn-success" onclick="app.downloadScore(${scoreId})">
                        <i class="fas fa-download me-1"></i>Scarica
                    </button>
                `;
            } else {
                modalFooter.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    <button type="button" class="btn btn-primary" onclick="app.purchaseScore(${scoreId})">
                        <i class="fas fa-shopping-cart me-1"></i>Acquista €${score.price}
                    </button>
                `;
            }

            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } catch (error) {
            console.error('Error showing score detail:', error);
            this.showError('Errore nel caricamento del dettaglio');
        }
    }

    async checkUserPurchase(scoreId) {
        if (!authManager.isAuthenticated()) return false;

        try {
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    *,
                    orders!inner(*)
                `)
                .eq('score_id', scoreId)
                .eq('orders.user_id', authManager.getCurrentUser().id)
                .eq('orders.status', 'completed');

            if (error) {
                console.error('Error checking purchase:', error);
                return false;
            }

            return data && data.length > 0;
        } catch (error) {
            console.error('Error in checkUserPurchase:', error);
            return false;
        }
    }

    async purchaseScore(scoreId) {
        if (!authManager.isAuthenticated()) {
            showLoginModal();
            return;
        }

        try {
            this.showLoading(true);

            const score = this.scores.find(s => s.id === scoreId);
            if (!score) {
                throw new Error('Spartito non trovato');
            }

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: authManager.getCurrentUser().id,
                        total_amount: score.price,
                        status: 'completed', // Simplified - in real app would integrate with payment
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (orderError) {
                throw orderError;
            }

            // Create order item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert([
                    {
                        order_id: order.id,
                        score_id: scoreId,
                        price: score.price,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (itemError) {
                throw itemError;
            }

            // Close modal and show success message
            const modal = bootstrap.Modal.getInstance(document.getElementById('scoreModal'));
            modal.hide();

            alert('Acquisto completato con successo! Puoi ora scaricare lo spartito dalla tua area personale.');

            // Refresh score detail to show download button
            setTimeout(() => {
                this.showScoreDetail(scoreId);
            }, 500);

        } catch (error) {
            console.error('Error purchasing score:', error);
            this.showError('Errore durante l\'acquisto: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async downloadScore(scoreId) {
        try {
            if (!authManager.isAuthenticated()) {
                showLoginModal();
                return;
            }

            this.showLoading(true);

            const score = this.scores.find(s => s.id === scoreId);
            if (!score || !score.pdf_url) {
                throw new Error('File PDF non disponibile');
            }

            // Check if user has purchased this score
            const hasPurchased = await this.checkUserPurchase(scoreId);
            if (!hasPurchased && !authManager.isUserAdmin()) {
                throw new Error('Devi acquistare lo spartito per scaricarlo');
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
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Refresh scores when auth state changes
        supabase.auth.onAuthStateChange(() => {
            this.loadScores();
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('d-none');
            } else {
                spinner.classList.add('d-none');
            }
        }
    }

    showDatabaseSetupMessage() {
        // Only show message once
        if (document.querySelector('.database-setup-alert')) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info alert-dismissible fade show database-setup-alert';
        alertDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Nuovo Progetto V2:</strong> Esegui il file <code>setup-v2-database.sql</code> nel SQL Editor per configurare il database.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }

    showError(message) {
        // Create and show error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        // Auto-dismiss after 5 seconds
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScoreApp();
});
