-- =============================================
-- ADICIONAR COLUNA contato_estabelecimento
-- =============================================

-- Adicionar coluna contato_estabelecimento na tabela estabelecimentos
ALTER TABLE estabelecimentos 
ADD COLUMN IF NOT EXISTS contato_estabelecimento TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN estabelecimentos.contato_estabelecimento IS 'Contato do estabelecimento para exibição no painel do cliente';
