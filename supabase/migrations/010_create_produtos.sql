-- =============================================
-- TABELA DE PRODUTOS
-- =============================================

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  categoria TEXT,
  imagem_url TEXT,
  disponivel BOOLEAN DEFAULT true,
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);

-- Criar índice para busca por estabelecimento
CREATE INDEX IF NOT EXISTS idx_produtos_estabelecimento_id ON produtos(estabelecimento_id);

-- Criar índice para produtos disponíveis
CREATE INDEX IF NOT EXISTS idx_produtos_disponivel ON produtos(disponivel);

-- Habilitar Row Level Security (RLS)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública"
  ON produtos FOR SELECT
  USING (true);

-- Política para permitir insert público
CREATE POLICY "Permitir cadastro público"
  ON produtos FOR INSERT
  WITH CHECK (true);

-- Política para permitir update público
CREATE POLICY "Permitir update público"
  ON produtos FOR UPDATE
  USING (true);

-- Política para permitir delete público
CREATE POLICY "Permitir delete público"
  ON produtos FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE produtos IS 'Tabela de produtos dos estabelecimentos';
COMMENT ON COLUMN produtos.id IS 'ID único do produto';
COMMENT ON COLUMN produtos.nome IS 'Nome do produto';
COMMENT ON COLUMN produtos.descricao IS 'Descrição detalhada do produto';
COMMENT ON COLUMN produtos.preco IS 'Preço do produto';
COMMENT ON COLUMN produtos.categoria IS 'Categoria do produto (ex: Pizzas, Bebidas, etc.)';
COMMENT ON COLUMN produtos.imagem_url IS 'URL da imagem do produto no Supabase Storage';
COMMENT ON COLUMN produtos.disponivel IS 'Status de disponibilidade do produto';
COMMENT ON COLUMN produtos.estabelecimento_id IS 'ID do estabelecimento proprietário do produto';
