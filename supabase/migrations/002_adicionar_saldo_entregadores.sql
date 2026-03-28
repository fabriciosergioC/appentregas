-- Migration 002: Adicionar saldo e histórico de transações para entregadores
-- Adiciona campo de saldo e tabela de extrato

-- =============================================
-- ALTERAÇÃO NA TABELA: entregadores
-- =============================================
-- Adicionar coluna de saldo (valor acumulado)
ALTER TABLE entregadores 
ADD COLUMN IF NOT EXISTS saldo DECIMAL(10,2) DEFAULT 0.00;

-- Adicionar comentário
COMMENT ON COLUMN entregadores.saldo IS 'Saldo acumulado do entregador das entregas realizadas';

-- =============================================
-- TABELA: extratos (histórico de transações)
-- =============================================
CREATE TABLE IF NOT EXISTS extratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entregador_id UUID REFERENCES entregadores(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('credito', 'debito', 'saque')),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_extratos_entregador ON extratos(entregador_id);
CREATE INDEX IF NOT EXISTS idx_extratos_pedido ON extratos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_extratos_created_at ON extratos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extratos_tipo ON extratos(tipo);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE extratos ENABLE ROW LEVEL SECURITY;

-- Políticas para extratos
CREATE POLICY "Entregadores podem ver seu próprio extrato"
  ON extratos FOR SELECT
  USING (true); -- Implementar autenticação depois

CREATE POLICY "Sistema pode inserir extratos"
  ON extratos FOR INSERT
  WITH CHECK (true);

-- =============================================
-- REALTIME (Supabase)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE extratos;

-- =============================================
-- FUNÇÃO: Atualizar saldo ao finalizar entrega
-- =============================================
CREATE OR REPLACE FUNCTION atualizar_saldo_entregador()
RETURNS TRIGGER AS $$
DECLARE
  valor_entrega DECIMAL(10,2);
  pedido_record RECORD;
BEGIN
  -- Quando pedido é finalizado (entregue)
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    -- Buscar dados do pedido
    SELECT valor_entregador, forma_pagamento INTO pedido_record
    FROM pedidos
    WHERE id = NEW.id;

    -- Verificar forma de pagamento
    -- Somente adiciona ao saldo se NÃO for dinheiro
    IF LOWER(COALESCE(pedido_record.forma_pagamento, '')) != 'dinheiro' THEN
      -- Se tiver valor_entregador, usar esse valor
      IF pedido_record.valor_entregador IS NOT NULL THEN
        valor_entrega := CAST(pedido_record.valor_entregador AS DECIMAL(10,2));
      ELSE
        -- Caso contrário, usar valor 0
        valor_entrega := 0;
      END IF;

      -- Atualizar saldo do entregador
      UPDATE entregadores
      SET saldo = saldo + valor_entrega
      WHERE id = NEW.entregador_id;

      -- Registrar no extrato
      INSERT INTO extratos (entregador_id, pedido_id, tipo, valor, descricao)
      VALUES (
        NEW.entregador_id,
        NEW.id,
        'credito',
        valor_entrega,
        'Entrega finalizada - Pedido ' || SUBSTRING(NEW.id::text FROM 1 FOR 8) || 
        ' (' || INITCAP(pedido_record.forma_pagamento) || ')'
      );
    ELSE
      -- Registrar no extrato que foi pagamento em dinheiro (não acumula saldo)
      INSERT INTO extratos (entregador_id, pedido_id, tipo, valor, descricao)
      VALUES (
        NEW.entregador_id,
        NEW.id,
        'credito',
        0,
        'Entrega finalizada - Pedido ' || SUBSTRING(NEW.id::text FROM 1 FOR 8) || 
        ' (Dinheiro - não acumula saldo)'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar saldo
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_entregador ON pedidos;
CREATE TRIGGER trigger_atualizar_saldo_entregador
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_saldo_entregador();

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE extratos IS 'Histórico de transações financeiras dos entregadores';
COMMENT ON COLUMN extratos.tipo IS 'Tipo de transação: credito, debito, saque';
COMMENT ON COLUMN extratos.valor IS 'Valor da transação (positivo para créditos, negativo para débitos/saques)';
