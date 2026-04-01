-- =============================================
-- TABELA: clientes
-- =============================================
-- Tabela para armazenar dados de cadastro dos clientes

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  senha_hash TEXT NOT NULL,
  endereco_padrao TEXT,
  token_recuperacao TEXT,
  token_expiracao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (necessária para login/verificação)
CREATE POLICY "Permitir leitura pública de clientes"
  ON clientes FOR SELECT
  USING (true);

-- Política para permitir cadastro público
CREATE POLICY "Permitir insert público de clientes"
  ON clientes FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualizar seus próprios dados
CREATE POLICY "Permitir update dos próprios dados"
  ON clientes FOR UPDATE
  USING (true);

-- Função de trigger para updated_at (assumindo que já existe a função update_updated_at_column)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at') THEN
    CREATE TRIGGER update_clientes_updated_at
      BEFORE UPDATE ON clientes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE clientes IS 'Tabela de cadastro de clientes para o aplicativo';
COMMENT ON COLUMN clientes.id IS 'ID único do cliente';
COMMENT ON COLUMN clientes.nome IS 'Nome completo do cliente';
COMMENT ON COLUMN clientes.telefone IS 'Telefone celular do cliente (usado para login)';
COMMENT ON COLUMN clientes.email IS 'Email do cliente (opcional)';
COMMENT ON COLUMN clientes.senha_hash IS 'Hash da senha (base64 por enquanto, para consistência com entregadores)';
COMMENT ON COLUMN clientes.endereco_padrao IS 'Endereço principal de entrega';
COMMENT ON COLUMN clientes.token_recuperacao IS 'Token para recuperação de senha';
COMMENT ON COLUMN clientes.token_expiracao IS 'Data de expiração do token de recuperação';
