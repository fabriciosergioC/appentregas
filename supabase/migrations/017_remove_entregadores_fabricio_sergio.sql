-- =============================================
-- REMOVER ENTREGADORES: FABRICIO E SERGIO
-- =============================================

-- Deletar entregadores pelo nome (case insensitive)
DELETE FROM entregadores
WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO');

-- Verificar quantos foram removidos
-- SELECT COUNT(*) FROM entregadores WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO');

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON THIS IS 'Migration para remover entregadores de teste (FABRICIO e SERGIO)';
