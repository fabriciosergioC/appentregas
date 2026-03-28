-- Migration: Adicionar coluna comprovante_pix em pagamentos_entregadores
-- Executar no Supabase SQL Editor

-- Adicionar coluna comprovante_pix na tabela pagamentos_entregadores
ALTER TABLE public.pagamentos_entregadores 
ADD COLUMN IF NOT EXISTS comprovante_pix TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.pagamentos_entregadores.comprovante_pix IS 'URL do comprovante de pagamento PIX';
