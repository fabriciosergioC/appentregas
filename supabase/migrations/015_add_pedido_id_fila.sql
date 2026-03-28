-- =============================================
-- ADICIONAR COLUNA pedido_id EM fila_pedidos
-- =============================================

-- Adicionar coluna pedido_id para ligação direta com a tabela pedidos
ALTER TABLE fila_pedidos 
ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id);

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_pedido_id ON fila_pedidos(pedido_id);

-- Adicionar comentário
COMMENT ON COLUMN fila_pedidos.pedido_id IS 'ID do pedido criado na tabela pedidos (ligação direta)';
