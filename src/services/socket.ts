/**
 * Supabase Realtime - Substituindo Socket.IO
 *
 * Este arquivo mantém compatibilidade com o código existente
 * mas usa apenas Supabase Realtime para comunicação em tempo real
 * Documentação: https://supabase.com/docs/guides/realtime
 */

// =============================================
// PLACEHOLDERS PARA COMPATIBILIDADE
// =============================================
// Estas funções existem apenas para compatibilidade com código legado
// O realtime real é feito via Supabase (ver src/services/realtime.ts)

let conectado = false;

export const conectarSocket = () => {
  console.log('📡 [Supabase Realtime] Socket.IO removido - usando Supabase Realtime');
  conectado = true;
  return null;
};

export const aguardarConexao = (): Promise<null> => {
  return Promise.resolve(null);
};

export const desconectarSocket = () => {
  conectado = false;
  console.log('🔌 [Supabase Realtime] Desconectado');
};

export const getSocket = () => null;

// =============================================
// EVENTOS (para compatibilidade com código antigo)
// =============================================
// Estes eventos não são mais usados - o Supabase Realtime detecta
// mudanças automaticamente via postgres_changes

export const eventosServidor = {
  NOVO_PEDIDO: 'novo-pedido',
  PEDIDO_ACEITO: 'pedido-aceito',
  NOVA_LOCALIZACAO: 'nova-localizacao',
  PEDIDO_FINALIZADO: 'pedido-finalizado',
  PEDIDO_INICIADO: 'pedido-iniciado',
};

export const eventosCliente = {
  ENTRAR_SALA_ENTREGADOR: 'entrar-sala-entregador',
  ENVIAR_LOCALIZACAO: 'localizacao',
  ENTREGADOR_LOGIN: 'entregador-login',
  PEDIDO_ACEITO_EVENT: 'pedido-aceito-event',
  PEDIDO_INICIADO_EVENT: 'pedido-iniciado-event',
  PEDIDO_FINALIZADO_EVENT: 'pedido-finalizado-event',
};

// =============================================
// HELPERS PARA COMPATIBILIDADE
// =============================================

export const entrarSalaEntregador = (entregadorId: string) => {
  console.log(`📍 [Supabase Realtime] Entregador ${entregadorId} registrado (sem Socket.IO)`);
};

export const sairSalaEntregador = () => {
  // No-op
};

// =============================================
// LISTENERS PLACEHOLDER
// =============================================
// Use src/services/realtime.ts para listeners reais

export const criarListeners = {
  novoPedido: () => () => {},
  pedidoAceito: () => () => {},
  novaLocalizacao: () => () => {},
  pedidoFinalizado: () => () => {},
};
