-- Migration 004: Adicionar controle de liberação do pedido
-- Adiciona campo para controlar quando o estabelecimento libera o pedido para o entregador

-- =============================================
-- ALTERAÇÃO NA TABELA: pedidos
-- =============================================
ALTER TABLE pedidos 
ADD COLUMN liberado_pelo_estabelecimento BOOLEAN DEFAULT false,
ADD COLUMN liberado_em TIMESTAMPTZ;

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON COLUMN pedidos.liberado_pelo_estabelecimento IS 'Indica se o estabelecimento já liberou o pedido para o entregador';
COMMENT ON COLUMN pedidos.liberado_em IS 'Data/hora em que o pedido foi liberado pelo estabelecimento';
