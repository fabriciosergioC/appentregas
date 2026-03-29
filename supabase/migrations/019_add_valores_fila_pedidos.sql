-- =============================================
-- ADICIONAR COLUNAS valor_pedido e valor_entregador EM fila_pedidos
-- =============================================

ALTER TABLE public.fila_pedidos 
ADD COLUMN IF NOT EXISTS valor_pedido DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_entregador DECIMAL(10,2) DEFAULT 0;

-- Comentários
COMMENT ON COLUMN public.fila_pedidos.valor_pedido IS 'Valor subtotal do pedido (produtos)';
COMMENT ON COLUMN public.fila_pedidos.valor_entregador IS 'Valor da taxa do entregador';
