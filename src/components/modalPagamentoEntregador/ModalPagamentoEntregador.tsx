import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  saldo: number;
  disponivel: boolean;
}

interface ModalPagamentoEntregadorProps {
  aberto: boolean;
  onClose: () => void;
  onPagamentoRealizado: () => void;
}

export default function ModalPagamentoEntregador({
  aberto,
  onClose,
  onPagamentoRealizado,
}: ModalPagamentoEntregadorProps) {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState<string>('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (aberto) {
      carregarEntregadores();
    }
  }, [aberto]);

  const carregarEntregadores = async () => {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('id, nome, telefone, saldo, disponivel')
        .order('nome', { ascending: true });

      if (error) throw error;
      setEntregadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      setErro('Erro ao carregar entregadores');
    }
  };

  const entregadorSelecionadoData = entregadores.find((e) => e.id === entregadorSelecionado);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    if (!entregadorSelecionado) {
      setErro('Selecione um entregador');
      setLoading(false);
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido');
      setLoading(false);
      return;
    }

    if (entregadorSelecionadoData && valorNumerico > entregadorSelecionadoData.saldo) {
      setErro(`Saldo insuficiente. Saldo atual: R$ ${entregadorSelecionadoData.saldo.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      // Buscar dados do estabelecimento logado
      const estabelecimentoUser = localStorage.getItem('estabelecimento_user');
      let estabelecimentoId = '';

      if (estabelecimentoUser) {
        const dados = JSON.parse(estabelecimentoUser);
        estabelecimentoId = dados.id;
      }

      if (!estabelecimentoId) {
        setErro('Estabelecimento não identificado');
        setLoading(false);
        return;
      }

      // Registrar pagamento
      const { error } = await supabase.from('pagamentos_entregadores').insert([
        {
          entregador_id: entregadorSelecionado,
          estabelecimento_id: estabelecimentoId,
          valor: valorNumerico,
          forma_pagamento: formaPagamento,
          descricao: descricao || null,
          status: 'realizado',
          criado_por: estabelecimentoId,
        },
      ]);

      if (error) throw error;

      setSucesso('Pagamento registrado com sucesso! Saldo abatido.');
      onPagamentoRealizado();

      // Limpar formulário e fechar após 2 segundos
      setTimeout(() => {
        setEntregadorSelecionado('');
        setValor('');
        setDescricao('');
        setFormaPagamento('pix');
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      setErro(error.message || 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">💰 Pagar Entregador</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-1">
            Registrar pagamento e abater do saldo
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handlePagamento} className="p-6 space-y-4">
          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm">
              <span className="font-medium">⚠️ Erro:</span> {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg text-sm">
              <span className="font-medium">✅ Sucesso:</span> {sucesso}
            </div>
          )}

          {/* Selecionar Entregador */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Entregador *
            </label>
            <select
              value={entregadorSelecionado}
              onChange={(e) => setEntregadorSelecionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
              required
            >
              <option value="">Selecione um entregador</option>
              {entregadores.map((entregador) => (
                <option key={entregador.id} value={entregador.id}>
                  {entregador.nome} - Saldo: {formatarMoeda(entregador.saldo)}
                </option>
              ))}
            </select>
          </div>

          {/* Saldo do Entregador Selecionado */}
          {entregadorSelecionadoData && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 font-medium">Saldo Atual:</span>
                <span className="text-xl font-bold text-purple-900">
                  {formatarMoeda(entregadorSelecionadoData.saldo)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-purple-600">Telefone:</span>
                <span className="text-sm text-purple-800">{entregadorSelecionadoData.telefone}</span>
              </div>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Valor do Pagamento *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
            {valor && (
              <p className="text-xs text-gray-500 mt-1">
                Saldo após pagamento:{' '}
                <span className="font-medium">
                  {entregadorSelecionadoData
                    ? formatarMoeda(entregadorSelecionadoData.saldo - parseFloat(valor || '0'))
                    : 'R$ 0,00'}
                </span>
              </p>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormaPagamento('pix')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'pix'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💠 PIX
              </button>
              <button
                type="button"
                onClick={() => setFormaPagamento('dinheiro')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'dinheiro'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💵 Dinheiro
              </button>
              <button
                type="button"
                onClick={() => setFormaPagamento('transferencia')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'transferencia'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏦 Transferência
              </button>
            </div>
          </div>

          {/* Descrição (Opcional) */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento referente à semana 01-07/03"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !!sucesso}
            className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transition-all ${
              loading || sucesso
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : sucesso ? (
              '✅ Pagamento Registrado!'
            ) : (
              '💰 Confirmar Pagamento'
            )}
          </button>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Atenção:</strong> O valor será abatido automaticamente do saldo do entregador.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
