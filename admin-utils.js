// Admin utilities for role management and database setup
class AdminUtils {
    static async ensureUserProfile(userId, email) {
        try {
            // Check if user profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (!existingProfile) {
                // Create user profile
                const { data: newProfile, error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            id: userId,
                            email: email,
                            role: 'user',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();

                if (insertError) {
                    throw insertError;
                }

                return newProfile;
            }

            return existingProfile;
        } catch (error) {
            console.error('Error ensuring user profile:', error);
            return null;
        }
    }

    static async checkAdminRole(userId) {
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error checking admin role:', error);
                return false;
            }

            return profile?.role === 'admin';
        } catch (error) {
            console.error('Error in checkAdminRole:', error);
            return false;
        }
    }

    static async setUserAsAdmin(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({ 
                    role: 'admin',
                    updated_at: new Date().toISOString()
                })
                .eq('email', email)
                .select();

            if (error) {
                throw error;
            }

            console.log('User set as admin:', data);
            return data;
        } catch (error) {
            console.error('Error setting user as admin:', error);
            return null;
        }
    }

    static async createTablesIfNotExist() {
        try {
            // Try to check if tables exist by making a simple query
            const { data, error } = await supabase
                .from('users')
                .select('count', { count: 'exact', head: true });

            if (error && (error.code === '42P01' || error.code === '42501')) {
                // Table doesn't exist or permission denied
                console.log('Database setup required. Please follow the instructions in README-SETUP.md');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Database setup required:', error);
            return false;
        }
    }
}

// Export for global use
window.AdminUtils = AdminUtils;