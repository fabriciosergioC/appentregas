-- =============================================
-- TABELA DE CÓDIGOS DE VERIFICAÇÃO
-- =============================================

-- Criar tabela de códigos de verificação
CREATE TABLE IF NOT EXISTS codigos_verificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'cadastro',
  usado BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_verificacao(email);

-- Criar índice para busca por código
CREATE INDEX IF NOT EXISTS idx_codigos_codigo ON codigos_verificacao(codigo);

-- Criar índice para expiração
CREATE INDEX IF NOT EXISTS idx_codigos_expires_at ON codigos_verificacao(expires_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE codigos_verificacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública"
  ON codigos_verificacao FOR SELECT
  USING (true);

-- Política para permitir insert público
CREATE POLICY "Permitir insert público"
  ON codigos_verificacao FOR INSERT
  WITH CHECK (true);

-- Política para permitir update público
CREATE POLICY "Permitir update público"
  ON codigos_verificacao FOR UPDATE
  USING (true);

-- Trigger para limpar códigos expirados (opcional)
-- Executar periodicamente para limpar códigos antigos
CREATE OR REPLACE FUNCTION limpar_codigos_expirados()
RETURNS void AS $$
BEGIN
  DELETE FROM codigos_verificacao
  WHERE expires_at < NOW() OR usado = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE codigos_verificacao IS 'Tabela de códigos de verificação para confirmação de cadastro';
COMMENT ON COLUMN codigos_verificacao.id IS 'ID único do código';
COMMENT ON COLUMN codigos_verificacao.email IS 'Email do usuário que solicitou o código';
COMMENT ON COLUMN codigos_verificacao.codigo IS 'Código de verificação de 6 dígitos';
COMMENT ON COLUMN codigos_verificacao.tipo IS 'Tipo de verificação: cadastro, recuperacao, etc';
COMMENT ON COLUMN codigos_verificacao.usado IS 'Se o código já foi utilizado';
COMMENT ON COLUMN codigos_verificacao.expires_at IS 'Data/hora de expiração do código';
COMMENT ON COLUMN codigos_verificacao.created_at IS 'Data/hora de criação do código';
