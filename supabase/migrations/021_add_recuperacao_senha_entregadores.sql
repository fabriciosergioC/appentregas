-- =============================================
-- ADICIONAR COLUNAS PARA RECUPERACAO DE SENHA EM entregadores
-- =============================================

-- Adicionar colunas para token de recuperação de senha
ALTER TABLE public.entregadores 
ADD COLUMN IF NOT EXISTS token_recuperacao TEXT,
ADD COLUMN IF NOT EXISTS token_expiracao TIMESTAMPTZ;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_entregadores_token_recuperacao 
ON entregadores(token_recuperacao);

-- Comentários
COMMENT ON COLUMN public.entregadores.token_recuperacao IS 'Token para recuperação de senha';
COMMENT ON COLUMN public.entregadores.token_expiracao IS 'Data/hora de expiração do token de recuperação';
