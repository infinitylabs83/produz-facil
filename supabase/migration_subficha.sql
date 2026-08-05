-- ============================================================
-- ProduzFácil CMV — Migração: permitir sub-ficha dentro de ficha técnica
-- ============================================================
--
-- POR QUÊ: hoje `produto_ingredientes` só consegue apontar para `insumos`
-- (coisa que se compra). Não existe forma de dizer "a Salada de Rosbife usa
-- 60 g do ROSBIFE - FAB", que por sua vez é outro produto com ficha própria.
-- Por isso a sincronização com o DRE precisa "achatar" as sub-fichas,
-- espalhando lagarto/manteiga/páprica crus dentro da ficha do sanduíche.
--
-- O QUE ESTA MIGRAÇÃO FAZ: adiciona `produto_ref_id`, permitindo que cada
-- linha da ficha seja OU um insumo OU outro produto de fabricação (FAB).
--
-- COMO RODAR: Supabase do ProduzFácil -> SQL Editor -> cole e execute.
-- É aditiva e reversível: nenhuma linha existente é alterada ou apagada
-- (todas continuam com insumo_id preenchido e produto_ref_id nulo).
-- ============================================================

-- 1) Nova coluna: referência a outro produto (FAB) em vez de um insumo
alter table produto_ingredientes
  add column if not exists produto_ref_id uuid references produtos(id);

-- 2) insumo_id deixa de ser obrigatório (agora a linha pode ser um produto)
alter table produto_ingredientes
  alter column insumo_id drop not null;

-- 3) Trava: cada linha é exatamente UMA coisa — ou insumo, ou produto.
--    Impede linha vazia (sem nenhum dos dois) e linha ambígua (com os dois).
alter table produto_ingredientes
  drop constraint if exists produto_ingredientes_um_tipo_ck;
alter table produto_ingredientes
  add constraint produto_ingredientes_um_tipo_ck check (
    (insumo_id is not null and produto_ref_id is null)
    or
    (insumo_id is null and produto_ref_id is not null)
  );

-- 4) Trava: um produto não pode se referenciar (ciclo imediato)
alter table produto_ingredientes
  drop constraint if exists produto_ingredientes_sem_autoref_ck;
alter table produto_ingredientes
  add constraint produto_ingredientes_sem_autoref_ck check (
    produto_ref_id is null or produto_ref_id <> produto_id
  );

-- 5) Índice para resolver a árvore de sub-fichas rápido
create index if not exists produto_ingredientes_produto_ref_id_idx
  on produto_ingredientes (produto_ref_id);

-- 6) Rendimento da produção, em kg (ex.: ROSBIFE - FAB rende 10,8 kg).
--    SEM ESTE CAMPO O CUSTO POR QUILO NÃO EXISTE: hoje o ProduzFácil guarda
--    só `porcao_padrao_g` (60 g, o tamanho da porção) e `meta_rendimento`
--    (percentual), mas nunca quanto a receita inteira rende. É esse número
--    que fecha a conta da ficha:
--        custo por quilo = custo total dos insumos / rendimento_kg
--        (ex.: R$ 789,31 / 10,8 kg = R$ 73,08/kg)
--    Fica nulo por enquanto; a sincronização com o DRE preenche em seguida,
--    a partir do rendimento que já existe em cada ficha lá.
alter table produtos
  add column if not exists rendimento_kg numeric(10, 4);

-- ============================================================
-- Conferência (opcional): deve devolver 0 linhas inválidas
-- ============================================================
-- select count(*) as linhas_invalidas
--   from produto_ingredientes
--  where (insumo_id is null and produto_ref_id is null)
--     or (insumo_id is not null and produto_ref_id is not null);
