// Admin setup utility - run this in browser console after login
async function setupAdmin(email) {
    try {
        console.log('Setting up admin for:', email);
        
        // Update user role to admin
        const { data, error } = await supabase
            .from('users')
            .update({ 
                role: 'admin',
                updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select();

        if (error) {
            console.error('Error setting admin role:', error);
            return false;
        }

        console.log('Admin role set successfully:', data);
        
        // Force reload auth manager
        if (window.authManager) {
            await window.authManager.loadUserProfile();
        }
        
        // Refresh page to update UI
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('Error in setupAdmin:', error);
        return false;
    }
}

// Usage: setupAdmin('your-email@example.com')
console.log('Admin setup utility loaded. Usage: setupAdmin("your-email@example.com")');