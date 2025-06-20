// Main application script
class ScoreApp {
    constructor() {
        this.scores = [];
        this.currentScore = null;
        this.init();
    }

    init() {
        this.loadScores();
        // Eventi non più necessari
    }

    loadScores() {
        // Carica spartiti dal file products.js
        this.scores = PRODUCTS.map(score => {
            // Ora cover_url punta già a uploads/
            return { ...score };
        });
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
                        <p class="mb-1"><span class="badge bg-secondary">${this.escapeHtml(score.category || 'Altro')}</span></p>
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

    // Funzione placeholder: acquisto disabilitato
    async startStripeCheckout(scoreId) {
        // Stripe e pagamenti rimossi
        alert('Funzione di acquisto non disponibile.');
    }

    async showScoreDetail(scoreId) {
        try {
            // Confronto id come stringa per compatibilità
            const score = this.scores.find(s => String(s.id) === String(scoreId));
            if (!score) return;

            this.currentScore = score;

            // Rimosso controllo acquisto e logica ordini
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
                    </div>
                </div>
            `;

            // Footer solo chiudi
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
            `;

            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } catch (error) {
            console.error('Error showing score detail:', error);
            this.showError('Errore nel caricamento del dettaglio');
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
