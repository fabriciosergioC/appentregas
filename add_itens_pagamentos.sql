-- Migration: Adicionar coluna itens_em_pedido em pagamentos_entregadores
-- Adiciona coluna para armazenar os itens do pedido no momento do pagamento
-- Data: 2026-03-29

-- Adicionar coluna itens_em_pedido na tabela pagamentos_entregadores
ALTER TABLE public.pagamentos_entregadores 
ADD COLUMN IF NOT EXISTS itens_em_pedido TEXT[];

-- Adicionar comentário
COMMENT ON COLUMN public.pagamentos_entregadores.itens_em_pedido IS 'Array de strings com os itens do pedido no momento do pagamento';

-- =============================================
-- ATUALIZAR PAGAMENTOS EXISTENTES COM ITENS
-- =============================================
-- Esta query atualiza os pagamentos existentes buscando os itens da tabela de pedidos
UPDATE public.pagamentos_entregadores p
SET itens_em_pedido = (
  SELECT ped.itens
  FROM public.solicitacoes_retirada sr
  JOIN public.pedidos ped ON ped.id = sr.pedido_id
  WHERE sr.id = p.solicitacao_id
    AND ped.itens IS NOT NULL
)
WHERE p.solicitacao_id IS NOT NULL
  AND p.itens_em_pedido IS NULL;

-- =============================================
-- CONFIRMAR EXECUÇÃO
-- =============================================
-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'pagamentos_entregadores'
  AND column_name = 'itens_em_pedido';

-- Verificar pagamentos com itens
SELECT 
  id,
  entregador_id,
  valor,
  descricao,
  itens_em_pedido,
  criado_em
FROM public.pagamentos_entregadores
WHERE itens_em_pedido IS NOT NULL
LIMIT 10;
