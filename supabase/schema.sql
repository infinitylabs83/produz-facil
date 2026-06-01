-- ============================================================
-- ProduzFácil CMV — Schema do Banco de Dados
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- EMPRESAS (suporte a multi-empresa / SaaS)
-- ============================================================
create table empresas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- USUÁRIOS (perfis vinculados ao Supabase Auth)
-- ============================================================
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references empresas(id),
  perfil text not null check (perfil in ('operador', 'administrativo', 'gestor')),
  nome text,
  created_at timestamptz default now()
);

-- ============================================================
-- FORNECEDORES
-- ============================================================
create table fornecedores (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id),
  nome text not null,
  contato text,
  created_at timestamptz default now()
);

-- ============================================================
-- INSUMOS (ingredientes com preço)
-- ============================================================
create table insumos (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id),
  nome text not null,
  preco_por_kg numeric(10, 4) not null default 0,
  unidade_padrao text not null default 'kg', -- kg, g, L, ml, un
  created_at timestamptz default now()
);

-- ============================================================
-- PRODUTOS (itens que a cozinha produz)
-- ============================================================
create table produtos (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id),
  nome text not null,
  porcao_padrao_g numeric(8, 2) not null default 100,
  meta_rendimento numeric(5, 2) not null default 70, -- percentual esperado
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- INGREDIENTES PADRÃO POR PRODUTO
-- (administrativo define quais insumos compõem cada produto)
-- ============================================================
create table produto_ingredientes (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  insumo_id uuid not null references insumos(id),
  unidade_uso text not null default 'kg',
  quantidade_padrao numeric(10, 4), -- quantidade sugerida (referência)
  created_at timestamptz default now()
);

-- ============================================================
-- PRODUÇÕES (cada lançamento feito pela cozinha)
-- ============================================================
create table producoes (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid references empresas(id),
  produto_id uuid not null references produtos(id),
  fornecedor_id uuid references fornecedores(id),
  operador_id uuid references auth.users(id),

  -- Pesagens
  peso_cru_kg numeric(10, 4) not null,
  peso_apos_limpeza_kg numeric(10, 4) not null,
  peso_pronto_kg numeric(10, 4) not null,

  -- Calculados automaticamente
  perda_limpeza_kg numeric(10, 4),
  perda_preparo_kg numeric(10, 4),
  perda_total_kg numeric(10, 4),
  percentual_perda numeric(6, 2),
  rendimento numeric(6, 2),

  -- Custos calculados
  custo_total numeric(10, 4),
  custo_por_kg_pronto numeric(10, 4),
  custo_porcao numeric(10, 4),

  -- Status do resultado
  status text check (status in ('excelente', 'meta', 'atencao', 'perda')),

  created_at timestamptz default now()
);

-- ============================================================
-- INGREDIENTES USADOS EM CADA PRODUÇÃO
-- ============================================================
create table producao_ingredientes (
  id uuid primary key default uuid_generate_v4(),
  producao_id uuid not null references producoes(id) on delete cascade,
  insumo_id uuid references insumos(id),
  nome_livre text, -- para ingredientes extras sem cadastro
  quantidade numeric(10, 4) not null,
  unidade text not null default 'kg',
  custo_unitario numeric(10, 4), -- preço/kg no momento do lançamento
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante que cada empresa só vê seus próprios dados
-- ============================================================

alter table empresas enable row level security;
alter table usuarios enable row level security;
alter table fornecedores enable row level security;
alter table insumos enable row level security;
alter table produtos enable row level security;
alter table produto_ingredientes enable row level security;
alter table producoes enable row level security;
alter table producao_ingredientes enable row level security;

-- Política: usuário autenticado vê dados da própria empresa
create policy "Acesso por empresa" on fornecedores
  for all using (
    empresa_id = (select empresa_id from usuarios where id = auth.uid())
  );

create policy "Acesso por empresa" on insumos
  for all using (
    empresa_id = (select empresa_id from usuarios where id = auth.uid())
  );

create policy "Acesso por empresa" on produtos
  for all using (
    empresa_id = (select empresa_id from usuarios where id = auth.uid())
  );

create policy "Acesso por empresa" on producoes
  for all using (
    empresa_id = (select empresa_id from usuarios where id = auth.uid())
  );

-- Políticas para tabelas filhas (herdam via join implícito)
create policy "Acesso público a produto_ingredientes" on produto_ingredientes
  for all using (true);

create policy "Acesso público a producao_ingredientes" on producao_ingredientes
  for all using (true);

-- Usuário vê o próprio perfil
create policy "Usuário vê próprio perfil" on usuarios
  for select using (id = auth.uid());

-- ============================================================
-- FUNÇÃO: criar perfil de usuário após signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, perfil)
  values (new.id, 'operador');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
