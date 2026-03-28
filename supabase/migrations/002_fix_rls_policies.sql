-- Migration 002: Corrigir políticas de RLS para entregadores_pedidos
-- Problema: Trigger de criar_historico_pedido falha ao inserir na tabela entregadores_pedidos

-- =============================================
-- POLÍTICAS PARA ENTREGADORES_PEDIDOS
-- =============================================

-- Permitir inserção para todos (necessário para o trigger funcionar)
DROP POLICY IF EXISTS "Histórico pode ser inserido por todos" ON entregadores_pedidos;
CREATE POLICY "Histórico pode ser inserido por todos"
  ON entregadores_pedidos FOR INSERT
  WITH CHECK (true);

-- Permitir atualização para todos (necessário para o trigger funcionar)
DROP POLICY IF EXISTS "Histórico pode ser atualizado por todos" ON entregadores_pedidos;
CREATE POLICY "Histórico pode ser atualizado por todos"
  ON entregadores_pedidos FOR UPDATE
  USING (true);

-- Manter política de leitura existente
DROP POLICY IF EXISTS "Histórico pode ser visto por todos" ON entregadores_pedidos;
CREATE POLICY "Histórico pode ser visto por todos"
  ON entregadores_pedidos FOR SELECT
  USING (true);

-- =============================================
-- POLÍTICAS PARA PEDIDOS (garantir que estão corretas)
-- =============================================

-- Permitir UPDATE em pedidos (necessário para aceitar pedido)
DROP POLICY IF EXISTS "Pedidos podem ser atualizados por todos" ON pedidos;
CREATE POLICY "Pedidos podem ser atualizados por todos"
  ON pedidos FOR UPDATE
  USING (true);

-- =============================================
-- REINICIAR TRIGGER (opcional, apenas se necessário)
-- =============================================

-- Remover e recriar o trigger para garantir que está funcionando
DROP TRIGGER IF EXISTS trigger_criar_historico_pedido ON pedidos;
CREATE TRIGGER trigger_criar_historico_pedido
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION criar_historico_pedido();
