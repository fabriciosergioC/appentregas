# 🔗 Link de Rastreamento do Pedido

## Funcionalidade Implementada

O **Painel do Estabelecimento** agora gera automaticamente um **link de rastreamento** para cada pedido, permitindo que o cliente acompanhe a entrega em tempo real.

---

## 📋 Como Funciona

### 1. **Criação do Pedido**
Quando o estabelecimento cria um novo pedido:
- ✅ O pedido é enviado para os entregadores
- 🔗 Um **link de rastreamento único** é gerado automaticamente
- 📋 O link é exibido em um alerta para ser enviado ao cliente

### 2. **Liberação do Pedido**
Quando o estabelecimento libera o pedido para o entregador:
- ✅ O status é atualizado para "em_transito"
- 🔗 O link de rastreamento é **copiado automaticamente** para a área de transferência
- 📤 Botões de "Copiar Link" e "Enviar para Cliente" aparecem no card do pedido

### 3. **Acompanhamento do Cliente**
Ao acessar o link, o cliente vê:
- 🗺️ **Mapa em tempo real** com a localização do entregador
- 📊 **Status atualizado** do pedido (pendente, aceito, em trânsito, entregue)
- 🛵 **Dados do entregador** (nome e telefone)
- 📝 **Detalhes do pedido** (itens, valores, endereço)
- 📅 **Linha do tempo** com histórico de atualizações

---

## 🔗 Formato do Link

```
https://seu-site.com/painel-cliente/{ID_DO_PEDIDO}
```

Exemplo:
```
https://meuapp.com/painel-cliente/123e4567-e89b-12d3-a456-426614174000
```

---

## 📱 Como Usar no Painel do Estabelecimento

### **Opção 1: Após Criar o Pedido**
1. Preencha os dados do pedido
2. Clique em "📦 Criar Pedido e Enviar para Entregadores"
3. O link de rastreamento aparecerá no alerta
4. Copie e envie para o cliente (WhatsApp, SMS, etc.)

### **Opção 2: Após Liberar o Pedido**
1. Quando um entregador aceitar o pedido, clique em "🚀 Liberar Pedido para Entregador"
2. O link será copiado automaticamente
3. Use os botões na seção do pedido:
   - **📋 Copiar Link** - Copia o link para a área de transferência
   - **📤 Enviar para Cliente** - Abre o compartilhamento nativo do dispositivo

---

## 🎨 Interface do Painel do Estabelecimento

### Card do Pedido Liberado

```
┌─────────────────────────────────────────┐
│ Pedido #1234                            │
│ Cliente: João Silva                     │
│ 📍 Rua das Flores, 123                  │
│                                         │
│ ✅ Pedido liberado para o entregador    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔗 Link de Rastreamento do Pedido  │ │
│ │                                     │ │
│ │ [📋 Copiar Link] [📤 Enviar]       │ │
│ │                                     │ │
│ │ Envie para o cliente acompanhar    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔄 Atualização em Tempo Real

O link de rastreamento usa **Supabase Realtime** para atualizar automaticamente:

- **Localização do entregador** - Atualizada a cada 5 segundos
- **Status do pedido** - Mudanças de status são refletidas instantaneamente
- **Dados do entregador** - Informações atualizadas em tempo real

---

## 📤 Compartilhamento

### **Web Share API (Dispositivos Móveis)**
Em dispositivos que suportam a Web Share API:
- O botão "📤 Enviar para Cliente" abre o menu de compartilhamento nativo
- Pode enviar via WhatsApp, Telegram, SMS, E-mail, etc.

### **Fallback (Desktop)**
Em dispositivos que não suportam:
- O link é copiado automaticamente para a área de transferência
- O estabelecimento pode colar manualmente onde desejar

---

## 🔐 Segurança

- Cada link é **único** para cada pedido (UUID)
- Não requer autenticação do cliente
- Apenas **leitura** - o cliente não pode modificar o pedido
- Atualizações em tempo real via **Supabase Realtime**

---

## 💡 Dicas de Uso

1. **Envie o link imediatamente** após o entregador aceitar o pedido
2. **Use o WhatsApp** para envio rápido (botão de compartilhar)
3. **Salve o link** em caso de necessidade de reenvio
4. **Monitore o status** junto com o cliente

---

## 🛠️ Implementação Técnica

### Arquivos Modificados

| Arquivo | Função |
|---------|--------|
| `src/pages/estabelecimento/index.tsx` | Painel do Estabelecimento com geração de link |
| `src/app/painel-cliente/page.tsx` | Página inicial do painel do cliente |
| `src/app/painel-cliente/[id]/page.tsx` | Página de rastreamento do pedido |
| `src/components/painelCliente/PedidoTracker.tsx` | Componente de rastreamento |
| `src/components/painelCliente/RastreamentoMapa.tsx` | Mapa em tempo real |
| `src/hooks/useCompartilhamentoPedido.ts` | Hook de compartilhamento |

### Funções Principais

```typescript
// Gerar link de rastreamento
const gerarLinkRastreamento = (pedidoId: string) => {
  return `${window.location.origin}/painel-cliente/${pedidoId}`;
};

// Copiar link
const copiarLinkRastreamento = async (pedidoId: string) => {
  const link = gerarLinkRastreamento(pedidoId);
  await navigator.clipboard.writeText(link);
};

// Compartilhar
const compartilharLinkRastreamento = async (pedidoId: string) => {
  const link = gerarLinkRastreamento(pedidoId);
  if (navigator.share) {
    await navigator.share({ url: link });
  } else {
    await copiarLinkRastreamento(pedidoId);
  }
};
```

---

## 📊 Fluxo Completo

```
┌──────────────┐
│ Estabeleci-  │
│ mento        │
└──────┬───────┘
       │ 1. Cria Pedido
       ▼
┌──────────────┐
│   Pedido     │
│   Criado     │
└──────┬───────┘
       │ 2. Gera Link
       ▼
┌──────────────┐
│ Link de      │
│ Rastreamento │
└──────┬───────┘
       │ 3. Envia para Cliente
       ▼
┌──────────────┐
│   Cliente    │
│   Acessa     │
└──────┬───────┘
       │ 4. Acompanha em Tempo Real
       ▼
┌──────────────┐
│ Mapa +       │
│ Status       │
└──────────────┘
```

---

## ✅ Benefícios

- 🎯 **Transparência** - Cliente sabe exatamente onde está o pedido
- 📱 **Conveniência** - Acesso via link, sem necessidade de app
- 🔄 **Tempo Real** - Atualizações instantâneas
- 🚀 **Fácil Implementação** - Basta copiar e colar o código
- 💰 **Sem Custos** - Usa OpenStreetMap e Supabase (plano free)

---

**Feito com ❤️ para melhorar a experiência do cliente!**
