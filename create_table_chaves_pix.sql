-- Migration: Criar tabela de chaves PIX para estabelecimentos
-- Executar no Supabase SQL Editor

-- Criar tabela de chaves PIX
CREATE TABLE IF NOT EXISTS public.chaves_pix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL,
  chave TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  titular TEXT NOT NULL,
  banco TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por estabelecimento
CREATE INDEX IF NOT EXISTS idx_chaves_pix_estabelecimento_id ON public.chaves_pix(estabelecimento_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.chaves_pix ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir SELECT (qualquer usuário autenticado pode ver)
DROP POLICY IF EXISTS "Permitir select em chaves_pix" ON public.chaves_pix;
CREATE POLICY "Permitir select em chaves_pix"
  ON public.chaves_pix FOR SELECT
  USING (true);

-- Criar política para permitir INSERT (qualquer usuário pode inserir)
DROP POLICY IF EXISTS "Permitir insert em chaves_pix" ON public.chaves_pix;
CREATE POLICY "Permitir insert em chaves_pix"
  ON public.chaves_pix FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir UPDATE
DROP POLICY IF EXISTS "Permitir update em chaves_pix" ON public.chaves_pix;
CREATE POLICY "Permitir update em chaves_pix"
  ON public.chaves_pix FOR UPDATE
  USING (true);

-- Criar política para permitir DELETE
DROP POLICY IF EXISTS "Permitir delete em chaves_pix" ON public.chaves_pix;
CREATE POLICY "Permitir delete em chaves_pix"
  ON public.chaves_pix FOR DELETE
  USING (true);
