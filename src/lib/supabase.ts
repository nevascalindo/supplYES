/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// Retrieve public keys prefixed with VITE_
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "YOUR_SUPABASE_URL" && 
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
);

// Graceful initialization to prevent startup crashes when keys are missing
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Provide standard SQL snippet for setting up the Supabase database
export const SUPABASE_SETUP_SQL = `-- CRIAÇÃO DE TABELAS PARA O HUB SUPPLYES

-- 1. Tabela de Categorias
create table if not exists categories (
  id text primary key,
  name text not null,
  icon_name text not null,
  description text
);

-- Inserir categorias padrão se não existirem
insert into categories (id, name, icon_name, description) values
('embalagens', 'Embalagens e Descartáveis', 'Package', 'Caixas, sacolas kraft, copos, guardanapos e descartáveis em geral.'),
('alimentos', 'Alimentos e Insumos', 'UtensilsCrossed', 'Farinhas, açúcar, laticínios, hortifrúti fresco e óleos industriais.'),
('gas_energia', 'Gás e Energia', 'Flame', 'Gás industrial GLP (P45), carvão de alta performance e lenha.'),
('logistica', 'Logística e Fretes', 'Truck', 'Serviço de motoboy express, fiorino e fretes urgentes.'),
('manutencao', 'Manutenção e Serviços', 'Wrench', 'Conserto de fornos, freezers, balanças e suporte imediato.'),
('grafica', 'Gráfica e Visual', 'Printer', 'Etiquetas, comandas, banners e adesivos rápidos.')
on conflict (id) do nothing;

-- 2. Tabela de Fornecedores
create table if not exists suppliers (
  id text primary key,
  name text not null,
  logo text not null,
  category text references categories(id) on delete set null,
  location text not null,
  rating numeric default 5.0,
  reviews_count integer default 0,
  fast_delivery boolean default false,
  delivery_time text default 'A combinar',
  min_order_value numeric default 0,
  whatsapp_url text,
  description text,
  tags text[] default '{}',
  verified boolean default false,
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir fornecedores padrão se não existirem
insert into suppliers (id, name, logo, category, location, rating, reviews_count, fast_delivery, delivery_time, min_order_value, whatsapp_url, description, tags, verified, contact_email, contact_phone) values
('sup-01', 'Embalagens Flash Express', 'FE', 'embalagens', 'São Paulo - Centro / Zona Sul', 4.9, 3, true, 'Imediato (Até 40 min)', 150, 'https://wa.me/5511999999999?text=Ol%C3%A1!%20Encontrei%20voc%C3%AAs%20no%20Hub%20de%20Fornecedores.%20Preciso%20de%20uma%20entrega%20emergencial!', 'Especializados no socorro de restaurantes, pizzarias e hamburguerias. Temos sacolas kraft, caixas de pizza, potes antivazamento e copos de papel biodegradáveis em estoque para envio instantâneo.', ARRAY['Embalagens', 'Kraft', 'Descartáveis', 'Pizzaria'], true, 'comercial@embalagensflash.com', '(11) 99999-9999'),
('sup-02', 'Distribuidora Central de Gelo e Bebidas', 'CG', 'alimentos', 'São Paulo - Pinheiros e Itaim', 4.8, 2, true, 'Imediato (Até 30 min)', 80, 'https://wa.me/5511988888888?text=Olá!%20Preciso%20de%20Gelo%20e%20Insumos%20de%20urgência!', 'Amplo estoque de gelo em cubo filtrado, água mineral, energéticos, refrigerantes e insumos secos para bares e eventos de alta demanda.', ARRAY['Gelo', 'Bebidas', 'Bar', 'Suprimentos'], true, 'urgente@gelocentral.com.br', '(11) 98888-8888'),
('sup-03', 'Insumos PanExpress - Panificação e Doces', 'PE', 'alimentos', 'São Paulo - Lapa e Zona Oeste', 4.7, 1, true, 'Rápido (Em até 1h30min)', 200, 'https://wa.me/5511977777777?text=Olá!%20Urgente%20farina%20e%20ingredientes%20de%20panificação!', 'Fornecimento ágil de farinhas especiais (tipo 00), fermento fresco, chocolate belga em gotas, manteiga culinária profissional e recheios prontos.', ARRAY['Farinha', 'Fermento', 'Laticínios', 'Padaria'], true, 'pedidos@panexpress.com.br', '(11) 97777-7777')
on conflict (id) do nothing;

-- 3. Itens do Catálogo (Insumos dos Fornecedores)
create table if not exists catalog_items (
  id uuid default gen_random_uuid() primary key,
  supplier_id text references suppliers(id) on delete cascade not null,
  name text not null,
  price text not null,
  immediate_available boolean default false,
  unit text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir itens do catálogo correspondentes
insert into catalog_items (id, supplier_id, name, price, immediate_available, unit) values
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'sup-01', 'Caixa de Pizza Oitavada 35cm (Fardo 50 un)', 'R$ 79,90', true, 'Fardo'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'sup-01', 'Sacola Kraft Delivery G (Pacote 100 un)', 'R$ 110,00', true, 'Fardo'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'sup-02', 'Saco de Gelo em Cubo Premium 20kg', 'R$ 35,00', true, 'Saco'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'sup-02', 'Engradado Coca-Cola Lata 350ml (24 un)', 'R$ 82,00', true, 'Engradado'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'sup-03', 'Farinha Italiana Tipo 00 (Saco 25kg)', 'R$ 189,00', true, 'Saco')
on conflict (id) do nothing;

-- 4. Avaliações (Reviews) de Fornecedores
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  supplier_id text references suppliers(id) on delete cascade not null,
  author text not null,
  company text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir do reviews correspondentes
insert into reviews (id, supplier_id, author, company, rating, comment, date) values
('r1r1r1r1-r1r1-r1r1-r1r1-r1r1r1r1r1r1', 'sup-01', 'Roberto G.', 'Pizzaria Bella Italia', 5, 'Acabou nosso fardo de caixas de pizza em plena sexta-feira 21h. Entregaram em 25 minutos, salvou a nossa noite de faturamento!', '22/05/2026'),
('r2r2r2r2-r2r2-r2r2-r2r2-r2r2r2r2r2r2', 'sup-01', 'Carla Souza', 'Burguer Artesanal', 5, 'Excelente qualidade dos sacos kraft e pontualidade absurda no frete de urgência.', '15/05/2026'),
('r3r3r3r3-r3r3-r3r3-r3r3-r3r3r3r3r3r3', 'sup-02', 'Thiago Rocha', 'Bar das Torres', 5, 'Gelo limpo, preço honesto e rapidez impecável. Chamei no WhatsApp e logo o motoboy chegou com os sacos de gelo.', '24/05/2026')
on conflict (id) do nothing;

-- 5. Chamados de Emergência SOS
create table if not exists emergency_requests (
  id text primary key,
  company_name text not null,
  category_name text not null,
  category_id text references categories(id) on delete set null,
  item_description text not null,
  address text not null,
  timestamp text not null,
  lat numeric not null,
  lng numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Perfis de Usuários (Sessões cadastradas)
create table if not exists user_profiles (
  id uuid default gen_random_uuid() primary key,
  role text not null check (role in ('empreendedor', 'fornecedor')),
  email text unique not null,
  password text not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabela de Funcionários / Colaboradores
create table if not exists employees (
  id uuid default gen_random_uuid() primary key,
  user_email text not null, -- Email do gestor (empreendedor ou fornecedor)
  name text not null,
  role text not null,
  email text not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) opcionalmente, mas por padrão permitir acessos nas tabelas públicas para os testes rápidos do sandbox:
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table catalog_items enable row level security;
alter table reviews enable row level security;
alter table emergency_requests enable row level security;
alter table user_profiles enable row level security;
alter table employees enable row level security;

-- Políticas de acesso público liberado para facilitar o protótipo sandbox:
create policy "Acesso público irrestrito categories" on categories for all using (true) with check (true);
create policy "Acesso público irrestrito suppliers" on suppliers for all using (true) with check (true);
create policy "Acesso público irrestrito catalog_items" on catalog_items for all using (true) with check (true);
create policy "Acesso público irrestrito reviews" on reviews for all using (true) with check (true);
create policy "Acesso público irrestrito emergency_requests" on emergency_requests for all using (true) with check (true);
create policy "Acesso público irrestrito user_profiles" on user_profiles for all using (true) with check (true);
create policy "Acesso público irrestrito employees" on employees for all using (true) with check (true);
`;
