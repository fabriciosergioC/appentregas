/**
 * API unificada - Supabase + Socket.IO
 * 
 * Usa Supabase para operações CRUD
 * Usa Socket.IO para atualizações em tempo real
 */

import {
  supabase,
  entregadoresApi,
  pedidosApi,
  realtime,
  type Pedido,
  type Entregador,
} from './supabase';
import {
  conectarSocket,
  aguardarConexao,
  getSocket,
  eventosServidor,
  eventosCliente,
} from './socket';

// =============================================
// API UNIFICADA
// =============================================

export const api = {
  // =============================================
  // ENTREGADORES
  // =============================================

  async loginEntregador(nome: string, telefone: string) {
    const resultado = await entregadoresApi.login(nome, telefone);
    
    // Notificar via socket (opcional, para stats em tempo real)
    const socket = getSocket();
    if (socket?.connected && resultado.data) {
      socket.emit('entregador-login', { id: resultado.data.id });
    }
    
    return resultado;
  },

  async atualizarLocalizacao(entregadorId: string, lat: number, lng: number) {
    const resultado = await entregadoresApi.atualizarLocalizacao(entregadorId, lat, lng);
    
    // Emitir localização via socket para outros clientes
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(eventosCliente.ENVIAR_LOCALIZACAO, {
        entregadorId,
        lat,
        lng,
      });
    }
    
    return resultado;
  },

  async buscarEntregador(id: string) {
    return await entregadoresApi.buscarPorId(id);
  },

  async listarEntregadoresDisponiveis() {
    return await entregadoresApi.listarDisponiveis();
  },

  // =============================================
  // PEDIDOS
  // =============================================

  async listarPedidosDisponiveis() {
    return await pedidosApi.listarDisponiveis();
  },

  async meusPedidos(entregadorId: string) {
    return await pedidosApi.meusPedidos(entregadorId);
  },

  async aceitarPedido(id: string, entregadorId: string) {
    const resultado = await pedidosApi.aceitarPedido(id, entregadorId);
    console.log('📝 Pedido aceito no Supabase:', resultado);
    return resultado;
  },

  async iniciarEntrega(id: string) {
    const resultado = await pedidosApi.iniciarEntrega(id);
    
    // Notificar via socket
    const socket = getSocket();
    if (socket?.connected && resultado.data) {
      socket.emit('pedido-iniciado-event', { pedidoId: id });
    }
    
    return resultado;
  },

  async finalizarPedido(id: string) {
    const resultado = await pedidosApi.finalizarPedido(id);
    
    // Notificar via socket
    const socket = getSocket();
    if (socket?.connected && resultado.data) {
      socket.emit('pedido-finalizado-event', { pedidoId: id });
    }
    
    return resultado;
  },

  async criarPedido(cliente: string, endereco: string, itens: string[]) {
    const resultado = await pedidosApi.criarPedido(cliente, endereco, itens);
    
    // Socket.IO vai detectar automaticamente via Supabase Realtime
    // mas podemos emitir um evento adicional se necessário
    
    return resultado;
  },

  async listarTodosPedidos() {
    return await pedidosApi.listarTodos();
  },

  // =============================================
  // REALTIME (Supabase + Socket.IO)
  // =============================================

  conectarSocket() {
    return conectarSocket();
  },

  async aguardarSocket() {
    return await aguardarConexao();
  },

  // Assinar mudanças em tempo real com Supabase
  assinarPedidosTempoReal(
    onNovoPedido?: (pedido: Pedido) => void,
    onAtualizarPedido?: (pedido: Pedido) => void
  ) {
    return realtime.assinarPedidos(onNovoPedido, onAtualizarPedido);
  },

  assinarLocalizacaoTempoReal(onAtualizar: (entregador: Entregador) => void) {
    return realtime.assinarLocalizacao(onAtualizar);
  },

  // =============================================
  // SOCKET.IO EVENTOS
  // =============================================

  onNovoPedidoSocket(callback: (pedido: Pedido) => void) {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventosServidor.NOVO_PEDIDO, callback);
    return () => socket.off(eventosServidor.NOVO_PEDIDO, callback);
  },

  onPedidoAceitoSocket(callback: (pedido: Pedido) => void) {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventosServidor.PEDIDO_ACEITO, callback);
    return () => socket.off(eventosServidor.PEDIDO_ACEITO, callback);
  },

  onNovaLocalizacaoSocket(callback: (data: { entregadorId: string; lat: number; lng: number }) => void) {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventosServidor.NOVA_LOCALIZACAO, callback);
    return () => socket.off(eventosServidor.NOVA_LOCALIZACAO, callback);
  },

  onPedidoFinalizadoSocket(callback: (pedido: Pedido) => void) {
    const socket = getSocket();
    if (!socket) return;

    socket.on(eventosServidor.PEDIDO_FINALIZADO, callback);
    return () => socket.off(eventosServidor.PEDIDO_FINALIZADO, callback);
  },

  // =============================================
  // UTILITÁRIOS
  // =============================================

  desconectar() {
    const socket = getSocket();
    if (socket) {
      socket.disconnect();
    }
  },
};

// Exportar tipos
export type { Pedido, Entregador };

// Exportar Supabase diretamente para operações avançadas
export { supabase, entregadoresApi, pedidosApi, realtime };
