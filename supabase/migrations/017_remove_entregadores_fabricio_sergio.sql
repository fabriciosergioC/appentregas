-- =============================================
-- REMOVER ENTREGADORES: FABRICIO E SERGIO
-- =============================================

-- Opção 1: Remover pedidos associados primeiro
DELETE FROM pedidos
WHERE entregador_id IN (
  SELECT id FROM entregadores
  WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO')
);

-- Depois deletar os entregadores
DELETE FROM entregadores
WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO');

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON THIS IS 'Migration para remover entregadores de teste (FABRICIO e SERGIO) e seus pedidos associados';
