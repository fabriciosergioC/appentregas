-- =============================================
-- REMOVER ENTREGADORES: FABRICIO E SERGIO
-- =============================================

-- Passo 1: Remover a constraint de foreign key temporariamente
ALTER TABLE pedidos
DROP CONSTRAINT IF EXISTS pedidos_entregador_id_fkey;

-- Passo 2: Remover pedidos associados aos entregadores FABRICIO e SERGIO
DELETE FROM pedidos
WHERE entregador_id IN (
  SELECT id FROM entregadores
  WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO')
);

-- Passo 3: Deletar os entregadores FABRICIO e SERGIO
DELETE FROM entregadores
WHERE UPPER(nome) IN ('FABRICIO', 'SERGIO');

-- Passo 4: Re-adicionar a constraint de foreign key com ON DELETE SET NULL
ALTER TABLE pedidos
ADD CONSTRAINT pedidos_entregador_id_fkey 
  FOREIGN KEY (entregador_id) 
  REFERENCES entregadores(id) 
  ON DELETE SET NULL;

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON THIS IS 'Migration para remover entregadores de teste (FABRICIO e SERGIO) - remove FK, deleta e recria com ON DELETE SET NULL';
