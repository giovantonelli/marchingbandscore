
// Main application script
class ScoreApp {
    constructor() {
        this.scores = [];
        this.filteredScores = [];
        this.currentScore = null;
        this.init();
    }

    init() {
        this.loadScores();
    }

    loadScores() {
        // Carica spartiti dal file products.js
        this.scores = PRODUCTS.map(score => {
            return { ...score };
        });
        this.filteredScores = [...this.scores];
        this.renderScores();
    }

    filterScores(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredScores = [...this.scores];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredScores = this.scores.filter(score => 
                score.title.toLowerCase().includes(term) ||
                score.category.toLowerCase().includes(term) ||
                score.composer.toLowerCase().includes(term) ||
                score.description.toLowerCase().includes(term)
            );
        }
        this.renderScores();
    }
    
    renderScores() {
        const container = document.getElementById('scoresContainer');
        if (!container) return;

        if (this.filteredScores.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nessuno spartito trovato per la ricerca corrente
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredScores.map(score => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card score-card h-100 shadow-sm">
                    <div class="score-image position-relative">
                        ${score.cover_url ? 
                            `<img src="${score.cover_url}" alt="${score.title}" class="card-img-top" style="width: 100%; height: 250px; object-fit: cover;">` :
                            `<div class="d-flex align-items-center justify-content-center bg-light" style="height: 250px;"><i class="fas fa-music fa-3x text-muted"></i></div>`
                        }
                        ${score.audio_url ? `
                            <div class="audio-preview-icon" title="Anteprima audio disponibile">
                                <i class="fas fa-volume-up"></i>
                            </div>
                        ` : ''}
                        <div class="position-absolute top-0 end-0 p-3">
                            <span class="badge bg-primary fs-6">€${score.price}</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-3">
                            <span class="badge bg-dark">${this.escapeHtml(score.category || 'Altro')}</span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${this.escapeHtml(score.title)}</h5>
                        <p class="text-muted mb-2">Arrangiamento: ${this.escapeHtml(score.composer || 'Sconosciuto')}</p>
                        <p class="card-text flex-grow-1">${this.truncateText(this.escapeHtml(score.description || 'Nessuna descrizione disponibile'), 100)}</p>
                        
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-star text-warning me-1"></i>
                                <span class="small fw-bold">${score.rating || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary w-100" onclick="app.showScoreDetail(${score.id})">
                            <i class="fas fa-eye me-2"></i>Dettagli
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async showScoreDetail(scoreId) {
        try {
            // Confronto id come stringa per compatibilità
            const score = this.scores.find(s => String(s.id) === String(scoreId));
            if (!score) return;

            this.currentScore = score;

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
                                `<img src="${score.cover_url}" alt="${score.title}" class="img-fluid rounded shadow">` :
                                `<div class="text-center p-5 bg-light rounded"><i class="fas fa-music fa-3x text-muted"></i></div>`
                            }
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">Compositore</h6>
                            <p>${this.escapeHtml(score.composer || 'Sconosciuto')}</p>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">Categoria</h6>
                            <span class="badge bg-secondary">${this.escapeHtml(score.category || 'Altro')}</span>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">Descrizione</h6>
                            <p>${this.escapeHtml(score.description || 'Nessuna descrizione disponibile').replace(/\\n/g, '<br>')}</p>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">Valutazione</h6>
                            <div class="d-flex align-items-center">
                                <div class="me-4">
                                    <i class="fas fa-star text-warning me-1"></i>
                                    <span class="fw-bold">${score.rating || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">Prezzo</h6>
                            <p class="fs-4 fw-bold text-success">€${score.price}</p>
                        </div>
                        
                        ${score.audio_url ? `
                            <div class="mb-3">
                                <h6 class="fw-bold text-primary">Anteprima Audio</h6>
                                <div class="audio-player">
                                    <audio controls class="w-100">
                                        <source src="${score.audio_url}" type="audio/mpeg">
                                        Il tuo browser non supporta l'elemento audio.
                                    </audio>
                                </div>
                            </div>
                        ` : ''}
                        
                        // ...rimosso anteprima PDF preview_url...
                    </div>
                </div>
            `;

            // Footer con tasti Contattami e Chiudi
            modalFooter.innerHTML = `
                <a href='contatti.html' class='btn btn-success'>
                    <i class='fas fa-envelope me-2'></i>Contattami per acquistare
                </a>
                <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Chiudi</button>
            `;

            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } catch (error) {
            console.error('Error showing score detail:', error);
            this.showError('Errore nel caricamento del dettaglio');
        }
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

    showError(message) {
        // Create and show error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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