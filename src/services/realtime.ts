/**
 * Supabase Realtime
 *
 * Substitui Socket.IO usando o realtime nativo do Supabase
 * Documentação: https://supabase.com/docs/guides/realtime
 */

import { supabase, type Pedido, type Entregador } from './supabase';

// Canal realtime para pedidos
let pedidosChannel: ReturnType<typeof supabase.channel> | null = null;

// Canal realtime para localização
let localizacaoChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Assinar mudanças em pedidos em tempo real
 */
export const assinarPedidos = (
  onNovoPedido?: (pedido: Pedido) => void,
  onAtualizarPedido?: (pedido: Pedido) => void
) => {
  if (pedidosChannel) {
    console.log('⚠️ Canal de pedidos já existe');
    return pedidosChannel;
  }

  console.log('📡 Assinando canal de pedidos...');

  pedidosChannel = supabase
    .channel('pedidos-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos',
      },
      (payload) => {
        console.log('📦 [REALTIME] Novo pedido:', payload.new);
        onNovoPedido?.(payload.new as Pedido);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
      },
      (payload) => {
        console.log('📝 [REALTIME] Pedido atualizado:', payload.new);
        onAtualizarPedido?.(payload.new as Pedido);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal de pedidos conectado');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erro no canal de pedidos');
      }
    });

  return pedidosChannel;
};

/**
 * Assinar mudanças em localização de entregadores
 */
export const assinarLocalizacao = (
  onAtualizarLocalizacao: (entregador: Entregador) => void
) => {
  if (localizacaoChannel) {
    console.log('⚠️ Canal de localização já existe');
    return localizacaoChannel;
  }

  console.log('📡 Assinando canal de localização...');

  localizacaoChannel = supabase
    .channel('localizacao-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'entregadores',
      },
      (payload) => {
        console.log('📍 [REALTIME] Localização atualizada:', payload.new);
        onAtualizarLocalizacao(payload.new as Entregador);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal de localização conectado');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erro no canal de localização');
      }
    });

  return localizacaoChannel;
};

/**
 * Remover assinatura de pedidos
 */
export const removerAssinaturaPedidos = () => {
  if (pedidosChannel) {
    supabase.removeChannel(pedidosChannel);
    pedidosChannel = null;
    console.log('🔕 Assinatura de pedidos removida');
  }
};

/**
 * Remover assinatura de localização
 */
export const removerAssinaturaLocalizacao = () => {
  if (localizacaoChannel) {
    supabase.removeChannel(localizacaoChannel);
    localizacaoChannel = null;
    console.log('🔕 Assinatura de localização removida');
  }
};

/**
 * Enviar localização do entregador
 */
export const enviarLocalizacao = async (
  entregadorId: string,
  lat: number,
  lng: number
) => {
  const { error } = await supabase
    .from('entregadores')
    .update({
      localizacao_lat: lat,
      localizacao_lng: lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entregadorId);

  if (error) {
    console.error('❌ Erro ao enviar localização:', error);
  }
};

// Eventos (para compatibilidade com código antigo)
export const eventosServidor = {
  NOVO_PEDIDO: 'novo-pedido',
  PEDIDO_ACEITO: 'pedido-aceito',
  NOVA_LOCALIZACAO: 'nova-localizacao',
  PEDIDO_FINALIZADO: 'pedido-finalizado',
};

export const eventosCliente = {
  ENTRAR_SALA_ENTREGADOR: 'entrar-sala-entregador',
  ENVIAR_LOCALIZACAO: 'localizacao',
};
