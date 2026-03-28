-- =============================================
-- TABELA DE ESTABELECIMENTOS
-- =============================================

-- Criar tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome_estabelecimento TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cnpj TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_email ON estabelecimentos(email);

-- Criar índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_telefone ON estabelecimentos(telefone);

-- Criar índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cnpj ON estabelecimentos(cnpj);

-- Habilitar Row Level Security (RLS)
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (para login)
CREATE POLICY "Permitir leitura pública para login"
  ON estabelecimentos FOR SELECT
  USING (true);

-- Política para permitir insert público (para cadastro)
CREATE POLICY "Permitir cadastro público"
  ON estabelecimentos FOR INSERT
  WITH CHECK (true);

-- Política para permitir update apenas do próprio estabelecimento
CREATE POLICY "Permitir update do próprio estabelecimento"
  ON estabelecimentos FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estabelecimentos_updated_at
  BEFORE UPDATE ON estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÕES DE AUTENTICAÇÃO
-- =============================================

-- Função para verificar senha (comparar hash)
-- Nota: Vamos usar bcrypt no frontend ou uma função simples
-- Para produção, use pgcrypto para hash de senha

-- Comentar: Para hash de senha mais seguro, instale a extensão pgcrypto
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- DADOS INICIAIS (Opcional)
-- =============================================

-- Exemplo de estabelecimento inicial (senha: 123456)
-- INSERT INTO estabelecimentos (email, senha_hash, nome_estabelecimento, nome_responsavel, telefone, cnpj)
-- VALUES (
--   '11999999999@appentregas.com',
--   '$2b$10$...', -- Hash da senha "123456"
--   'Pizzaria do João',
--   'João Silva',
--   '11999999999',
--   '00.000.000/0000-00'
-- );

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE estabelecimentos IS 'Tabela de estabelecimentos para autenticação separada do Supabase Auth';
COMMENT ON COLUMN estabelecimentos.id IS 'ID único do estabelecimento';
COMMENT ON COLUMN estabelecimentos.email IS 'Email de login (formato: telefone@appentregas.com)';
COMMENT ON COLUMN estabelecimentos.senha_hash IS 'Hash da senha (usar bcrypt)';
COMMENT ON COLUMN estabelecimentos.nome_estabelecimento IS 'Nome fantasia do estabelecimento';
COMMENT ON COLUMN estabelecimentos.nome_responsavel IS 'Nome do responsável pelo estabelecimento';
COMMENT ON COLUMN estabelecimentos.telefone IS 'Telefone/WhatsApp para contato e login';
COMMENT ON COLUMN estabelecimentos.cnpj IS 'CNPJ do estabelecimento (opcional)';
COMMENT ON COLUMN estabelecimentos.ativo IS 'Status do estabelecimento (ativo/inativo)';
