-- Setup completo per nuovo progetto Supabase V2
-- SENZA problemi di policy RLS

-- 1. Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crea tabelle principali
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    score_id INTEGER NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_scores_category ON scores(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_score_id ON order_items(score_id);

-- 4. Abilita RLS ma con policy SEMPLICI (senza ricorsione)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Policy SICURE e NON RICORSIVE

-- Users: permesso completo per utenti autenticati
CREATE POLICY "users_all_authenticated" ON users
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Scores: lettura pubblica, scrittura per autenticati
CREATE POLICY "scores_read_all" ON scores
    FOR SELECT USING (true);

CREATE POLICY "scores_write_authenticated" ON scores
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Orders: solo i propri ordini
CREATE POLICY "orders_own_only" ON orders
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Order items: tramite ordini
CREATE POLICY "order_items_via_orders" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- 6. Inserisci alcuni spartiti di esempio
INSERT INTO scores (title, composer, description, price, category) VALUES
('Marcia Trionfale', 'Giuseppe Verdi', 'Una magnifica marcia per banda musicale con arrangiamenti professionali.', 15.99, 'marcia'),
('Sinfonia della Primavera', 'Antonio Vivaldi', 'Adattamento per banda dell''opera classica Le Quattro Stagioni.', 22.50, 'sinfonia'),
('Concerto per Tromba', 'Johann Hummel', 'Splendido concerto solistico per tromba e banda musicale.', 18.75, 'concerto'),
('Ave Maria', 'Franz Schubert', 'Arrangiamento sacro per banda e solista.', 12.00, 'altro'),
('William Tell Overture', 'Gioachino Rossini', 'La celebre ouverture in versione per banda musicale.', 20.00, 'sinfonia');

-- 7. Crea funzioni helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Aggiungi trigger per updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Commenti per documentazione
COMMENT ON TABLE users IS 'Profili utente estesi';
COMMENT ON TABLE scores IS 'Catalogo spartiti musicali';
COMMENT ON TABLE orders IS 'Ordini di acquisto';
COMMENT ON TABLE order_items IS 'Dettagli items negli ordini';

-- Setup completato!