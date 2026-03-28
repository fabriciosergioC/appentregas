-- Migration: Criar tabela de solicitações de retirada
-- Executar no Supabase SQL Editor

-- Criar tabela de solicitações de retirada
CREATE TABLE IF NOT EXISTS public.solicitacoes_retirada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id UUID NOT NULL REFERENCES entregadores(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'cancelada')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por entregador
CREATE INDEX IF NOT EXISTS idx_solicitacoes_retirada_entregador_id ON public.solicitacoes_retirada(entregador_id);

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_solicitacoes_retirada_status ON public.solicitacoes_retirada(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.solicitacoes_retirada ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas
DROP POLICY IF EXISTS "Permitir select em solicitacoes_retirada" ON public.solicitacoes_retirada;
CREATE POLICY "Permitir select em solicitacoes_retirada"
  ON public.solicitacoes_retirada FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insert em solicitacoes_retirada" ON public.solicitacoes_retirada;
CREATE POLICY "Permitir insert em solicitacoes_retirada"
  ON public.solicitacoes_retirada FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update em solicitacoes_retirada" ON public.solicitacoes_retirada;
CREATE POLICY "Permitir update em solicitacoes_retirada"
  ON public.solicitacoes_retirada FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Permitir delete em solicitacoes_retirada" ON public.solicitacoes_retirada;
CREATE POLICY "Permitir delete em solicitacoes_retirada"
  ON public.solicitacoes_retirada FOR DELETE
  USING (true);
