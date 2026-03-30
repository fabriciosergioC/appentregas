-- =============================================
-- SCRIPT DE CORREÇÃO: Tabela fila_pedidos
-- =============================================
-- Execute este script no editor SQL do Supabase para garantir
-- que todas as colunas necessárias existem na tabela fila_pedidos

-- 1. Adicionar colunas de valor (caso não existam)
ALTER TABLE public.fila_pedidos
ADD COLUMN IF NOT EXISTS valor_pedido DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_entregador DECIMAL(10,2) DEFAULT 0;

-- 2. Adicionar coluna comprovante_pix (caso não exista)
ALTER TABLE public.fila_pedidos
ADD COLUMN IF NOT EXISTS comprovante_pix TEXT;

-- 3. Adicionar coluna pedido_id (caso não exista)
ALTER TABLE public.fila_pedidos
ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id);

-- 4. Criar índice para pedido_id (caso não exista)
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_pedido_id ON fila_pedidos(pedido_id);

-- 5. Adicionar comentários nas colunas
COMMENT ON COLUMN public.fila_pedidos.valor_pedido IS 'Valor subtotal do pedido (produtos)';
COMMENT ON COLUMN public.fila_pedidos.valor_entregador IS 'Valor da taxa do entregador';
COMMENT ON COLUMN public.fila_pedidos.comprovante_pix IS 'URL do comprovante de pagamento PIX';
COMMENT ON COLUMN public.fila_pedidos.pedido_id IS 'ID do pedido criado na tabela pedidos (ligação direta)';

-- =============================================
-- VERIFICAÇÃO
-- =============================================
-- Após executar, rode este SELECT para confirmar as colunas:
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fila_pedidos'
ORDER BY ordinal_position;
