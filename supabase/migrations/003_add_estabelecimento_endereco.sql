-- Migration 003: Adicionar endereço do estabelecimento
-- Adiciona campo para armazenar o endereço do estabelecimento nos pedidos

-- =============================================
-- ALTERAÇÃO NA TABELA: pedidos
-- =============================================
ALTER TABLE pedidos 
ADD COLUMN estabelecimento_endereco TEXT;

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON COLUMN pedidos.estabelecimento_endereco IS 'Endereço do estabelecimento onde o pedido foi feito';
