-- ER Motowash PostgreSQL Database Schema

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create Tables

-- TABLE: users (for recording user roles and history, linked to auth.users for admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: settings
CREATE TABLE settings (
    key VARCHAR PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    address_detail TEXT NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    distance_km NUMERIC NOT NULL,
    ongkir_fee INTEGER NOT NULL,
    wash_cost INTEGER NOT NULL,
    total_cost INTEGER NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'diambil', 'dicuci', 'diantar', 'selesai', 'dibatalkan')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: chats / messages
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room VARCHAR NOT NULL, -- room_id (identified by customer nickname)
    sender VARCHAR NOT NULL CHECK (sender IN ('customer', 'Admin')),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Insert Initial Data
INSERT INTO settings (key, value) VALUES 
('global', '{"pricePer100m": 500, "promoType": "image", "promoTitle": "", "promoDesc": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO products (name, price, description, image_url) VALUES 
('Pengkilap Motor Premium (Wax)', 25000, 'Memberikan efek daun talas (water repellent) dan mengkilapkan cat motor Anda agar terlihat seperti baru.', ''),
('Sabun Cuci Motor Shampo Salju', 15000, 'Shampo motor dengan busa tebal pH seimbang, aman untuk cat doff maupun glossy.', ''),
('Pembersih Rantai & Gear', 20000, 'Menghilangkan kotoran oli, aspal, dan karat pada rantai motor dengan cepat dan aman.', '')
ON CONFLICT DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies

-- For settings:
-- - Public can view settings
-- - Authenticated users (admin) can update settings
CREATE POLICY "Allow public read settings" ON settings
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin modification settings" ON settings
    FOR ALL TO authenticated USING (true);

-- For products:
-- - Public can view products
-- - Authenticated users (admin) can do all
CREATE POLICY "Allow public read products" ON products
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin modification products" ON products
    FOR ALL TO authenticated USING (true);

-- For orders:
-- - Public can insert orders (anyone can place an order)
-- - Public can view orders (customers can query their own orders)
-- - Authenticated users (admin) can manage all orders
CREATE POLICY "Allow public insert orders" ON orders
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read orders" ON orders
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin manage orders" ON orders
    FOR ALL TO authenticated USING (true);

-- For chats:
-- - Public can insert chat messages (anyone can send a chat)
-- - Public can view chat messages (filtered by room in application)
-- - Authenticated users (admin) can manage all chats
CREATE POLICY "Allow public insert chats" ON chats
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read chats" ON chats
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin manage chats" ON chats
    FOR ALL TO authenticated USING (true);

-- For users:
-- - Public can insert user records (when registering customer name)
-- - Public can view user records
-- - Authenticated users (admin) can manage all user records
CREATE POLICY "Allow public insert users" ON users
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public read users" ON users
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin manage users" ON users
    FOR ALL TO authenticated USING (true);

-- 7. Enable Realtime Replication
-- Enable realtime for orders, chats, products, settings
begin;
  -- remove the replication article if it exists
  alter publication supabase_realtime drop table if exists orders, chats, products, settings;
  
  -- add tables to the publication
  alter publication supabase_realtime add table orders, chats, products, settings;
commit;
