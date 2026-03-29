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
  placa_moto: string | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[];
  status: 'pendente' | 'aceito' | 'em_transito' | 'no_local' | 'entregue';
  entregador_id: string | null;
  estabelecimento_nome: string | null;
  estabelecimento_endereco: string | null;
  valor_pedido: number | null;
  valor_entregador: number | null;
  forma_pagamento?: string | null;
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
  async login(nome: string, telefone: string, senha?: string) {
    // Tenta encontrar entregador existente pelo nome
    const { data: existente, error: erroBusca } = await supabase
      .from('entregadores')
      .select('*')
      .ilike('nome', nome)
      .single();

    if (existente) {
      // Verificar senha se o entregador já existe
      if (existente.senha_hash) {
        const senhaDecodificada = atob(existente.senha_hash);
        if (senhaDecodificada !== senha) {
          throw new Error('Senha incorreta');
        }
      }
      return { data: existente, error: null };
    }

    // Se não encontrou e tem telefone, cria novo entregador (primeiro acesso)
    if (!telefone) {
      throw new Error('Entregador não encontrado. Por favor, faça seu cadastro primeiro.');
    }

    // Cria novo entregador (primeiro acesso - cadastra senha)
    const { data: novo, error: erroCriacao } = await supabase
      .from('entregadores')
      .insert([
        {
          nome,
          telefone,
          senha_hash: senha ? btoa(senha) : null,
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

  // Recusar pedido (volta para pendente)
  async recusarPedido(pedidoId: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        status: 'pendente',
        entregador_id: null,
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
    // Buscar dados do pedido
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (erroPedido) {
      console.error('Erro ao buscar pedido:', erroPedido);
      return { data: null, error: erroPedido };
    }

    console.log('📦 Pedido encontrado:', pedido);

    // Atualizar status do pedido para em_transito
    const { data: pedidoAtualizado, error: erroAtualizacao } = await supabase
      .from('pedidos')
      .update({
        status: 'em_transito',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (erroAtualizacao) {
      console.error('Erro ao atualizar pedido:', erroAtualizacao);
      return { data: null, error: erroAtualizacao };
    }

    console.log('✅ Pedido atualizado para em_transito');

    // Atualizar fila de pedidos para em_rota buscando pelo cliente e endereço (já que pedido_id não existe na tabela)
    const { data: filaEncontrada, error: erroBuscaFila } = await supabase
      .from('fila_pedidos')
      .select('*')
      .eq('cliente', pedido.cliente)
      .eq('endereco', pedido.endereco)
      .eq('status', 'em_preparacao')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erroBuscaFila) {
      console.error('Erro ao buscar fila:', erroBuscaFila);
    }

    console.log('🔍 Fila encontrada:', filaEncontrada);

    if (filaEncontrada) {
      const { error: erroFila } = await supabase
        .from('fila_pedidos')
        .update({
          status: 'em_rota',
        })
        .eq('id', filaEncontrada.id);

      if (erroFila) {
        console.error('Erro ao atualizar fila:', erroFila);
      } else {
        console.log('✅ Fila atualizada para em_rota');
      }
    } else {
      console.log('⚠️ Nenhum registro na fila encontrado para este pedido');
    }

    return { data: pedidoAtualizado, error: null };
  },

  // Notificar chegada no local (Entregador -> Cliente)
  async notificarChegada(pedidoId: string) {
    // Buscar dados do pedido
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (erroPedido) {
      console.error('Erro ao buscar pedido:', erroPedido);
      return { data: null, error: erroPedido };
    }

    // Atualizar status do pedido para no_local
    const { data: pedidoAtualizado, error: erroAtualizacao } = await supabase
      .from('pedidos')
      .update({
        status: 'no_local',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (erroAtualizacao) {
      console.error('Erro ao atualizar pedido:', erroAtualizacao);
      return { data: null, error: erroAtualizacao };
    }

    // Atualizar fila de pedidos
    const { data: filaEncontrada } = await supabase
      .from('fila_pedidos')
      .select('*')
      .eq('cliente', pedido.cliente)
      .eq('endereco', pedido.endereco)
      .eq('status', 'em_rota')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (filaEncontrada) {
      await supabase
        .from('fila_pedidos')
        .update({
          status: 'no_local',
        })
        .eq('id', filaEncontrada.id);
    }

    return { data: pedidoAtualizado, error: null };
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
  async criarPedido(cliente: string, endereco: string, itens: string[], estabelecimentoNome?: string, valorPedido?: number, valorEntregador?: number, estabelecimentoEndereco?: string, formaPagamento?: string, estabelecimentoId?: string) {
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
          estabelecimento_id: estabelecimentoId || null,
          valor_pedido: valorPedido || null,
          valor_entregador: valorEntregador || null,
          forma_pagamento: formaPagamento || null,
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
