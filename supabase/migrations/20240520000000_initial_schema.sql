-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
create extension if not exists "uuid-ossp";

-- Tabela de Categorias
create table if not exists categories (
  id text primary key default uuid_generate_v4(),
  name text not null,
  active boolean default true
);

-- Tabela de Itens do Menu
create table if not exists "menuItems" (
  id text primary key default uuid_generate_v4(),
  "categoryId" text references categories(id),
  name text not null,
  description text,
  price numeric,
  images text[],
  "optionGroups" jsonb,
  available boolean default true
);

-- Tabela de Configurações (Singleton - ID fixo 'info')
create table if not exists settings (
  id text primary key,
  name text,
  phone text,
  "whatsappNumber" text,
  address text,
  logo text,
  banner text,
  "instagramUrl" text,
  "facebookUrl" text,
  "adminPassword" text,
  "pixKey" text,
  "pixKeyType" text,
  "pixName" text,
  "pixCity" text,
  "businessHours" text,
  delivery jsonb,
  style jsonb,
  notice jsonb
);

-- Tabela de Pedidos
create table if not exists orders (
  id text primary key default uuid_generate_v4(),
  "customerName" text,
  items jsonb,
  total numeric,
  status text,
  "createdAt" timestamptz default now(),
  "paymentMethod" text,
  address text,
  neighborhood text,
  number text,
  "changeFor" text,
  notes text,
  "needCutlery" text,
  "deliveryFee" numeric
);

-- Habilitar Realtime para todas as tabelas
-- Nota: Isso pode falhar se a publicação já existir, mas em uma migration limpa funciona.
-- Se já existir, use: alter publication supabase_realtime add table ...
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table categories, "menuItems", settings, orders;
  else
    create publication supabase_realtime for table categories, "menuItems", settings, orders;
  end if;
end $$;

-- Políticas de Segurança (RLS) - Permitir acesso público para simplificar o início
alter table categories enable row level security;
create policy "Public Access Categories" on categories for all using (true) with check (true);

alter table "menuItems" enable row level security;
create policy "Public Access MenuItems" on "menuItems" for all using (true) with check (true);

alter table settings enable row level security;
create policy "Public Access Settings" on settings for all using (true) with check (true);

alter table orders enable row level security;
create policy "Public Access Orders" on orders for all using (true) with check (true);

-- Dados Iniciais (Opcional)
insert into settings (id, name, "adminPassword") 
values ('info', 'Marmitaria da Diih', 'admin123')
on conflict (id) do nothing;

insert into categories (id, name, active)
values 
  (uuid_generate_v4(), 'Marmitas', true),
  (uuid_generate_v4(), 'Bebidas', true),
  (uuid_generate_v4(), 'Sobremesas', true)
on conflict (id) do nothing;
