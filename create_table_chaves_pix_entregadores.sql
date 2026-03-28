-- Migration: Criar tabela de chaves PIX para entregadores
-- Executar no Supabase SQL Editor

-- Criar tabela de chaves PIX dos entregadores
CREATE TABLE IF NOT EXISTS public.chaves_pix_entregadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entregador_id UUID NOT NULL,
  chave TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  titular TEXT NOT NULL,
  banco TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por entregador
CREATE INDEX IF NOT EXISTS idx_chaves_pix_entregadores_entregador_id ON public.chaves_pix_entregadores(entregador_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chaves_pix_entregadores ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir SELECT (qualquer usuário autenticado pode ver)
DROP POLICY IF EXISTS "Permitir select em chaves_pix_entregadores" ON public.chaves_pix_entregadores;
CREATE POLICY "Permitir select em chaves_pix_entregadores"
  ON public.chaves_pix_entregadores FOR SELECT
  USING (true);

-- Criar política para permitir INSERT (qualquer usuário pode inserir)
DROP POLICY IF EXISTS "Permitir insert em chaves_pix_entregadores" ON public.chaves_pix_entregadores;
CREATE POLICY "Permitir insert em chaves_pix_entregadores"
  ON public.chaves_pix_entregadores FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir UPDATE
DROP POLICY IF EXISTS "Permitir update em chaves_pix_entregadores" ON public.chaves_pix_entregadores;
CREATE POLICY "Permitir update em chaves_pix_entregadores"
  ON public.chaves_pix_entregadores FOR UPDATE
  USING (true);

-- Criar política para permitir DELETE
DROP POLICY IF EXISTS "Permitir delete em chaves_pix_entregadores" ON public.chaves_pix_entregadores;
CREATE POLICY "Permitir delete em chaves_pix_entregadores"
  ON public.chaves_pix_entregadores FOR DELETE
  USING (true);
