-- Migration 016: Adicionar status 'no_local' ao ENUM status_pedido
-- Este status permite que o entregador notifique o cliente que chegou ao endereço

-- Adicionar o valor ao tipo ENUM existente
-- OBS: No PostgreSQL, não é possível remover valores de um ENUM facilmente, apenas adicionar.
ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'no_local' AFTER 'em_transito';

-- Comentário para documentação
COMMENT ON COLUMN pedidos.status IS 'Status: pendente, aceito, em_transito, no_local, entregue';
