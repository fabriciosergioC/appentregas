/**
 * Cliente Supabase para uso no servidor (server-side)
 * Usa a SERVICE ROLE KEY para bypass do RLS
 * 
 * Use em: API Routes, Server Components, Server Actions
 */

import { createClient } from '@supabase/supabase-js';

// URLs do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Criar cliente Supabase com SERVICE ROLE (bypass RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =============================================
// FUNÇÕES DE ENTREGADORES (Server-side)
// =============================================

export const entregadoresServer = {
  // Buscar todos os entregadores
  async todos() {
    const { data, error } = await supabaseServer
      .from('entregadores')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Buscar por ID
  async buscarPorId(id: string) {
    const { data, error } = await supabaseServer
      .from('entregadores')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Buscar por telefone
  async buscarPorTelefone(telefone: string) {
    const { data, error } = await supabaseServer
      .from('entregadores')
      .select('*')
      .eq('telefone', telefone)
      .single();

    return { data, error };
  },

  // Criar entregador
  async criar(nome: string, telefone: string) {
    const { data, error } = await supabaseServer
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

    return { data, error };
  },

  // Atualizar localização
  async atualizarLocalizacao(id: string, lat: number, lng: number) {
    const { data, error } = await supabaseServer
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

  // Atualizar disponibilidade
  async atualizarDisponibilidade(id: string, disponivel: boolean) {
    const { data, error } = await supabaseServer
      .from('entregadores')
      .update({
        disponivel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },
};

// =============================================
// FUNÇÕES DE PEDIDOS (Server-side)
// =============================================

export const pedidosServer = {
  // Listar todos os pedidos
  async todos() {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select(`
        *,
        entregador:entregadores_id (
          id,
          nome,
          telefone
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Pedidos disponíveis
  async disponiveis() {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Pedidos por entregador
  async porEntregador(entregadorId: string) {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select('*')
      .eq('entregador_id', entregadorId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Buscar por ID
  async buscarPorId(id: string) {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select(`
        *,
        entregador:entregadores_id (
          id,
          nome,
          telefone
        )
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Criar pedido
  async criar(cliente: string, endereco: string, itens: string[]) {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .insert([
        {
          cliente,
          endereco,
          itens,
          status: 'pendente',
        },
      ])
      .select()
      .single();

    return { data, error };
  },

  // Aceitar pedido
  async aceitar(pedidoId: string, entregadorId: string) {
    const { data, error } = await supabaseServer
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

  // Iniciar entrega
  async iniciar(pedidoId: string) {
    const { data, error } = await supabaseServer
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
  async finalizar(pedidoId: string) {
    const { data, error } = await supabaseServer
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

  // Estatísticas
  async estatisticas() {
    const { data: total, error: erroTotal } = await supabaseServer
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    const { data: pendentes, error: erroPendentes } = await supabaseServer
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    const { data: emTransito, error: erroEmTransito } = await supabaseServer
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'em_transito');

    const { data: entregues, error: erroEntregues } = await supabaseServer
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'entregue');

    return {
      data: {
        total: total || 0,
        pendentes: pendentes || 0,
        emTransito: emTransito || 0,
        entregues: entregues || 0,
      },
      error: erroTotal || erroPendentes || erroEmTransito || erroEntregues,
    };
  },
};

// =============================================
// FUNÇÕES DE HISTÓRICO
// =============================================

export const historicoServer = {
  // Histórico por entregador
  async porEntregador(entregadorId: string) {
    const { data, error } = await supabaseServer
      .from('entregadores_pedidos')
      .select(`
        *,
        pedido:pedidos_id (
          id,
          cliente,
          endereco,
          itens,
          status
        ),
        entregador:entregadores_id (
          id,
          nome
        )
      `)
      .eq('entregador_id', entregadorId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Histórico de um pedido
  async porPedido(pedidoId: string) {
    const { data, error } = await supabaseServer
      .from('entregadores_pedidos')
      .select(`
        *,
        pedido:pedidos_id (
          id,
          cliente,
          endereco
        ),
        entregador:entregadores_id (
          id,
          nome
        )
      `)
      .eq('pedido_id', pedidoId)
      .single();

    return { data, error };
  },
};
