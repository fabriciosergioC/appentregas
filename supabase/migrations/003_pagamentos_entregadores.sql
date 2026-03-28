-- Migration 003: Pagamentos a entregadores
-- Adiciona tabela de pagamentos e função para abater saldo

-- =============================================
-- TABELA: pagamentos_entregadores
-- =============================================
CREATE TABLE IF NOT EXISTS pagamentos_entregadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entregador_id UUID REFERENCES entregadores(id) ON DELETE CASCADE,
  estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR(20) NOT NULL, -- pix, dinheiro, transferencia
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'realizado', -- realizado, cancelado
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  criado_por UUID REFERENCES estabelecimentos(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_entregador ON pagamentos_entregadores(entregador_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_estabelecimento ON pagamentos_entregadores(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_criado_em ON pagamentos_entregadores(criado_em DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE pagamentos_entregadores ENABLE ROW LEVEL SECURITY;

-- Políticas para pagamentos
CREATE POLICY "Pagamentos podem ser vistos por todos"
  ON pagamentos_entregadores FOR SELECT
  USING (true);

CREATE POLICY "Estabelecimentos podem inserir pagamentos"
  ON pagamentos_entregadores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Estabelecimentos podem cancelar seus pagamentos"
  ON pagamentos_entregadores FOR UPDATE
  USING (true);

-- =============================================
-- REALTIME (Supabase)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE pagamentos_entregadores;

-- =============================================
-- FUNÇÃO: Abater saldo do entregador
-- =============================================
CREATE OR REPLACE FUNCTION abater_saldo_entregador()
RETURNS TRIGGER AS $$
DECLARE
  saldo_atual DECIMAL(10,2);
BEGIN
  -- Quando pagamento é criado com status 'realizado'
  IF NEW.status = 'realizado' THEN
    -- Verificar saldo atual do entregador
    SELECT saldo INTO saldo_atual
    FROM entregadores
    WHERE id = NEW.entregador_id;

    -- Verificar se tem saldo suficiente
    IF saldo_atual < NEW.valor THEN
      RAISE EXCEPTION 'Saldo insuficiente do entregador. Saldo atual: %, Valor a abater: %', saldo_atual, NEW.valor;
    END IF;

    -- Abater do saldo
    UPDATE entregadores
    SET saldo = saldo - NEW.valor
    WHERE id = NEW.entregador_id;

    -- Registrar no extrato como debito
    INSERT INTO extratos (entregador_id, pedido_id, tipo, valor, descricao)
    VALUES (
      NEW.entregador_id,
      NULL,
      'debito',
      NEW.valor,
      'Pagamento recebido - ' || INITCAP(NEW.forma_pagamento) || 
      CASE WHEN NEW.descricao IS NOT NULL THEN ' - ' || NEW.descricao ELSE '' END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para abater saldo
DROP TRIGGER IF EXISTS trigger_abater_saldo_entregador ON pagamentos_entregadores;
CREATE TRIGGER trigger_abater_saldo_entregador
  AFTER INSERT ON pagamentos_entregadores
  FOR EACH ROW
  EXECUTE FUNCTION abater_saldo_entregador();

-- =============================================
-- FUNÇÃO: Reverter abate quando pagamento é cancelado
-- =============================================
CREATE OR REPLACE FUNCTION reverter_abate_saldo_entregador()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando pagamento é cancelado (de realizado para cancelado)
  IF OLD.status = 'realizado' AND NEW.status = 'cancelado' THEN
    -- Estornar o valor no saldo
    UPDATE entregadores
    SET saldo = saldo + OLD.valor
    WHERE id = OLD.entregador_id;

    -- Registrar no extrato como credito (estorno)
    INSERT INTO extratos (entregador_id, pedido_id, tipo, valor, descricao)
    VALUES (
      OLD.entregador_id,
      NULL,
      'credito',
      OLD.valor,
      'Estorno de pagamento cancelado - ' || INITCAP(OLD.forma_pagamento)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para reverter abate
DROP TRIGGER IF EXISTS trigger_reverter_abate_saldo_entregador ON pagamentos_entregadores;
CREATE TRIGGER trigger_reverter_abate_saldo_entregador
  AFTER UPDATE ON pagamentos_entregadores
  FOR EACH ROW
  EXECUTE FUNCTION reverter_abate_saldo_entregador();

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE pagamentos_entregadores IS 'Histórico de pagamentos realizados a entregadores';
COMMENT ON COLUMN pagamentos_entregadores.valor IS 'Valor pago ao entregador (será abatido do saldo)';
COMMENT ON COLUMN pagamentos_entregadores.forma_pagamento IS 'Forma de pagamento: pix, dinheiro, transferencia';

-- =============================================
-- VIEW: Resumo de pagamentos por entregador
-- =============================================
CREATE OR REPLACE VIEW vw_resumo_pagamentos_entregadores AS
SELECT 
  e.id as entregador_id,
  e.nome as entregador_nome,
  e.telefone as entregador_telefone,
  e.saldo as saldo_atual,
  COALESCE(SUM(CASE WHEN p.status = 'realizado' THEN p.valor ELSE 0 END), 0) as total_pago,
  COALESCE(SUM(CASE WHEN p.status = 'cancelado' THEN p.valor ELSE 0 END), 0) as total_cancelado,
  COUNT(CASE WHEN p.status = 'realizado' THEN 1 END) as qtd_pagamentos
FROM entregadores e
LEFT JOIN pagamentos_entregadores p ON e.id = p.entregador_id
GROUP BY e.id, e.nome, e.telefone, e.saldo;

COMMENT ON VIEW vw_resumo_pagamentos_entregadores IS 'Resumo de pagamentos por entregador com saldo atual';
