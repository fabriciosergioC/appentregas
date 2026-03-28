-- =============================================
-- ADICIONAR CAMPOS: foto_url, senha_hash, placa_moto
-- =============================================

-- Primeiro verificar se as colunas já existem
DO $$ 
BEGIN 
  -- Adicionar coluna foto_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entregadores' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE entregadores ADD COLUMN foto_url TEXT;
    RAISE NOTICE 'Coluna foto_url adicionada';
  ELSE
    RAISE NOTICE 'Coluna foto_url já existe';
  END IF;

  -- Adicionar coluna senha_hash se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entregadores' AND column_name = 'senha_hash'
  ) THEN
    ALTER TABLE entregadores ADD COLUMN senha_hash TEXT;
    RAISE NOTICE 'Coluna senha_hash adicionada';
  ELSE
    RAISE NOTICE 'Coluna senha_hash já existe';
  END IF;

  -- Adicionar coluna placa_moto se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entregadores' AND column_name = 'placa_moto'
  ) THEN
    ALTER TABLE entregadores ADD COLUMN placa_moto TEXT;
    RAISE NOTICE 'Coluna placa_moto adicionada';
  ELSE
    RAISE NOTICE 'Coluna placa_moto já existe';
  END IF;
END $$;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN entregadores.foto_url IS 'URL ou base64 da foto de perfil do entregador';
COMMENT ON COLUMN entregadores.senha_hash IS 'Hash da senha (base64)';
COMMENT ON COLUMN entregadores.placa_moto IS 'Placa da moto do entregador';

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON THIS IS 'Migration para adicionar campos foto_url, senha_hash e placa_moto na tabela entregadores';
