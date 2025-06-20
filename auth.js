// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadUserProfile();
            this.updateUI();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.updateUI();
                this.hideLoginModal();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userProfile = null;
                this.isAdmin = false;
                this.updateUI();
            }
        });
    }

    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            // Use AdminUtils to ensure user profile exists
            const profile = await AdminUtils.ensureUserProfile(this.currentUser.id, this.currentUser.email);
            
            if (profile) {
                this.userProfile = profile;
                this.isAdmin = profile.role === 'admin';
                console.log('User profile loaded:', { email: profile.email, role: profile.role, isAdmin: this.isAdmin });
            } else {
                console.error('Failed to load or create user profile');
                this.userProfile = null;
                this.isAdmin = false;
            }
        } catch (error) {
            console.error('Error in loadUserProfile:', error);
            this.userProfile = null;
            this.isAdmin = false;
        }
    }

    async createUserProfile() {
        if (!this.currentUser) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        id: this.currentUser.id,
                        email: this.currentUser.email,
                        role: 'user',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Error creating user profile:', error);
                // If error is due to duplicate key, try to fetch existing profile
                if (error.code === '23505') {
                    await this.loadUserProfile();
                }
            } else {
                this.userProfile = data;
                this.isAdmin = data.role === 'admin';
                console.log('User profile created:', { email: data.email, role: data.role });
            }
        } catch (error) {
            console.error('Error in createUserProfile:', error);
        }
    }

    updateUI() {
        const loginNavItem = document.getElementById('loginNavItem');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const profileNavItem = document.getElementById('profileNavItem');
        const adminNavItem = document.getElementById('adminNavItem');

        if (this.currentUser) {
            // User is logged in
            loginNavItem?.classList.add('d-none');
            logoutNavItem?.classList.remove('d-none');
            profileNavItem?.classList.remove('d-none');

            // Show admin panel if user is admin
            if (this.isAdmin) {
                adminNavItem?.classList.remove('d-none');
            } else {
                adminNavItem?.classList.add('d-none');
            }
        } else {
            // User is not logged in
            loginNavItem?.classList.remove('d-none');
            logoutNavItem?.classList.add('d-none');
            profileNavItem?.classList.add('d-none');
            adminNavItem?.classList.add('d-none');
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async register(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    hideLoginModal() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            const modal = bootstrap.Modal.getInstance(loginModal);
            if (modal) {
                modal.hide();
            }
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isUserAdmin() {
        return this.isAdmin;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProfile() {
        return this.userProfile;
    }
}

// Initialize auth manager
const authManager = new AuthManager();
// Make it globally available
window.authManager = authManager;

// Global functions for UI
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

async function logout() {
    const result = await authManager.logout();
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        alert('Errore durante il logout: ' + result.error);
    }
}

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await authManager.login(email, password);
            if (!result.success) {
                alert('Errore durante il login: ' + result.error);
            }
        });
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Le password non coincidono');
                return;
            }
            
            const result = await authManager.register(email, password);
            if (result.success) {
                alert('Registrazione completata! Controlla la tua email per confermare l\'account.');
            } else {
                alert('Errore durante la registrazione: ' + result.error);
            }
        });
    }
});
