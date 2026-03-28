# 🔧 Correção do Erro de Cadastro

## ❌ Erro Ocorrendo:

```
null value in column "telefone" of relation "estabelecimentos" violates not-null constraint
```

## 🛠️ Solução:

### Opção 1: Executar SQL no Supabase (Recomendado)

1. **Acesse:** https://app.supabase.com/project/_/sql/new

2. **Copie e execute este SQL:**

```sql
-- Remover NOT NULL da coluna telefone
ALTER TABLE estabelecimentos 
  ALTER COLUMN telefone DROP NOT NULL,
  ALTER COLUMN telefone SET DEFAULT '';

-- Remover NOT NULL da coluna cnpj
ALTER TABLE estabelecimentos 
  ALTER COLUMN cnpj DROP NOT NULL,
  ALTER COLUMN cnpj SET DEFAULT '';

-- Atualizar registros existentes
UPDATE estabelecimentos 
SET 
  telefone = COALESCE(telefone, ''),
  cnpj = COALESCE(cnpj, '');
```

3. **Clique em "Run"** ou pressione `Ctrl+Enter`

4. **Teste o cadastro novamente**

---

### Opção 2: Executar Migration

O arquivo `supabase/migrations/007_fix_estabelecimentos.sql` já está pronto.

1. Acesse: https://app.supabase.com/project/_/sql/new
2. Copie o conteúdo do arquivo
3. Execute

---

## ✅ Após Corrigir:

1. **Recarregue a página** de cadastro
2. **Preencha os dados**
3. **Clique em "Cadastrar"**
4. **Link aparece na tela** ✅

---

## 📝 Campos da Tabela:

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| email | text | NO | - |
| senha_hash | text | NO | - |
| nome_estabelecimento | text | NO | - |
| nome_responsavel | text | NO | - |
| telefone | text | **YES** | '' |
| cnpj | text | **YES** | '' |
| ativo | boolean | NO | false |

---

**Pronto!** Após executar o SQL, o cadastro funcionará perfeitamente! 🎉
