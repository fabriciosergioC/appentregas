/**
 * Cliente Supabase para uso no browser (client-side)
 * Documentação: https://supabase.com/docs/reference/javascript/introduction
 */

import { createClient } from '@supabase/supabase-js';

// Tipos para as tabelas do banco
export interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  disponivel: boolean;
  localizacao_lat: number | null;
  localizacao_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[];
  status: 'pendente' | 'aceito' | 'em_transito' | 'entregue';
  entregador_id: string | null;
  estabelecimento_nome: string | null;
  estabelecimento_endereco: string | null;
  valor_pedido: number | null;
  valor_entregador: number | null;
  liberado_pelo_estabelecimento: boolean;
  liberado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntregadoresPedidos {
  id: string;
  entregador_id: string;
  pedido_id: string;
  aceito_em: string | null;
  iniciado_em: string | null;
  finalizado_em: string | null;
  created_at: string;
}

// URLs do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// =============================================
// FUNÇÕES DE ENTREGADORES
// =============================================

export const entregadoresApi = {
  // Login/Criar entregador
  async login(nome: string, telefone: string) {
    // Tenta encontrar entregador existente
    const { data: existente, error: erroBusca } = await supabase
      .from('entregadores')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (existente) {
      return { data: existente, error: null };
    }

    // Cria novo entregador
    const { data: novo, error: erroCriacao } = await supabase
      .from('entregadores')
      .insert([
        {
          nome,
          telefone,
          disponivel: true,
        },
      ])
      .select()
      .single();

    return { data: novo, error: erroCriacao };
  },

  // Atualizar localização
  async atualizarLocalizacao(id: string, lat: number, lng: number) {
    const { data, error } = await supabase
      .from('entregadores')
      .update({
        localizacao_lat: lat,
        localizacao_lng: lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Buscar entregador por ID
  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('entregadores')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Listar entregadores disponíveis
  async listarDisponiveis() {
    const { data, error } = await supabase
      .from('entregadores')
      .select('*')
      .eq('disponivel', true)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Assinar mudanças em tempo real (localização)
  onAtualizarLocalizacao(callback: (entregador: Entregador) => void) {
    const channel = supabase
      .channel('entregadores-localizacao')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'entregadores',
        },
        (payload) => {
          callback(payload.new as Entregador);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// =============================================
// FUNÇÕES DE PEDIDOS
// =============================================

export const pedidosApi = {
  // Listar pedidos disponíveis
  async listarDisponiveis() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Meus pedidos (entregador)
  async meusPedidos(entregadorId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('entregador_id', entregadorId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Aceitar pedido
  async aceitarPedido(pedidoId: string, entregadorId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        status: 'aceito',
        entregador_id: entregadorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    return { data, error };
  },

  // Liberar pedido para o entregador (Estabelecimento)
  async liberarPedidoParaEntregador(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        liberado_pelo_estabelecimento: true,
        liberado_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    return { data, error };
  },

  // Iniciar entrega
  async iniciarEntrega(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        status: 'em_transito',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    return { data, error };
  },

  // Finalizar pedido
  async finalizarPedido(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        status: 'entregue',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    return { data, error };
  },

  // Criar pedido (Estabelecimento)
  async criarPedido(cliente: string, endereco: string, itens: string[], estabelecimentoNome?: string, valorPedido?: number, valorEntregador?: number, estabelecimentoEndereco?: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente,
          endereco,
          itens,
          status: 'pendente',
          estabelecimento_nome: estabelecimentoNome || null,
          estabelecimento_endereco: estabelecimentoEndereco || null,
          valor_pedido: valorPedido || null,
          valor_entregador: valorEntregador || null,
        },
      ])
      .select()
      .single();

    return { data, error };
  },

  // Listar todos os pedidos
  async listarTodos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        entregador:entregador_id (
          id,
          nome,
          telefone
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Assinar novos pedidos em tempo real
  onNovoPedido(callback: (pedido: Pedido) => void) {
    const channel = supabase
      .channel('pedidos-novos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          callback(payload.new as Pedido);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Assinar mudanças de status
  onMudarStatus(callback: (pedido: Pedido) => void) {
    const channel = supabase
      .channel('pedidos-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          callback(payload.new as Pedido);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// =============================================
// REALTIME COMBINADO (Supabase + Socket.IO)
// =============================================

export const realtime = {
  // Assinar todas as mudanças de pedidos
  assinarPedidos(
    onNovoPedido?: (pedido: Pedido) => void,
    onAtualizarPedido?: (pedido: Pedido) => void
  ) {
    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
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
          onAtualizarPedido?.(payload.new as Pedido);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Assinar mudanças de localização
  assinarLocalizacao(onAtualizar: (entregador: Entregador) => void) {
    const channel = supabase
      .channel('localizacao-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'entregadores',
        },
        (payload) => {
          onAtualizar(payload.new as Entregador);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
