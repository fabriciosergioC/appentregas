-- =============================================
-- ADICIONAR COLUNA estabelecimento_id EM solicitacoes_retirada
-- =============================================

ALTER TABLE public.solicitacoes_retirada 
ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES estabelecimentos(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_retirada_estabelecimento 
ON solicitacoes_retirada(estabelecimento_id);

-- Comentário
COMMENT ON COLUMN public.solicitacoes_retirada.estabelecimento_id IS 'ID do estabelecimento vinculado ao entregador (via pagamentos)';
