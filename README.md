# 🚀 App de Entregas - Supabase + WebSocket

Sistema de gerenciamento de entregas em tempo real com **Supabase** (banco de dados) e **Socket.IO** (WebSocket).

---

## 📋 Funcionalidades

- ✅ **Cadastro de Entregadores** - Login simples com nome e telefone
- ✅ **Pedidos em Tempo Real** - Notificações instantâneas via WebSocket
- ✅ **Rastreamento de Localização** - Atualização de localização em tempo real
- ✅ **Status de Pedidos** - Pendente → Aceito → Em Trânsito → Entregue
- ✅ **Banco de Dados PostgreSQL** - Supabase com Realtime habilitado
- ✅ **PWA** - Funciona offline com cache

---

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │◄───────►│   Supabase       │
│   (Next.js)     │         │   (PostgreSQL)   │
└─────────────────┘         └──────────────────┘
        │                           ▲
        │ WebSocket                 │ Realtime
        ▼                           │
┌─────────────────┐                 │
│   Socket.IO     │─────────────────┘
│   (WebSocket)   │
└─────────────────┘
```

### Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **UI** | Tailwind CSS, Leaflet (Mapas) |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime + Socket.IO |
| **WebSocket** | Socket.IO |
| **PWA** | next-pwa, Workbox |

---

## 🚀 Começando

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

#### a) Criar Projeto
1. Acesse https://app.supabase.com
2. **New Project**
3. Preencha dados do projeto

#### b) Rodar Migration
1. Vá em **SQL Editor** no dashboard do Supabase
2. Copie o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Cole e execute no SQL Editor

#### c) Habilitar Realtime
1. Vá em **Database** → **Replication**
2. Certifique-se que as tabelas estão com realtime habilitado:
   - ✅ `entregadores`
   - ✅ `pedidos`
   - ✅ `entregadores_pedidos`

#### d) Pegar Credenciais
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (use apenas no backend!)

### 3. Configurar Variáveis de Ambiente

Copie `.env.local.example` para `.env`:

```bash
cp .env.local.example .env
```

Preencha com suas credenciais do Supabase:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key

# WebSocket
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
```

### 4. Rodar o Projeto

#### Desenvolvimento (Frontend + Backend)

```bash
# Rodar tudo junto (recomendado)
npm run dev:all

# Ou separadamente:
npm run dev          # Frontend (Next.js) - porta 3000
npm run dev:server   # Backend (Socket.IO) - porta 3001
```

#### Produção

```bash
# Build do frontend
npm run build

# Rodar frontend
npm start

# Rodar backend
npm run start:server
```

---

## 📁 Estrutura do Projeto

```
entregas-master/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── pages/                  # Pages Router (compatibilidade)
│   ├── components/             # Componentes React
│   ├── hooks/                  # Hooks personalizados
│   └── services/
│       ├── api.ts              # API unificada (Supabase + Socket)
│       ├── supabase.ts         # Cliente Supabase
│       └── socket.ts           # Cliente Socket.IO
├── src/lib/
│   └── supabase-server.ts      # Supabase server-side
├── server/
│   └── index.ts                # Servidor Socket.IO
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env                        # Variáveis de ambiente
├── .env.local.example          # Exemplo de env
├── package.json
└── README.md
```

---

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Roda frontend (porta 3000) |
| `npm run dev:server` | Roda backend WebSocket (porta 3001) |
| `npm run dev:all` | Roda frontend + backend juntos |
| `npm run build` | Build de produção do Next.js |
| `npm start` | Roda frontend em produção |
| `npm run start:server` | Roda backend em produção |
| `npm run lint` | Roda linter |

---

## 🗄️ Banco de Dados

### Tabelas

#### `entregadores`
- `id` (UUID) - Identificador único
- `nome` (TEXT) - Nome do entregador
- `telefone` (TEXT) - Telefone (único)
- `disponivel` (BOOLEAN) - Status de disponibilidade
- `localizacao_lat` (FLOAT8) - Latitude
- `localizacao_lng` (FLOAT8) - Longitude

#### `pedidos`
- `id` (UUID) - Identificador único
- `cliente` (TEXT) - Nome do cliente
- `endereco` (TEXT) - Endereço de entrega
- `itens` (TEXT[]) - Lista de itens
- `status` (ENUM) - pendente | aceito | em_transito | entregue
- `entregador_id` (UUID) - Entregador responsável

#### `entregadores_pedidos`
- Histórico de pedidos por entregador

---

## 🔄 Fluxo de Trabalho

### 1. Entregador faz login
```typescript
import { api } from '@/services/api';

const { data, error } = await api.loginEntregador('João', '11999999999');
localStorage.setItem('entregador', JSON.stringify(data));
```

### 2. Receber pedidos em tempo real
```typescript
import { api } from '@/services/api';

// Assinar novos pedidos (Supabase Realtime)
api.assinarPedidosTempoReal(
  (novoPedido) => {
    console.log('Novo pedido:', novoPedido);
    // Adicionar na lista
  },
  (pedidoAtualizado) => {
    console.log('Pedido atualizado:', pedidoAtualizado);
    // Atualizar na lista
  }
);

// Conectar WebSocket (Socket.IO)
api.conectarSocket();
```

### 3. Aceitar pedido
```typescript
await api.aceitarPedido(pedidoId, entregadorId);
```

### 4. Atualizar localização
```typescript
await api.atualizarLocalizacao(entregadorId, lat, lng);
```

---

## 🌐 Deploy

### Frontend (Vercel)

1. Conecte seu repositório GitHub na Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SOCKET_URL` (URL do backend)

### Backend (Render / Railway)

1. Crie um Web Service
2. Build Command: `npm install`
3. Start Command: `npm run start:server`
4. Variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT`
   - `CORS_ORIGIN`

### Banco de Dados

O Supabase já é hospedado! 🎉

---

## 🔐 Segurança

### Row Level Security (RLS)

O schema já inclui políticas RLS básicas. Para produção, personalize:

```sql
-- Exemplo: Apenas entregador pode atualizar sua localização
CREATE POLICY "Entregador atualiza sua localização"
  ON entregadores FOR UPDATE
  USING (auth.uid()::text = id::text);
```

### Variáveis de Ambiente

⚠️ **Nunca exponha** `SUPABASE_SERVICE_ROLE_KEY` no frontend!

- `NEXT_PUBLIC_*` → Seguro para frontend
- `SUPABASE_SERVICE_ROLE_KEY` → Apenas backend

---

## 📱 PWA (Progressive Web App)

O app é um PWA e pode ser instalado no celular:

1. Acesse o app no navegador
2. Toque em **Adicionar à tela inicial**
3. Ícone aparecerá na home screen

### Cache

- **Mapas**: OpenStreetMap tiles (30 dias)
- **Pedidos**: Cache em tempo real via WebSocket
- **Offline**: Funcionalidades básicas disponíveis

---

## 🧪 Testes

### Health Check do Backend

```bash
curl http://localhost:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2026-03-17T...",
  "socketsConectados": 5,
  "ambiente": "development"
}
```

### Debug de Sockets

```bash
curl http://localhost:3001/debug/sockets
```

---

## 🛠️ Troubleshooting

### WebSocket não conecta

1. Verifique se o backend está rodando: `http://localhost:3001/health`
2. Confira `NEXT_PUBLIC_SOCKET_URL` no `.env`
3. Verifique CORS no backend

### Supabase não conecta

1. Verifique as URLs e chaves no `.env`
2. Teste no dashboard do Supabase
3. Confira se as tabelas existem

### Pedidos não atualizam em tempo real

1. Verifique se Realtime está habilitado nas tabelas
2. Confira se o WebSocket está conectado
3. Veja os logs do console do navegador

---

## 📚 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [Next.js Docs](https://nextjs.org/docs)
- [Leaflet Docs](https://leafletjs.com/)

---

## 📄 Arquivos de Documentação

- `GPS_PERMISSAO.md` - Como configurar permissão de GPS no celular
- `NAVEGACAO_EXTERNA.md` - Integração com Google Maps / Waze
- `TESTE_CELULAR.md` - Como testar no celular

---

## 🎯 Próximos Passos

- [ ] Implementar autenticação com Supabase Auth
- [ ] Adicionar histórico de corridas
- [ ] Criar dashboard administrativo
- [ ] Implementar rotas otimizadas
- [ ] Adicionar notificações push

---

**Feito com ❤️ usando Supabase + Socket.IO + Next.js**
