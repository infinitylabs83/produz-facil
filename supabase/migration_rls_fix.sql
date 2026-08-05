-- ============================================================
-- ProduzFácil CMV — Correção de segurança: isolar fichas e produções por empresa
-- ============================================================
--
-- PROBLEMA: `produto_ingredientes` e `producao_ingredientes` estão hoje com a
-- política `for all using (true)` — ou seja, QUALQUER usuário logado, de
-- QUALQUER empresa, consegue ler e escrever a ficha técnica e os ingredientes
-- de produção de QUALQUER outra empresa. As tabelas-mãe (`produtos`,
-- `producoes`) já são isoladas por empresa; só as tabelas-filhas ficaram abertas.
--
-- CORREÇÃO: trocar por política que herda a empresa da tabela-mãe via join.
--
-- IMPORTANTE — a sincronização com o DRE NÃO quebra: a Edge Function `sync-fichas`
-- usa a chave `service_role`, que ignora RLS por definição.
--
-- COMO RODAR: Supabase do ProduzFácil -> SQL Editor -> cole e execute.
-- Pode rodar antes ou depois de migration_subficha.sql, em qualquer ordem.
-- ============================================================

-- ------------------------------------------------------------
-- produto_ingredientes (linhas da ficha técnica)
-- ------------------------------------------------------------
drop policy if exists "Acesso público a produto_ingredientes" on produto_ingredientes;
drop policy if exists "Acesso por empresa" on produto_ingredientes;

create policy "Acesso por empresa" on produto_ingredientes
  for all
  -- quais linhas o usuário enxerga: as da ficha de um produto da empresa dele
  using (
    exists (
      select 1 from produtos p
       where p.id = produto_ingredientes.produto_id
         and p.empresa_id = (select empresa_id from usuarios where id = auth.uid())
    )
  )
  -- o que ele pode gravar: idem, e a sub-ficha referenciada também tem que ser
  -- da mesma empresa (senão daria pra apontar pra produto de outro cliente)
  with check (
    exists (
      select 1 from produtos p
       where p.id = produto_ingredientes.produto_id
         and p.empresa_id = (select empresa_id from usuarios where id = auth.uid())
    )
    and (
      produto_ref_id is null
      or exists (
        select 1 from produtos pr
         where pr.id = produto_ingredientes.produto_ref_id
           and pr.empresa_id = (select empresa_id from usuarios where id = auth.uid())
      )
    )
  );

-- ------------------------------------------------------------
-- producao_ingredientes (ingredientes usados em cada produção)
-- ------------------------------------------------------------
drop policy if exists "Acesso público a producao_ingredientes" on producao_ingredientes;
drop policy if exists "Acesso por empresa" on producao_ingredientes;

create policy "Acesso por empresa" on producao_ingredientes
  for all
  using (
    exists (
      select 1 from producoes pr
       where pr.id = producao_ingredientes.producao_id
         and pr.empresa_id = (select empresa_id from usuarios where id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from producoes pr
       where pr.id = producao_ingredientes.producao_id
         and pr.empresa_id = (select empresa_id from usuarios where id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- Índices de apoio (a política faz join por essas colunas a cada linha)
-- ------------------------------------------------------------
create index if not exists produto_ingredientes_produto_id_idx
  on produto_ingredientes (produto_id);
create index if not exists producao_ingredientes_producao_id_idx
  on producao_ingredientes (producao_id);

-- ============================================================
-- Conferência: logado como usuário da Roy's, os dois devem bater
-- com o número de fichas/produções da Roy's — nunca com o total global.
-- ============================================================
-- select count(*) from produto_ingredientes;
-- select count(*) from producao_ingredientes;

-- ============================================================
-- REVERTER (se algo quebrar, volta ao estado anterior)
-- ============================================================
-- drop policy if exists "Acesso por empresa" on produto_ingredientes;
-- create policy "Acesso público a produto_ingredientes" on produto_ingredientes for all using (true);
-- drop policy if exists "Acesso por empresa" on producao_ingredientes;
-- create policy "Acesso público a producao_ingredientes" on producao_ingredientes for all using (true);
