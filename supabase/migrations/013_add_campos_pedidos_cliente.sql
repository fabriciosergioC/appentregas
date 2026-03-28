-- =============================================
-- ADICIONAR CAMPOS PARA PEDIDOS DO CLIENTE
-- =============================================

-- Adicionar campos na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS estabelecimento_nome TEXT,
ADD COLUMN IF NOT EXISTS estabelecimento_endereco TEXT,
ADD COLUMN IF NOT EXISTS valor_pedido NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS valor_entregador NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS telefone_cliente TEXT,
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS estabelecimento_id UUID REFERENCES estabelecimentos(id);

-- Adicionar índice para estabelecimento_id
CREATE INDEX IF NOT EXISTS idx_pedidos_estabelecimento_id ON pedidos(estabelecimento_id);

-- Adicionar comentários
COMMENT ON COLUMN pedidos.estabelecimento_nome IS 'Nome do estabelecimento onde o pedido foi feito';
COMMENT ON COLUMN pedidos.estabelecimento_endereco IS 'Endereço do estabelecimento';
COMMENT ON COLUMN pedidos.valor_pedido IS 'Valor total do pedido';
COMMENT ON COLUMN pedidos.valor_entregador IS 'Valor pago ao entregador';
COMMENT ON COLUMN pedidos.telefone_cliente IS 'Telefone/WhatsApp do cliente';
COMMENT ON COLUMN pedidos.forma_pagamento IS 'Forma de pagamento: pix, dinheiro, cartao_credito, cartao_debito';
COMMENT ON COLUMN pedidos.observacoes IS 'Observações adicionais do pedido';
COMMENT ON COLUMN pedidos.estabelecimento_id IS 'ID do estabelecimento proprietário do pedido';
