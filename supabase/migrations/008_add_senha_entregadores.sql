-- =============================================
-- ADICIONAR COLUNA: senha_hash na tabela entregadores
-- =============================================
-- Executar no SQL Editor do Supabase:
-- https://app.supabase.com/project/_/sql/new
-- =============================================

-- Adicionar coluna senha_hash (se não existir)
ALTER TABLE entregadores 
ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Adicionar comentário
COMMENT ON COLUMN entregadores.senha_hash IS 'Hash da senha do entregador (base64)';

-- =============================================
-- Para verificar a estrutura após executar:
-- Vá em Table Editor → entregadores
-- =============================================
