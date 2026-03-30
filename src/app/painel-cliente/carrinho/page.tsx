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
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [valorTroco, setValorTroco] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [pedidoSucesso, setPedidoSucesso] = useState(false);
  const [mostrarComprovante, setMostrarComprovante] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [chavesPix, setChavesPix] = useState<any[]>([]);
  const [carregandoChavesPix, setCarregandoChavesPix] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
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

    // Se for PIX, carregar chaves do estabelecimento
    if (formaPagamento === 'pix') {
      setCarregandoChavesPix(true);
      try {
        const { data, error } = await supabase
          .from('chaves_pix')
          .select('*')
          .eq('estabelecimento_id', estabelecimentoId)
          .order('criado_em', { ascending: false });

        if (error) throw error;
        setChavesPix(data || []);
      } catch (err) {
        console.error('Erro ao carregar chaves PIX:', err);
      } finally {
        setCarregandoChavesPix(false);
      }
    }

    // Mostrar confirmação de pagamento
    setMostrarConfirmacao(true);
  };

  const confirmarPedidoComPagamento = async () => {
    setMostrarConfirmacao(false);

    // Se for PIX, mostrar tela de comprovante
    if (formaPagamento === 'pix') {
      setMostrarComprovante(true);
      return;
    }

    // Para outras formas de pagamento, segue normalmente
    setLoading(true);

    try {
      // Preparar observações com troco se for dinheiro
      let observacoesFinais = observacoes;
      if (formaPagamento === 'dinheiro' && precisaTroco && valorTroco) {
        const trocoObservacao = `Precisa de troco para R$ ${valorTroco}`;
        observacoesFinais = observacoes ? `${observacoes} | ${trocoObservacao}` : trocoObservacao;
      }

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

      // Arredondar valor para 2 casas decimais (formato DECIMAL do banco)
      const valorPedidoFormatado = Math.round(totalCarrinho * 100) / 100;

      console.log('💰 Valor do pedido (formatado):', valorPedidoFormatado);

      // Salvar na fila de pedidos (tabela separada)
      const { data: pedidoFila, error: erroFila } = await supabase
        .from('fila_pedidos')
        .insert([{
          cliente: nomeCliente,
          telefone_cliente: telefoneCliente,
          endereco: enderecoEntrega,
          forma_pagamento: formaPagamento,
          observacoes: observacoesFinais || null,
          itens: itensFormatados,
          status: 'pendente',
          estabelecimento_nome: estabelecimento?.nome_estabelecimento || estabelecimentoNome,
          estabelecimento_id: estabelecimentoId,
          criado_por: 'cliente',
          valor_pedido: valorPedidoFormatado,
          valor_entregador: 0, // Taxa do entregador (será calculada posteriormente)
        }])
        .select()
        .single();

      if (erroFila) {
        console.error('❌ Erro ao salvar na fila de pedidos:', erroFila);
        console.error('🔍 Detalhes do erro:', JSON.stringify(erroFila, null, 2));
        alert('Erro ao salvar pedido: ' + erroFila.message);
        return;
      }

      console.log('✅ Pedido salvo na fila com sucesso:', pedidoFila);

      // Salvar ID do pedido
      setPedidoId(pedidoFila.id);

      // Limpar carrinho
      limparCarrinho();

      // Mostrar tela de sucesso
      setPedidoSucesso(true);
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Upload do comprovante de pagamento
  const handleEnviarComprovante = async () => {
    if (!comprovanteFile) {
      alert('Por favor, anexe o comprovante de pagamento PIX!');
      return;
    }

    setEnviandoComprovante(true);

    try {
      // Formatar itens do pedido
      const itensFormatados = itens.map((item) => {
        const itemTexto = `${item.quantidade}x ${item.nome}${item.descricao ? ` - ${item.descricao}` : ''}`;
        return itemTexto;
      });

      // Preparar observações com troco se for dinheiro
      let observacoesFinais = observacoes;
      if (formaPagamento === 'dinheiro' && precisaTroco && valorTroco) {
        const trocoObservacao = `Precisa de troco para R$ ${valorTroco}`;
        observacoesFinais = observacoes ? `${observacoes} | ${trocoObservacao}` : trocoObservacao;
      }

      // Upload do comprovante para o Supabase Storage
      const fileName = `comprovantes/${estabelecimentoId}/${Date.now()}_${comprovanteFile.name}`;
      
      try {
        const { error: uploadError } = await supabase.storage
          .from('comprovantes-pix')
          .upload(fileName, comprovanteFile);

        if (uploadError) throw uploadError;
      } catch (uploadErr) {
        console.error('❌ Erro no upload:', uploadErr);
        // Continuar sem o comprovante se o upload falhar
        alert('⚠️ Não foi possível fazer upload do comprovante, mas seu pedido será enviado mesmo assim.');
      }

      // Obter URL pública do comprovante
      const { data: urlData } = await supabase.storage
        .from('comprovantes-pix')
        .getPublicUrl(fileName);

      const comprovanteUrl = urlData?.publicUrl || null;

      // Arredondar valor para 2 casas decimais (formato DECIMAL do banco)
      const valorPedidoFormatado = Math.round(totalCarrinho * 100) / 100;

      // Salvar na fila de pedidos com o comprovante
      const pedidoData = {
        cliente: nomeCliente,
        telefone_cliente: telefoneCliente,
        endereco: enderecoEntrega,
        forma_pagamento: formaPagamento,
        observacoes: observacoesFinais || null,
        itens: itensFormatados,
        status: 'em_preparacao',
        estabelecimento_nome: estabelecimento?.nome_estabelecimento || estabelecimentoNome,
        estabelecimento_id: estabelecimentoId,
        criado_por: 'cliente',
        valor_pedido: valorPedidoFormatado,
        valor_entregador: 0, // Taxa do entregador (será calculada posteriormente)
        comprovante_pix: comprovanteUrl || null,
      };

      const { data: pedidoFila, error: erroFila } = await supabase
        .from('fila_pedidos')
        .insert([pedidoData])
        .select()
        .single();

      if (erroFila) {
        console.error('❌ Erro ao salvar pedido:', erroFila);
        
        // Se o erro for sobre a coluna comprovante_pix, tentar salvar sem ela
        if (erroFila.message.includes('comprovante_pix')) {
          console.log('⚠️ Coluna comprovante_pix não existe, tentando sem ela...');
          const { data: pedidoFilaSemComprovante, error: erroSemComprovante } = await supabase
            .from('fila_pedidos')
            .insert([{
              cliente: nomeCliente,
              telefone_cliente: telefoneCliente,
              endereco: enderecoEntrega,
              forma_pagamento: formaPagamento,
              observacoes: observacoes || null,
              itens: itensFormatados,
              status: 'em_preparacao',
              estabelecimento_nome: estabelecimento?.nome_estabelecimento || estabelecimentoNome,
              estabelecimento_id: estabelecimentoId,
              criado_por: 'cliente',
              valor_pedido: totalCarrinho,
              valor_entregador: 0, // Taxa do entregador (será calculada posteriormente)
            }])
            .select()
            .single();
          
          if (erroSemComprovante) {
            console.error('❌ Erro ao salvar pedido sem comprovante:', erroSemComprovante);
            alert('Erro ao salvar pedido: ' + erroSemComprovante.message);
            setEnviandoComprovante(false);
            return;
          }
          
          console.log('✅ Pedido salvo (sem comprovante):', pedidoFilaSemComprovante);
          const idPedido = pedidoFilaSemComprovante?.id || pedidoFilaSemComprovante;
          setPedidoId(idPedido);
          limparCarrinho();
          setMostrarComprovante(false);
          setPedidoSucesso(true);
          setEnviandoComprovante(false);
          return;
        }

        alert('Erro ao salvar pedido: ' + erroFila.message);
        setEnviandoComprovante(false);
        return;
      }

      // Salvar ID do pedido
      const idPedido = pedidoFila.id || pedidoFila;
      setPedidoId(idPedido);

      // Fechar modal de comprovante
      setMostrarComprovante(false);

      // Mostrar tela de sucesso PRIMEIRO
      setPedidoSucesso(true);

      // Depois limpar carrinho
      limparCarrinho();

      setEnviandoComprovante(false);
    } catch (err) {
      console.error('Erro ao enviar comprovante:', err);
      alert('Erro ao enviar comprovante. Tente novamente.');
    } finally {
      setEnviandoComprovante(false);
    }
  };

  // Se carrinho estiver vazio E não for pedido bem-sucedido, mostrar mensagem
  if (itens.length === 0 && !pedidoSucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🛒</span>
          <p className="text-gray-600">Seu carrinho está vazio</p>
          <button
            onClick={() => router.push('/painel-cliente')}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
          >
            Ir para o Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-600 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Tela de Sucesso Após Comprovante */}
        {pedidoSucesso && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl animate-bounce block">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 Pedido Confirmado!</h2>
              <p className="text-green-600 font-bold text-lg mb-4">Seu pedido já está em andamento</p>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6">
                <div className="space-y-3">
                  {pedidoId && (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="text-xs text-gray-500">Número do Pedido</p>
                          <p className="font-bold text-gray-800">#{pedidoId.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">🚀</span>
                          <div>
                            <p className="text-xs text-gray-500">Status Atual</p>
                            <p className="font-bold text-green-600">Em Preparação</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="text-xs text-gray-500">Tempo Estimado</p>
                        <p className="font-bold text-gray-800">30-45 minutos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  💡 O estabelecimento já recebeu seu pedido{pedidoId ? ' e comprovante' : ''}. Acompanhe pelo painel!
                </p>
              </div>

              <button
                onClick={() => {
                  setPedidoSucesso(false);
                  setPedidoId(null);
                  router.push('/painel-cliente');
                }}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                🏠 Ir para o Painel
              </button>
            </div>
          </div>
        )}

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
                  onChange={(e) => {
                    setFormaPagamento(e.target.value);
                    // Resetar troco quando mudar para não-dinheiro
                    if (e.target.value !== 'dinheiro') {
                      setPrecisaTroco(false);
                      setValorTroco('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="pix">💠 PIX</option>
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                </select>
              </div>

              {/* Cash Box - Troco para Dinheiro */}
              {formaPagamento === 'dinheiro' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    💵 Precisa de troco?
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="precisaTroco"
                        value="nao"
                        checked={!precisaTroco}
                        onChange={() => {
                          setPrecisaTroco(false);
                          setValorTroco('');
                        }}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Não</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="precisaTroco"
                        value="sim"
                        checked={precisaTroco}
                        onChange={() => setPrecisaTroco(true)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Sim</span>
                    </label>
                  </div>

                  {precisaTroco && (
                    <div className="animate-pulse">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        💰 Valor para troco:
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                        <input
                          type="number"
                          value={valorTroco}
                          onChange={(e) => setValorTroco(e.target.value)}
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          className="w-full pl-10 pr-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-bold text-gray-800"
                          required={precisaTroco}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Ex: Se o pedido é R$ 4,89 e você vai pagar com R$ 10,00, digite 10.00
                      </p>
                    </div>
                  )}
                </div>
              )}

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

      {/* Modal de Confirmação de Pagamento */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💳</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Pagamento</h2>
              <p className="text-gray-600">Por favor, confirme os dados do pagamento antes de finalizar.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Forma de Pagamento:</span>
                  <span className="font-bold text-gray-800">
                    {formaPagamento === 'pix' && '💠 PIX'}
                    {formaPagamento === 'dinheiro' && '💵 Dinheiro'}
                    {formaPagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                    {formaPagamento === 'cartao_debito' && '💳 Cartão de Débito'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total do Pedido:</span>
                  <span className="font-bold text-green-600 text-xl">
                    {totalCarrinho.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                {observacoes && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Observações:</span>
                    <p className="text-gray-700 text-sm mt-1">{observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chaves PIX do Estabelecimento */}
            {formaPagamento === 'pix' && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">💠</span>
                  Chaves PIX para Pagamento
                </h3>
                
                {carregandoChavesPix ? (
                  <div className="text-center py-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">⏳ Carregando chaves PIX...</p>
                  </div>
                ) : chavesPix.length === 0 ? (
                  <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-700 text-sm">⚠️ O estabelecimento não cadastrou chaves PIX ainda.</p>
                    <p className="text-yellow-600 text-xs mt-1">Você pode finalizar o pedido e combinar o pagamento diretamente com o estabelecimento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chavesPix.map((chave) => (
                      <div key={chave.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold uppercase">
                                {chave.tipo}
                              </span>
                              <span className="font-bold text-gray-800">{chave.chave}</span>
                            </div>
                            <p className="text-sm text-gray-600">👤 <span className="font-medium">{chave.titular}</span></p>
                            <p className="text-sm text-gray-500">🏦 <span className="font-medium">{chave.banco}</span></p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(chave.chave);
                                alert('✅ Chave PIX copiada!');
                              } catch (err) {
                                console.error('Erro ao copiar:', err);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-bold flex-shrink-0"
                          >
                            📋 Copiar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={confirmarPedidoComPagamento}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-700 shadow-lg transition-all disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Processando...' : '✅ Confirmar e Finalizar Pedido'}
              </button>
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className="w-full py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                ← Voltar e Revisar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envio de Comprovante PIX */}
      {mostrarComprovante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📎</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enviar Comprovante PIX</h2>
              <p className="text-gray-600">Anexe o comprovante de pagamento do PIX para confirmar seu pedido.</p>
            </div>

            {/* Área de Upload */}
            <div className="mb-6">
              <label className="block w-full">
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-blue-50">
                  {comprovantePreview ? (
                    <div className="flex flex-col items-center">
                      <img src={comprovantePreview} alt="Comprovante" className="max-h-48 rounded-lg shadow-md mb-3" />
                      <span className="text-sm text-green-600 font-medium">✅ Imagem carregada</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📷</span>
                      <p className="text-gray-700 font-medium mb-1">Clique para selecionar o comprovante</p>
                      <p className="text-xs text-gray-500">PNG, JPG ou PDF (máx. 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('O arquivo deve ter no máximo 5MB!');
                          return;
                        }
                        setComprovanteFile(file);
                        // Criar preview se for imagem
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setComprovantePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setComprovantePreview(null);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </label>
            </div>

            {/* Informações do Pagamento */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Valor do pedido:</span>
                <span className="font-bold text-green-600">
                  {totalCarrinho.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Após o envio, o estabelecimento receberá seu pedido com o comprovante anexado.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <button
                onClick={handleEnviarComprovante}
                disabled={enviandoComprovante || !comprovanteFile}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                  enviandoComprovante || !comprovanteFile
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'
                }`}
              >
                {enviandoComprovante ? '⏳ Enviando comprovante...' : '✅ Confirmar Envio do Comprovante'}
              </button>
              <button
                onClick={() => {
                  setMostrarComprovante(false);
                  setComprovanteFile(null);
                  setComprovantePreview(null);
                }}
                className="w-full py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                ← Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
