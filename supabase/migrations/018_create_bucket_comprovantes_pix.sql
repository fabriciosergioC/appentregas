-- Migration: Criar bucket de comprovantes PIX
-- Executar no Supabase SQL Editor

-- 1. Adicionar coluna comprovante_pix na tabela fila_pedidos
ALTER TABLE public.fila_pedidos 
ADD COLUMN IF NOT EXISTS comprovante_pix TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.fila_pedidos.comprovante_pix IS 'URL do comprovante de pagamento PIX';

-- 2. Criar bucket de storage para comprovantes PIX
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes-pix',
  'comprovantes-pix',
  true,
  5242880,
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar políticas de acesso ao bucket

-- Permitir upload de arquivos
DROP POLICY IF EXISTS "Permitir upload de comprovantes" ON storage.objects;
CREATE POLICY "Permitir upload de comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comprovantes-pix');

-- Permitir visualização de arquivos
DROP POLICY IF EXISTS "Permitir visualizacao de comprovantes" ON storage.objects;
CREATE POLICY "Permitir visualizacao de comprovantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprovantes-pix');

-- Permitir exclusão de arquivos
DROP POLICY IF EXISTS "Permitir exclusao de comprovantes" ON storage.objects;
CREATE POLICY "Permitir exclusao de comprovantes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'comprovantes-pix');
