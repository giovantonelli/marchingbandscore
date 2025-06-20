// Supabase Configuration
const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || 'SUPABASE_URL_PLACEHOLDER';
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY_PLACEHOLDER';

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
    USERS: 'users',
    ORDERS: 'orders',
    ORDER_ITEMS: 'order_items'
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

// Order statuses
const ORDER_STATUSES = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed'
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
        userRoles: USER_ROLES,
        orderStatuses: ORDER_STATUSES
    }
};
