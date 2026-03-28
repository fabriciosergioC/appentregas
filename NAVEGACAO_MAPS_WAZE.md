# Navegação com Google Maps e Waze

## Funcionalidade

Ao clicar em **"Iniciar Entrega"**, o sistema agora abre automaticamente uma opção para o entregador escolher entre **Google Maps** ou **Waze** para navegação até o endereço do cliente.

## Como Funciona

### No Celular (Android/iOS)

1. O entregador clica em **"Iniciar Entrega"** no pedido
2. Um popup aparece perguntando qual app de navegação usar:
   - **OK** → Abre o **Google Maps**
   - **Cancelar** → Abre o **Waze**
3. O app de navegação é aberto com o endereço do cliente já preenchido
4. O entregador só precisa iniciar a rota

### No Computador (Desktop)

1. O entregador clica em **"Iniciar Entrega"**
2. O Google Maps é aberto em uma nova aba do navegador
3. O endereço do cliente já está pesquisado

## Implementação

### Arquivos Modificados

- `src/utils/navegacao.ts` - Nova função utilitária para abrir apps de navegação
- `src/components/pedidoCard/PedidoCard.tsx` - Botão "Iniciar Entrega" agora chama o app de navegação
- `src/pages/mapa/index.tsx` - Página de mapa também integra com apps de navegação

### Funções Utilitárias

```typescript
// Abre diretamente o app de navegação
abrirNavegacao(endereco: string, app?: 'google' | 'waze' | 'both')

// Mostra prompt para usuário escolher entre Google Maps ou Waze
escolherAppNavegacao(endereco: string)
```

## URLs de Navegação

### Google Maps
- **Mobile**: `google.navigation:q={endereco}`
- **Web**: `https://www.google.com/maps/dir/?api=1&destination={endereco}`

### Waze
- **Mobile**: `waze://?q={endereco}&navigate=yes`
- **Web**: `https://waze.com/ul?q={endereco}&navigate=yes`

## Fluxo Completo

```
[Pedido Aceito] 
    ↓
[Clicar em "Iniciar Entrega"]
    ↓
[Chama API para atualizar status → "em_transito"]
    ↓
[Abre popup de escolha do app]
    ↓
[Usuário escolhe Google Maps ou Waze]
    ↓
[App de navegação abre com o endereço]
    ↓
[Entregador inicia navegação]
```

## Observações

- No **Android**, o sistema tenta abrir o app nativo primeiro
- Se o app não estiver instalado, abre a versão web em uma nova aba
- No **iOS**, o comportamento é similar, dependendo dos apps instalados
- No **Desktop**, sempre abre a versão web do Google Maps
