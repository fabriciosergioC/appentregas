# 🚀 Guia Rápido de Deploy - Netlify

## ✅ Pré-requisitos

1. **Backend rodando separadamente** (Render, Railway, etc.)
2. **Variáveis de ambiente configuradas**
3. **Projeto no GitHub**

---

## 📦 Opção 1: Netlify (Recomendado - Automático)

### Passo 1: Preparar o Projeto

1. **Atualize o `.env.production`** com a URL do backend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lhvfjaimrsrbvketayck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SOCKET_URL=https://SEU_BACKEND_AQUI
NEXT_PUBLIC_API_URL=https://SEU_BACKEND_AQUI
```

2. **Commit e push**:

```bash
git add .
git commit -m "Preparando deploy para Netlify"
git push origin main
```

### Passo 2: Configurar no Netlify

1. Acesse https://app.netlify.com
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Conecte com **GitHub**
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. Clique em **"Deploy site"**

### Passo 3: Variáveis de Ambiente

No dashboard do Netlify:
1. Vá em **Site settings** → **Environment variables**
2. Adicione:

| Chave | Valor |
|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lhvfjaimrsrbvketayck.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (sua chave anon completa) |
| `NEXT_PUBLIC_SOCKET_URL` | `https://SEU_BACKEND_AQUI` |
| `NEXT_PUBLIC_API_URL` | `https://SEU_BACKEND_AQUI` |

3. **Redeploy**: Vá em **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## 🎯 Opção 2: Vercel (Mais Simples)

1. Acesse https://vercel.com
2. **Add New** → **Project**
3. Importe do GitHub
4. Configure as variáveis de ambiente
5. **Deploy**

A Vercel detecta Next.js automaticamente!

---

## 🧪 Testar

Após o deploy:

1. Acesse a URL gerada (ex: `https://seu-site.netlify.app`)
2. Faça login como entregador
3. Teste criar pedidos no estabelecimento
4. Verifique se aparece no app do entregador

---

## ⚠️ Problemas Comuns

### "Failed to fetch"

**Causa:** Backend não está no ar ou URL errada

**Solução:**
1. Teste: `https://SEU_BACKEND_URL/health`
2. Confira variáveis no Netlify

### WebSocket não conecta

**Causa:** CORS ou URL errada

**Solução:**
1. Backend: `CORS_ORIGIN=*`
2. Frontend: URL correta nas variáveis

### Build falha

**Solução:**
```bash
# Build local para testar
npm run build

# Se funcionar, suba pro GitHub
git push origin main
```

---

## 📊 URLs

| Serviço | Exemplo |
|---------|---------|
| Frontend | `https://app-entregador.netlify.app` |
| Supabase | `https://lhvfjaimrsrbvketayck.supabase.co` |

---

## 💡 Dicas

1. **Netlify**: Build gratuito e ilimitado
2. **Backend**: Render tem plano free com 15min de timeout
3. **WebSocket**: Use WSS em produção
4. **Logs**: Sempre verifique os logs no Netlify

**Dúvidas?** Veja os logs em **Deploys** → **Deploy log**
