-- =============================================
-- ADICIONAR COLUNA imagem_url EM PRODUTOS
-- =============================================

-- Adicionar coluna imagem_url na tabela produtos (caso já exista)
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN produtos.imagem_url IS 'URL da imagem do produto no Supabase Storage';
