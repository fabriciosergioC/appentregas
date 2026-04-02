-- Migration 023: Adicionar status para devolução de pedidos
-- Este status permite que o entregador solicite a devolução e o admin a processe

-- Adicionar novos valores ao tipo ENUM status_pedido
ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'solicitado_devolucao' AFTER 'no_local';
ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'devolvido' AFTER 'entregue';

-- Adicionar coluna para armazenar o motivo da devolução na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_devolucao TEXT;

-- Comentário para documentação
COMMENT ON COLUMN pedidos.status IS 'Status: pendente, aceito, em_transito, no_local, solicitado_devolucao, entregue, devolvido';
