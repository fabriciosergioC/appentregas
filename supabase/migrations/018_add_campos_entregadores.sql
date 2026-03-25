-- =============================================
-- ADICIONAR CAMPOS: foto_url, senha_hash, placa_moto
-- =============================================

-- Adicionar coluna foto_url se não existir
ALTER TABLE entregadores
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Adicionar coluna senha_hash se não existir
ALTER TABLE entregadores
ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Adicionar coluna placa_moto se não existir
ALTER TABLE entregadores
ADD COLUMN IF NOT EXISTS placa_moto TEXT;

-- Adicionar comentário nas colunas
COMMENT ON COLUMN entregadores.foto_url IS 'URL ou base64 da foto de perfil do entregador';
COMMENT ON COLUMN entregadores.senha_hash IS 'Hash da senha (base64)';
COMMENT ON COLUMN entregadores.placa_moto IS 'Placa da moto do entregador';

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON THIS IS 'Migration para adicionar campos foto_url, senha_hash e placa_moto na tabela entregadores';
