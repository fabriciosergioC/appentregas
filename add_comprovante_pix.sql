-- Migration: Adicionar coluna comprovante_pix e criar bucket de storage
-- Executar no Supabase SQL Editor

-- 1. Adicionar coluna comprovante_pix na tabela fila_pedidos
ALTER TABLE public.fila_pedidos 
ADD COLUMN IF NOT EXISTS comprovante_pix TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.fila_pedidos.comprovante_pix IS 'URL do comprovante de pagamento PIX';

-- 2. Criar bucket de storage para comprovantes PIX
-- Vá em Storage > Create new bucket ou execute:
-- Nome do bucket: comprovantes-pix
-- Public: true
-- File size limit: 5242880 (5MB)
-- Allowed MIME types: image/*,application/pdf

-- 3. Habilitar políticas para o bucket (se necessário)
-- Isso pode ser feito via interface do Supabase Storage
