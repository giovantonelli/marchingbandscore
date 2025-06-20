// Profile Page Management
class ProfileManager {
    constructor() {
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
                this.loadUserInfo()
                // Rimosso: this.loadPurchasedScores(), this.loadOrderHistory()
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
