-- EMERGENCY FIX: Disable RLS completely to resolve recursion
-- Run this immediately in Supabase SQL Editor

-- Drop all problematic policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Anyone can view scores" ON scores;
DROP POLICY IF EXISTS "Admins can manage scores" ON scores;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Disable RLS completely on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Add foreign key constraints that were missing
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_score_id 
FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE;

-- Grant necessary permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON scores TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;