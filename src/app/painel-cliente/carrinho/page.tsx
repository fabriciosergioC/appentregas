'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useCarrinho } from '@/contexts/CarrinhoContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CarrinhoPage() {
  const router = useRouter();
  const { itens, estabelecimentoId, estabelecimentoNome, limparCarrinho, totalCarrinho, removerItem, atualizarQuantidade } = useCarrinho();
  
  const [nomeCliente, setNomeCliente] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [estabelecimento, setEstabelecimento] = useState<{
    nome_estabelecimento: string;
    endereco?: string;
    telefone: string;
  } | null>(null);

  // Carregar dados do estabelecimento
  useEffect(() => {
    if (!estabelecimentoId) return;

    async function carregarEstabelecimento() {
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('nome_estabelecimento, telefone, endereco')
        .eq('id', estabelecimentoId)
        .single();

      if (data) {
        setEstabelecimento(data);
      }
    }

    carregarEstabelecimento();
  }, [estabelecimentoId]);

  // Se carrinho estiver vazio, redirecionar para painel
  useEffect(() => {
    if (itens.length === 0 && !loading) {
      router.push('/painel-cliente');
    }
  }, [itens, loading, router]);

  const handleRemoverItem = (produtoId: string) => {
    removerItem(produtoId);
  };

  const handleAtualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    atualizarQuantidade(produtoId, novaQuantidade);
  };

  const handleFinalizarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCliente || !enderecoEntrega || !telefoneCliente) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    if (itens.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    setLoading(true);

    try {
      console.log('📦 Dados do pedido antes de salvar:');
      console.log('- estabelecimentoId:', estabelecimentoId);
      console.log('- estabelecimento_nome:', estabelecimento?.nome_estabelecimento || estabelecimentoNome);
      console.log('- cliente:', nomeCliente);
      console.log('- itens:', itens);

      // Formatar itens do pedido
      const itensFormatados = itens.map((item) => {
        const itemTexto = `${item.quantidade}x ${item.nome}${item.descricao ? ` - ${item.descricao}` : ''}`;
        return itemTexto;
      });

      // Calcular total
      const valorTotal = totalCarrinho;

      // Salvar na fila de pedidos (tabela separada)
      const { data: pedidoFila, error: erroFila } = await supabase
        .from('fila_pedidos')
        .insert([{
          cliente: nomeCliente,
          telefone_cliente: telefoneCliente,
          endereco: enderecoEntrega,
          forma_pagamento: formaPagamento,
          observacoes: observacoes || null,
          itens: itensFormatados,
          status: 'pendente',
          estabelecimento_nome: estabelecimento?.nome_estabelecimento || estabelecimentoNome,
          estabelecimento_id: estabelecimentoId,
          criado_por: 'cliente',
        }])
        .select()
        .single();

      if (erroFila) {
        console.error('❌ Erro ao salvar na fila de pedidos:', erroFila);
        alert('Erro ao salvar pedido: ' + erroFila.message);
        return;
      }

      console.log('✅ Pedido salvo na fila com sucesso:', pedidoFila);

      // Limpar carrinho
      limparCarrinho();

      // Redirecionar para painel do cliente
      router.push('/painel-cliente');
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🛒</span>
          <p className="text-gray-600">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-600 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">🛒 Carrinho de Compras</h1>
        </div>

        {/* Itens do Carrinho */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📦</span> Seus Itens
          </h2>

          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                {item.imagem_url ? (
                  <img
                    src={item.imagem_url}
                    alt={item.nome}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📦</span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.nome}</h3>
                  {item.descricao && (
                    <p className="text-sm text-gray-500 mb-1">{item.descricao}</p>
                  )}
                  <p className="text-green-600 font-bold">
                    {item.preco.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleAtualizarQuantidade(item.id, item.quantidade - 1)}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-bold text-gray-800 w-8 text-center">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => handleAtualizarQuantidade(item.id, item.quantidade + 1)}
                      className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Remover este item?')) {
                          handleRemoverItem(item.id);
                        }
                      }}
                      className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      🗑️ Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                {totalCarrinho.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário de Entrega */}
        <form onSubmit={handleFinalizarPedido}>
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📍</span> Dados de Entrega
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço de Entrega *
                </label>
                <textarea
                  value={enderecoEntrega}
                  onChange={(e) => setEnderecoEntrega(e.target.value)}
                  placeholder="Rua, número, complemento, bairro..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="pix">💠 PIX</option>
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Sem cebola, troco para R$ 50, etc."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botão Finalizar */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              loading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
            }`}
          >
            {loading ? '⏳ Finalizando...' : '✅ Finalizar Pedido'}
          </button>

          {/* Botão Voltar */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full mt-3 py-3 rounded-xl font-medium text-green-700 bg-white hover:bg-gray-50 transition-all"
          >
            ← Continuar Comprando
          </button>
        </form>
      </div>
    </div>
  );
}
