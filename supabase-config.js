// Supabase Configuration
const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
let supabase;
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
    }
} else {
    console.error('Supabase library not available');
}

// Database table names
const TABLES = {
    SCORES: 'scores',
    USERS: 'users'
};

// Storage bucket names
const STORAGE_BUCKETS = {
    SCORES: 'scores'
};

// Storage folders
const STORAGE_FOLDERS = {
    COVERS: 'covers',
    PDFS: 'pdfs',
    AUDIO: 'audio'
};

// User roles
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

// Export configuration for use in other files
window.supabaseConfig = {
    client: supabase,
    tables: TABLES,
    storage: {
        buckets: STORAGE_BUCKETS,
        folders: STORAGE_FOLDERS
    },
    constants: {
        userRoles: USER_ROLES
    }
};
