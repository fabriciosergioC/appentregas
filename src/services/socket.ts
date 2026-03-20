/**
 * Configuração do Socket.IO
 * 
 * Funciona em conjunto com Supabase Realtime
 * Socket.IO: eventos customizados e baixa latência
 * Supabase Realtime: sincronização com banco de dados
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
                   process.env.NEXT_PUBLIC_API_URL || 
                   'http://localhost:3001';

let socket: Socket | null = null;

export const conectarSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO conectado:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.IO desconectado');
  });

  socket.on('connect_error', (error) => {
    console.error('Erro Socket.IO:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Socket.IO reconectado após ${attemptNumber} tentativas`);
  });

  return socket;
};

export const aguardarConexao = (): Promise<Socket> => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      socket = conectarSocket();
    }

    if (socket.connected) {
      resolve(socket);
      return;
    }

    socket.once('connect', () => {
      resolve(socket!);
    });

    socket.once('connect_error', (error) => {
      reject(error);
    });

    // Timeout de 10 segundos
    setTimeout(() => {
      reject(new Error('Timeout ao conectar socket'));
    }, 10000);
  });
};

export const desconectarSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket.IO desconectado manualmente');
  }
};

export const getSocket = () => socket;

// =============================================
// EVENTOS DO SERVIDOR (Socket.IO)
// =============================================
export const eventosServidor = {
  NOVO_PEDIDO: 'novo-pedido',
  PEDIDO_ACEITO: 'pedido-aceito',
  NOVA_LOCALIZACAO: 'nova-localizacao',
  PEDIDO_FINALIZADO: 'pedido-finalizado',
  PEDIDO_INICIADO: 'pedido-iniciado',
};

// =============================================
// EVENTOS DO CLIENTE
// =============================================
export const eventosCliente = {
  ENTRAR_SALA_ENTREGADOR: 'entrar-sala-entregador',
  ENVIAR_LOCALIZACAO: 'localizacao',
  ENTREGADOR_LOGIN: 'entregador-login',
  PEDIDO_ACEITO_EVENT: 'pedido-aceito-event',
  PEDIDO_INICIADO_EVENT: 'pedido-iniciado-event',
  PEDIDO_FINALIZADO_EVENT: 'pedido-finalizado-event',
};

// =============================================
// HELPERS PARA SALAS
// =============================================

export const entrarSalaEntregador = (entregadorId: string) => {
  if (!socket) return;
  socket.emit(eventosCliente.ENTRAR_SALA_ENTREGADOR, entregadorId);
  console.log(`📍 Entregador ${entregadorId} entrou na sala`);
};

export const sairSalaEntregador = (entregadorId: string) => {
  if (!socket) return;
  socket.emit('sair-sala-entregador', entregadorId);
};

// =============================================
// LISTENERS PRÉ-CONFIGURADOS
// =============================================

export const criarListeners = {
  novoPedido: (callback: (pedido: any) => void) => {
    if (!socket) return () => {};
    socket.on(eventosServidor.NOVO_PEDIDO, callback);
    return () => socket?.off(eventosServidor.NOVO_PEDIDO, callback);
  },

  pedidoAceito: (callback: (pedido: any) => void) => {
    if (!socket) return () => {};
    socket.on(eventosServidor.PEDIDO_ACEITO, callback);
    return () => socket?.off(eventosServidor.PEDIDO_ACEITO, callback);
  },

  novaLocalizacao: (callback: (data: any) => void) => {
    if (!socket) return () => {};
    socket.on(eventosServidor.NOVA_LOCALIZACAO, callback);
    return () => socket?.off(eventosServidor.NOVA_LOCALIZACAO, callback);
  },

  pedidoFinalizado: (callback: (pedido: any) => void) => {
    if (!socket) return () => {};
    socket.on(eventosServidor.PEDIDO_FINALIZADO, callback);
    return () => socket?.off(eventosServidor.PEDIDO_FINALIZADO, callback);
  },
};
