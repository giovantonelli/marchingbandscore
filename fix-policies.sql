-- Fix infinite recursion in RLS policies
-- Run this in Supabase SQL Editor to fix the policy issues

-- First, drop all existing policies to start fresh
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

-- Create simple, non-recursive policies

-- Users table policies (avoid recursion by not referencing users table in admin check)
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Scores table policies (public read, authenticated write)
CREATE POLICY "scores_select_all" ON scores
    FOR SELECT USING (true);

CREATE POLICY "scores_insert_authenticated" ON scores
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "scores_update_authenticated" ON scores
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "scores_delete_authenticated" ON scores
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Orders table policies
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Order items table policies
CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "order_items_insert_own" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;