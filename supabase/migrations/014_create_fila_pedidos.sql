-- =============================================
-- TABELA: fila_pedidos
-- =============================================
-- Tabela separada para fila de pedidos dos clientes
-- Apenas para visualização do estabelecimento e base para criar pedidos

CREATE TABLE IF NOT EXISTS fila_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  endereco TEXT NOT NULL,
  forma_pagamento TEXT,
  observacoes TEXT,
  itens TEXT[] NOT NULL,
  status TEXT DEFAULT 'pendente',
  estabelecimento_nome TEXT,
  estabelecimento_id UUID REFERENCES estabelecimentos(id),
  criado_por TEXT, -- 'cliente' ou 'estabelecimento'
  convertido_em TIMESTAMPTZ, -- Quando foi convertido em pedido real
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_status ON fila_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_estabelecimento ON fila_pedidos(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_created_at ON fila_pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fila_pedidos_convertido ON fila_pedidos(convertido_em);

-- Habilitar Row Level Security (RLS)
ALTER TABLE fila_pedidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública da fila"
  ON fila_pedidos FOR SELECT
  USING (true);

-- Política para permitir insert público
CREATE POLICY "Permitir insert na fila"
  ON fila_pedidos FOR INSERT
  WITH CHECK (true);

-- Política para permitir update público
CREATE POLICY "Permitir update na fila"
  ON fila_pedidos FOR UPDATE
  USING (true);

-- Política para permitir delete público
CREATE POLICY "Permitir delete na fila"
  ON fila_pedidos FOR DELETE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_fila_pedidos_updated_at
  BEFORE UPDATE ON fila_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE fila_pedidos IS 'Fila de pedidos dos clientes - apenas para visualização do estabelecimento';
COMMENT ON COLUMN fila_pedidos.id IS 'ID único do pedido na fila';
COMMENT ON COLUMN fila_pedidos.cliente IS 'Nome do cliente';
COMMENT ON COLUMN fila_pedidos.telefone_cliente IS 'Telefone/WhatsApp do cliente';
COMMENT ON COLUMN fila_pedidos.endereco IS 'Endereço de entrega';
COMMENT ON COLUMN fila_pedidos.forma_pagamento IS 'Forma de pagamento: pix, dinheiro, cartao_credito, cartao_debito';
COMMENT ON COLUMN fila_pedidos.observacoes IS 'Observações adicionais do pedido';
COMMENT ON COLUMN fila_pedidos.itens IS 'Lista de itens do pedido';
COMMENT ON COLUMN fila_pedidos.status IS 'Status: pendente, em_preparacao, em_rota, convertido, cancelado';
COMMENT ON COLUMN fila_pedidos.estabelecimento_nome IS 'Nome do estabelecimento';
COMMENT ON COLUMN fila_pedidos.estabelecimento_id IS 'ID do estabelecimento';
COMMENT ON COLUMN fila_pedidos.criado_por IS 'Quem criou: cliente ou estabelecimento';
COMMENT ON COLUMN fila_pedidos.convertido_em IS 'Data/hora em que foi convertido em pedido real';
