-- =============================================
-- EXECUTAR NO SUPABASE - TODAS AS MIGRATIONS PENDENTES
-- =============================================
-- Projeto: lhvfjaimrsrbvketayck
-- Data: 2026-03-29
-- =============================================

-- 1. Adicionar coluna estabelecimento_id em solicitacoes_retirada
ALTER TABLE public.solicitacoes_retirada
ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES estabelecimentos(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_retirada_estabelecimento
ON solicitacoes_retirada(estabelecimento_id);

-- Comentário
COMMENT ON COLUMN public.solicitacoes_retirada.estabelecimento_id IS 'ID do estabelecimento vinculado ao entregador (via pagamentos)';

-- 2. Adicionar colunas para recuperação de senha em entregadores
ALTER TABLE public.entregadores 
ADD COLUMN IF NOT EXISTS token_recuperacao TEXT,
ADD COLUMN IF NOT EXISTS token_expiracao TIMESTAMPTZ;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_entregadores_token_recuperacao 
ON entregadores(token_recuperacao);

-- Comentários
COMMENT ON COLUMN public.entregadores.token_recuperacao IS 'Token para recuperação de senha';
COMMENT ON COLUMN public.entregadores.token_expiracao IS 'Data/hora de expiração do token de recuperação';

-- =============================================
-- CONFIRMAR EXECUÇÃO
-- =============================================
-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'solicitacoes_retirada' 
  AND column_name = 'estabelecimento_id';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'entregadores' 
  AND column_name IN ('token_recuperacao', 'token_expiracao');

-- =============================================
-- RECUPERAÇÃO DE SENHA ESTABELECIMENTO
-- =============================================
-- 3. Adicionar colunas para recuperação de senha em estabelecimentos
ALTER TABLE public.estabelecimentos
ADD COLUMN IF NOT EXISTS token_recuperacao TEXT,
ADD COLUMN IF NOT EXISTS token_expiracao TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_token_recuperacao 
ON estabelecimentos(token_recuperacao);

COMMENT ON COLUMN public.estabelecimentos.token_recuperacao IS 'Token para recuperação de senha';
COMMENT ON COLUMN public.estabelecimentos.token_expiracao IS 'Data/hora de expiração do token de recuperação';

-- Adicionar pedido_id em solicitacoes_retirada
ALTER TABLE public.solicitacoes_retirada ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id);


-- Adicionar solicitacao_id em pagamentos_entregadores
ALTER TABLE public.pagamentos_entregadores ADD COLUMN IF NOT EXISTS solicitacao_id UUID REFERENCES solicitacoes_retirada(id);

