/**
 * API unificada - Supabase
 *
 * Usa Supabase para operações CRUD e Realtime
 */

import {
  supabase,
  entregadoresApi,
  clientesApi,
  pedidosApi,
  realtime,
  type Pedido,
  type Entregador,
} from './supabase';

// =============================================
// API UNIFICADA
// =============================================

export const api = {
  // =============================================
  // ENTREGADORES
  // =============================================

  async loginEntregador(nome: string, telefone: string, senha?: string) {
    return await entregadoresApi.login(nome, telefone, senha);
  },

  async atualizarLocalizacao(entregadorId: string, lat: number, lng: number) {
    return await entregadoresApi.atualizarLocalizacao(entregadorId, lat, lng);
  },

  async buscarEntregador(id: string) {
    return await entregadoresApi.buscarPorId(id);
  },

  async listarEntregadoresDisponiveis() {
    return await entregadoresApi.listarDisponiveis();
  },

  // =============================================
  // RECUPERACAO DE SENHA
  // =============================================

  async solicitarRecuperacaoSenha(telefone: string) {
    return await entregadoresApi.solicitarRecuperacaoSenha(telefone);
  },

  async validarTokenRecuperacao(telefone: string, token: string) {
    return await entregadoresApi.validarTokenRecuperacao(telefone, token);
  },

  async redefinirSenha(telefone: string, token: string, novaSenha: string) {
    return await entregadoresApi.redefinirSenha(telefone, token, novaSenha);
  },

  // =============================================
  // CLIENTES
  // =============================================

  async loginCliente(telefone: string, senha?: string) {
    return await clientesApi.login(telefone, senha);
  },

  async cadastrarCliente(nome: string, telefone: string, senha: string, email?: string) {
    return await clientesApi.cadastrar(nome, telefone, senha, email);
  },

  async solicitarRecuperacaoSenhaCliente(telefone: string) {
    return await clientesApi.solicitarRecuperacaoSenha(telefone);
  },

  async validarTokenRecuperacaoCliente(telefone: string, token: string) {
    return await clientesApi.validarTokenRecuperacao(telefone, token);
  },

  async redefinirSenhaCliente(telefone: string, token: string, novaSenha: string) {
    return await clientesApi.redefinirSenha(telefone, token, novaSenha);
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

  async recusarPedido(id: string) {
    return await pedidosApi.recusarPedido(id);
  },

  async liberarPedidoParaEntregador(id: string) {
    return await pedidosApi.liberarPedidoParaEntregador(id);
  },

  async iniciarEntrega(id: string) {
    return await pedidosApi.iniciarEntrega(id);
  },

  async notificarChegada(id: string) {
    return await pedidosApi.notificarChegada(id);
  },

  async finalizarPedido(id: string) {
    return await pedidosApi.finalizarPedido(id);
  },

  async solicitarDevolucao(id: string, motivo: string) {
    return await pedidosApi.solicitarDevolucao(id, motivo);
  },

  async processarDevolucao(id: string, motivo: string) {
    return await pedidosApi.processarDevolucao(id, motivo);
  },

  async listarSolicitacoesDevolucao(estabelecimentoId: string) {
    return await pedidosApi.listarSolicitacoesDevolucao(estabelecimentoId);
  },

  async criarPedido(cliente: string, endereco: string, itens: string[], estabelecimentoNome?: string, valorPedido?: number, valorEntregador?: number, estabelecimentoEndereco?: string, formaPagamento?: string, estabelecimentoId?: string) {
    const resultado = await pedidosApi.criarPedido(cliente, endereco, itens, estabelecimentoNome, valorPedido, valorEntregador, estabelecimentoEndereco, formaPagamento, estabelecimentoId);

    // Socket.IO vai detectar automaticamente via Supabase Realtime
    // mas podemos emitir um evento adicional se necessário

    return resultado;
  },

  async listarTodosPedidos() {
    return await pedidosApi.listarTodos();
  },

  // =============================================
  // REALTIME (Supabase)
  // =============================================

  assinarPedidosTempoReal(
    onNovoPedido?: (pedido: Pedido) => void,
    onAtualizarPedido?: (pedido: Pedido) => void
  ) {
    return realtime.assinarPedidos(onNovoPedido, onAtualizarPedido);
  },

  assinarLocalizacaoTempoReal(onAtualizar: (entregador: Entregador) => void) {
    return realtime.assinarLocalizacao(onAtualizar);
  },
};

// Exportar tipos
export type { Pedido, Entregador };

// Exportar Supabase diretamente para operações avançadas
export { supabase, entregadoresApi, pedidosApi, realtime };
