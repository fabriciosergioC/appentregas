-- Migration 024: Adicionar coluna para comprovantes de devolução
-- Permite armazenar um array de fotos (Base64) anexadas pelo entregador

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comprovantes_devolucao JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN pedidos.comprovantes_devolucao IS 'Lista de fotos (Base64) anexadas como prova de tentativa de contato pelo entregador';
