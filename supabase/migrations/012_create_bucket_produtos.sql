-- =============================================
-- CRIAR BUCKET DE IMAGENS DOS PRODUTOS
-- =============================================

-- Inserir bucket para imagens de produtos (caso não exista)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos-imagens', 'produtos-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload público
CREATE POLICY "Permitir upload público de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'produtos-imagens');

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública de imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produtos-imagens');

-- Política para permitir delete público
CREATE POLICY "Permitir delete público de imagens"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'produtos-imagens');
