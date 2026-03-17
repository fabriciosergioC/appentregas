# 🚀 Deploy Simplificado - Apenas Netlify + Supabase

## ✅ Arquitetura

```
┌─────────────────┐
│   Netlify       │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTPS + Supabase Realtime
         │
┌────────▼────────┐
│   Supabase      │
│   - Banco       │
│   - Realtime    │
│   - Auth        │
└─────────────────┘
```

**Sem backend separado!** O Supabase Realtime substitui o WebSocket.

---

## 📦 Passo 1: Configurar Supabase

### 1.1 Habilitar Realtime

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Database** → **Replication**
4. Habilite Realtime para:
   - ✅ `pedidos`
   - ✅ `entregadores`
   - ✅ `entregadores_pedidos`

### 1.2 Verificar RLS

As políticas já estão configuradas no arquivo `001_initial_schema.sql`.

---

## 📦 Passo 2: Atualizar Código

O código já está configurado para usar Supabase Realtime!

**Arquivos principais:**
- `src/services/supabase.ts` - Cliente Supabase
- `src/services/socket.ts` - Usa Supabase Realtime + Socket.IO (opcional)
- `src/pages/pedidos/index.tsx` - Escuta mudanças em tempo real

---

## 📦 Passo 3: Deploy no Netlify

### 3.1 Preparar

```bash
# Atualize o .env.local com as chaves do Supabase
# Já está configurado!
```

### 3.2 Netlify

1. Acesse https://app.netlify.com
2. **Add new site** → **Import an existing project**
3. Conecte com GitHub
4. Selecione o repositório `entregas`
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

### 3.3 Variáveis de Ambiente

No Netlify, vá em **Site settings** → **Environment variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lhvfjaimrsrbvketayck.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodmZqYWltcnNyYnZrZXRheWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzE2NjIsImV4cCI6MjA4OTMwNzY2Mn0.Y394p7pCANhbBeJNHmkUDBsbDZFOWSohF0Z9_7Xf11I` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodmZqYWltcnNyYnZrZXRheWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczMTY2MiwiZXhwIjoyMDg5MzA3NjYyfQ.2FWdwVg7SAb70o2jMrKoWY0QqQT0zNRs5RD0aogkAZk` |

### 3.4 Deploy

1. Clique em **Deploy site**
2. Aguarde o build
3. Seu site: `https://SEU_SITE.netlify.app`

---

## 🧪 Testar

1. **Acesse o site**
2. **Faça login** como entregador
3. **Crie pedidos** no estabelecimento
4. **Verifique** se aparece em tempo real no app do entregador

---

## ⚠️ Importante: Remover Backend WebSocket

O backend WebSocket (`server/index.ts`) **não é mais necessário**!

Você pode:
1. **Remover** a pasta `server/`
2. **Remover** `nodemon.json`
3. **Atualizar** `package.json` para remover scripts do servidor

Vou criar um script para limpar:

```bash
# Opcional: Remover backend
rmdir /s /q server
del nodemon.json
del .env.production.example
```

---

## 📊 Fluxo de Dados

```
Estabelecimento → Supabase (INSERT pedidos)
                        ↓
                  Supabase Realtime
                        ↓
          Netlify (App Entregador) ← WebSocket
```

**Sem servidor intermediário!**

---

## ✅ Vantagens

- ✅ **Mais simples** - Apenas 2 serviços
- ✅ **Mais barato** - Sem backend separado
- ✅ **Mais rápido** - Conexão direta
- ✅ **Mais confiável** - Supabase gerencia WebSocket

---

## 🐛 Problemas Comuns

### Pedidos não atualizam em tempo real

**Solução:**
1. Verifique se Realtime está habilitado no Supabase
2. Confira se RLS está configurado corretamente
3. Teste em `/teste-pedidos` (se existir)

### Erro de CORS

**Solução:**
- Netlify já gerencia CORS automaticamente
- Supabase também

### Build falha no Netlify

**Solução:**
```bash
# Teste build local
npm run build

# Se funcionar, push e redeploy
git push origin main
```

---

## 🎉 Pronto!

Agora você tem:
- ✅ Frontend no Netlify
- ✅ Banco + Realtime no Supabase
- ✅ Sem backend para gerenciar

**URLs:**
- Frontend: `https://SEU_SITE.netlify.app`
- Supabase: `https://lhvfjaimrsrbvketayck.supabase.co`
