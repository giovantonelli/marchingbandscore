-- Database setup for Marching Band Score application
-- Run these commands in your Supabase SQL editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create scores table
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    composer TEXT,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    cover_url TEXT,
    pdf_url TEXT,
    audio_url TEXT,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    score_id INTEGER NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Scores table policies
CREATE POLICY "Anyone can view scores" ON scores
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage scores" ON scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders table policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Order items table policies
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Create storage bucket for scores (if not exists)
-- This should be done in Supabase Storage interface
-- Bucket name: 'scores'
-- Folders: 'covers', 'pdfs', 'audio'

-- 8. Create storage policies
-- These should be created in Supabase Storage interface:

-- For covers folder (public read):
-- Policy name: "Anyone can view covers"
-- Allowed operation: SELECT
-- Policy definition: true

-- For pdfs folder (authenticated users who purchased):
-- Policy name: "Users can access purchased PDFs"
-- Allowed operation: SELECT
-- Policy definition: (check if user purchased the score)

-- For audio folder (public read):
-- Policy name: "Anyone can view audio previews"
-- Allowed operation: SELECT
-- Policy definition: true

-- 9. Create function to check if user has purchased a score
CREATE OR REPLACE FUNCTION user_has_purchased_score(user_id UUID, score_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = user_has_purchased_score.user_id
        AND oi.score_id = user_has_purchased_score.score_id
        AND o.status = 'completed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Set up your admin user
-- After creating your first user account, run this command replacing 'your-email@example.com' with your email:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';