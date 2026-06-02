-- ============================================================
-- ProduzFácil CMV — Função para Painel do Fundador
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Adiciona colunas de plano e trial na tabela empresas (se não existirem)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'trial' CHECK (plano IN ('trial', 'pago', 'cancelado', 'cortesia')),
  ADD COLUMN IF NOT EXISTS trial_expira_em timestamptz DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Tabela de leads já existe — garante coluna origem
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'landing_beta';

-- ============================================================
-- FUNÇÃO PRINCIPAL: retorna todos os dados do painel do fundador
-- SECURITY DEFINER = roda com permissão de superusuário
-- Só permite acesso se o usuário for 'gestor'
-- ============================================================
CREATE OR REPLACE FUNCTION get_founder_dashboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_perfil text;
  result   json;
BEGIN
  -- Verifica se é gestor
  SELECT perfil INTO v_perfil FROM usuarios WHERE id = auth.uid();
  IF v_perfil IS DISTINCT FROM 'gestor' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT json_build_object(

    -- ── FUNIL ──────────────────────────────────────────────
    'funil', json_build_object(
      'leads_total',       (SELECT COUNT(*)  FROM leads),
      'leads_convertidos', (SELECT COUNT(*)  FROM leads  WHERE convertido = true),
      'empresas_total',    (SELECT COUNT(*)  FROM empresas),
      'empresas_com_producao', (
        SELECT COUNT(DISTINCT empresa_id) FROM producoes
      ),
      'empresas_ativas_7d', (
        SELECT COUNT(DISTINCT empresa_id)
        FROM   producoes
        WHERE  created_at >= now() - interval '7 days'
      ),
      'producoes_total',   (SELECT COUNT(*) FROM producoes)
    ),

    -- ── EMPRESAS (detalhe por cliente) ─────────────────────
    'empresas', (
      SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.created_at DESC), '[]')
      FROM (
        SELECT
          e.id,
          e.nome,
          e.plano,
          e.trial_expira_em,
          e.created_at,
          COUNT(DISTINCT p.id)                          AS total_producoes,
          MAX(p.created_at)                             AS ultima_producao,
          COUNT(DISTINCT u.id)                          AS total_usuarios,
          -- dias desde a última produção (null se nunca produziu)
          EXTRACT(DAY FROM now() - MAX(p.created_at))   AS dias_sem_producao,
          -- status calculado
          CASE
            WHEN COUNT(p.id) = 0                                      THEN 'nunca_usou'
            WHEN MAX(p.created_at) >= now() - interval '3 days'       THEN 'ativo'
            WHEN MAX(p.created_at) >= now() - interval '7 days'       THEN 'recente'
            ELSE 'inativo'
          END                                           AS status_uso
        FROM      empresas   e
        LEFT JOIN producoes  p ON p.empresa_id = e.id
        LEFT JOIN usuarios   u ON u.empresa_id = e.id
        GROUP BY  e.id, e.nome, e.plano, e.trial_expira_em, e.created_at
      ) d
    ),

    -- ── LEADS RECENTES (últimos 20) ─────────────────────────
    'leads_recentes', (
      SELECT COALESCE(json_agg(row_to_json(l) ORDER BY l.created_at DESC), '[]')
      FROM (
        SELECT id, nome, email, whatsapp, restaurante, origem,
               convertido, acesso_criado_em, created_at
        FROM   leads
        ORDER  BY created_at DESC
        LIMIT  20
      ) l
    ),

    -- ── RANKING DE PRODUTOS (mais produzidos no geral) ──────
    'ranking_produtos', (
      SELECT COALESCE(json_agg(row_to_json(r)), '[]')
      FROM (
        SELECT
          prod.nome,
          COUNT(p.id)              AS total_producoes,
          AVG(p.rendimento)        AS rendimento_medio,
          AVG(p.custo_porcao)      AS custo_porcao_medio,
          COUNT(DISTINCT p.empresa_id) AS empresas_usando
        FROM   producoes p
        JOIN   produtos  prod ON prod.id = p.produto_id
        GROUP  BY prod.nome
        ORDER  BY total_producoes DESC
        LIMIT  10
      ) r
    ),

    -- ── ATIVIDADE POR DIA (últimos 30 dias) ─────────────────
    'atividade_diaria', (
      SELECT COALESCE(json_agg(row_to_json(a) ORDER BY a.dia), '[]')
      FROM (
        SELECT
          DATE(created_at)         AS dia,
          COUNT(*)                 AS producoes,
          COUNT(DISTINCT empresa_id) AS empresas_ativas
        FROM   producoes
        WHERE  created_at >= now() - interval '30 days'
        GROUP  BY DATE(created_at)
      ) a
    )

  ) INTO result;

  RETURN result;
END;
$$;

-- Garante que a função pode ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_founder_dashboard() TO authenticated;
