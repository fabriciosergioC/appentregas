# ⚡ Guia Rápido - Configurar Supabase

## 🎯 Passo a Passo (5 minutos)

### 1. Criar Projeto Supabase (2 min)

1. Acesse https://app.supabase.com
2. **New Project**
3. Preencha:
   - **Name**: entregas-app
   - **Database Password**: (guarde bem!)
   - **Region**: (mais próxima de você)
4. **Create new project**

---

### 2. Rodar Migration (1 min)

1. No dashboard do projeto, vá em **SQL Editor** (barra lateral)
2. Clique em **New query**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql` no seu projeto
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** ou pressione `Ctrl+Enter`

✅ **Sucesso!** Você deve ver "Success. No rows returned"

---

### 3. Pegar Credenciais (30 seg)

1. Vá em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie 3 valores:

| Valor | Onde pegar |
|-------|------------|
| **Project URL** | Em "Project URL" |
| **anon public** | Em "Project API keys" → `anon` `public` |
| **service_role** | Em "Project API keys" → `service_role` ⚠️ |

---

### 4. Configurar .env (1 min)

1. No seu projeto, abra o arquivo `.env`
2. Substitua os valores:

```env
# Copie do passo 3
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Mantenha assim para desenvolvimento
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
```

3. Salve o arquivo

---

### 5. Rodar o Projeto (30 seg)

```bash
# Instalar dependências (se necessário)
npm install

# Rodar frontend + backend
npm run dev:all
```

✅ **Pronto!**

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## 🧪 Testar

### 1. Health Check

Acesse: http://localhost:3001/health

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "...",
  "socketsConectados": 0,
  "ambiente": "development"
}
```

### 2. Verificar Banco

No dashboard do Supabase:

1. Vá em **Table Editor**
2. Você deve ver as tabelas:
   - ✅ `entregadores`
   - ✅ `pedidos`
   - ✅ `entregadores_pedidos`
   - ✅ `vw_pedidos_disponiveis` (view)

### 3. Testar Pedidos

Os dados iniciais já foram criados pela migration!

No **Table Editor** → `pedidos`, você deve ver 5 pedidos de exemplo.

---

## 🔧 Habilitar Realtime (Importante!)

Para o WebSocket funcionar com o banco:

1. No dashboard do Supabase, vá em **Database**
2. Clique em **Replication**
3. Verifique se as tabelas estão com ✅ em "Realtime enabled":
   - `entregadores` → ✅
   - `pedidos` → ✅
   - `entregadores_pedidos` → ✅

Se não estiverem habilitadas:
1. Clique em **Enable** para cada tabela
2. Aguarde confirmar

---

## ❌ Problemas Comuns

### "relation does not exist"

**Solução:** A migration não rodou corretamente.
- Volte no **SQL Editor**
- Execute o script novamente
- Verifique se não há erros

### "Invalid API key"

**Solução:** Chaves erradas no `.env`
- Confira se copiou as chaves corretas
- `NEXT_PUBLIC_SUPABASE_URL` deve começar com `https://`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` começa com `eyJ...`
- `SUPABASE_SERVICE_ROLE_KEY` começa com `eyJ...`

### WebSocket não conecta

**Solução:** Backend não está rodando
- Execute `npm run dev:server` em um terminal separado
- Verifique se a porta 3001 está disponível

---

## 📚 Próximos Passos

1. ✅ Projeto Supabase criado
2. ✅ Migration rodada
3. ✅ Variáveis de ambiente configuradas
4. ✅ Realtime habilitado
5. 🚀 **Agora é só usar!**

Para mais detalhes, veja o `README.md` principal.

---

**Dúvidas?** Consulte a [documentação do Supabase](https://supabase.com/docs)
