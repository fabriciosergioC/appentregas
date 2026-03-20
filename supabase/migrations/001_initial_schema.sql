-- Migration 001: Schema inicial do sistema de entregas
-- Criar tabelas, triggers e configurações de realtime

-- =============================================
-- EXTENSÕES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: entregadores
-- =============================================
CREATE TABLE IF NOT EXISTS entregadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  disponivel BOOLEAN DEFAULT true,
  localizacao_lat FLOAT8,
  localizacao_lng FLOAT8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por localização
CREATE INDEX IF NOT EXISTS idx_entregadores_disponivel ON entregadores(disponivel);
CREATE INDEX IF NOT EXISTS idx_entregadores_localizacao ON entregadores(localizacao_lat, localizacao_lng);

-- =============================================
-- TABELA: pedidos
-- =============================================
CREATE TYPE status_pedido AS ENUM ('pendente', 'aceito', 'em_transito', 'entregue');

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente TEXT NOT NULL,
  endereco TEXT NOT NULL,
  itens TEXT[] NOT NULL,
  status status_pedido DEFAULT 'pendente',
  entregador_id UUID REFERENCES entregadores(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_entregador ON pedidos(entregador_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);

-- =============================================
-- TABELA: entregadores_pedidos (histórico)
-- =============================================
CREATE TABLE IF NOT EXISTS entregadores_pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entregador_id UUID REFERENCES entregadores(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  aceito_em TIMESTAMPTZ,
  iniciado_em TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_entregadores_pedidos_entregador ON entregadores_pedidos(entregador_id);
CREATE INDEX IF NOT EXISTS idx_entregadores_pedidos_pedido ON entregadores_pedidos(pedido_id);

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para entregadores
CREATE TRIGGER update_entregadores_updated_at
  BEFORE UPDATE ON entregadores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pedidos
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGERS: histórico de pedidos
-- =============================================
CREATE OR REPLACE FUNCTION criar_historico_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando pedido é aceito
  IF NEW.status = 'aceito' AND OLD.status = 'pendente' THEN
    INSERT INTO entregadores_pedidos (entregador_id, pedido_id, aceito_em)
    VALUES (NEW.entregador_id, NEW.id, NOW());
  END IF;
  
  -- Quando pedido é iniciado
  IF NEW.status = 'em_transito' AND OLD.status = 'aceito' THEN
    UPDATE entregadores_pedidos
    SET iniciado_em = NOW()
    WHERE pedido_id = NEW.id;
  END IF;
  
  -- Quando pedido é finalizado
  IF NEW.status = 'entregue' AND OLD.status = 'em_transito' THEN
    UPDATE entregadores_pedidos
    SET finalizado_em = NOW()
    WHERE pedido_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_historico_pedido
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION criar_historico_pedido();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregadores_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas para entregadores
CREATE POLICY "Entregadores podem ver todos"
  ON entregadores FOR SELECT
  USING (true);

CREATE POLICY "Entregadores podem atualizar seu próprio perfil"
  ON entregadores FOR UPDATE
  USING (true); -- Implementar autenticação depois

CREATE POLICY "Entregadores podem inserir seu próprio perfil"
  ON entregadores FOR INSERT
  WITH CHECK (true);

-- Políticas para pedidos
CREATE POLICY "Pedidos podem ser vistos por todos"
  ON pedidos FOR SELECT
  USING (true);

CREATE POLICY "Pedidos podem ser criados por todos"
  ON pedidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Pedidos podem ser atualizados"
  ON pedidos FOR UPDATE
  USING (true);

-- Políticas para entregadores_pedidos
CREATE POLICY "Histórico pode ser visto por todos"
  ON entregadores_pedidos FOR SELECT
  USING (true);

-- =============================================
-- REALTIME (Supabase)
-- =============================================
-- Habilitar realtime nas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE entregadores;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE entregadores_pedidos;

-- =============================================
-- DADOS INICIAIS (SEED)
-- =============================================
INSERT INTO pedidos (cliente, endereco, itens, status) VALUES
  ('João Silva', 'Rua das Flores, 123 - Centro', ARRAY['Pizza Grande', 'Refrigerante 2L'], 'pendente'),
  ('Maria Santos', 'Av. Paulista, 456 - Bela Vista', ARRAY['Hambúrguer', 'Batata Frita'], 'pendente'),
  ('Pedro Oliveira', 'Rua Augusta, 789 - Consolação', ARRAY['Sushi Combo', 'Missoshiru'], 'pendente'),
  ('Ana Costa', 'Rua da Consolação, 321 - Higienópolis', ARRAY['Lasanha', 'Salada', 'Suco'], 'pendente'),
  ('Carlos Ferreira', 'Av. Faria Lima, 1000 - Itaim Bibi', ARRAY['Big Mac', 'Batata', 'Coca'], 'pendente');

-- =============================================
-- FUNÇÕES E VIEWS ÚTEIS
-- =============================================
-- View: Pedidos disponíveis
CREATE OR REPLACE VIEW vw_pedidos_disponiveis AS
SELECT * FROM pedidos
WHERE status = 'pendente'
ORDER BY created_at DESC;

-- View: Meus pedidos (entregador)
CREATE OR REPLACE VIEW vw_meus_pedidos AS
SELECT p.*, e.nome as entregador_nome, e.telefone as entregador_telefone
FROM pedidos p
LEFT JOIN entregadores e ON p.entregador_id = e.id
WHERE p.entregador_id IS NOT NULL;

-- View: Entregadores disponíveis
CREATE OR REPLACE VIEW vw_entregadores_disponiveis AS
SELECT * FROM entregadores
WHERE disponivel = true
ORDER BY created_at DESC;

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE entregadores IS 'Entregadores cadastrados no sistema';
COMMENT ON TABLE pedidos IS 'Pedidos de clientes para entrega';
COMMENT ON TABLE entregadores_pedidos IS 'Histórico de pedidos por entregador';
COMMENT ON COLUMN entregadores.localizacao_lat IS 'Latitude da localização atual';
COMMENT ON COLUMN entregadores.localizacao_lng IS 'Longitude da localização atual';
COMMENT ON COLUMN pedidos.status IS 'Status: pendente, aceito, em_transito, entregue';

