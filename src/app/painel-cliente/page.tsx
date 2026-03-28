'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import EstabelecimentoCard from '@/components/estabelecimentoCard/EstabelecimentoCard';
import '../animations-global.css';

interface Estabelecimento {
  id: string;
  nome_estabelecimento: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  cnpj?: string;
  contato_estabelecimento?: string;
  ativo: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PainelClientePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pedidoId, setPedidoId] = useState('');
  const [erro, setErro] = useState('');
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoPedidos, setHistoricoPedidos] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Verificar se vem um ID pela URL (parâmetro ?id=)
  useEffect(() => {
    const idParam = searchParams?.get('id');
    if (idParam) {
      setPedidoId(idParam);
    }
  }, [searchParams]);

  // Buscar estabelecimentos
  useEffect(() => {
    async function buscarEstabelecimentos() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('estabelecimentos')
          .select('*')
          .eq('ativo', true)
          .order('nome_estabelecimento', { ascending: true });

        if (error) {
          console.error('Erro ao buscar estabelecimentos:', error);
          setErro('Erro ao carregar estabelecimentos');
          return;
        }

        if (data) {
          setEstabelecimentos(data);
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
        setErro('Erro ao carregar estabelecimentos');
      } finally {
        setLoading(false);
      }
    }

    buscarEstabelecimentos();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pedidoId.trim()) {
      setErro('Por favor, digite o ID do seu pedido');
      return;
    }

    // Validar formato do ID (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pedidoId.trim())) {
      setErro('ID do pedido inválido. Verifique o formato.');
      return;
    }

    router.push(`/painel-cliente/${pedidoId.trim()}`);
  };

  // Filtrar estabelecimentos
  const estabelecimentosFiltrados = estabelecimentos.filter((estab) =>
    estab.nome_estabelecimento.toLowerCase().includes(filtro.toLowerCase()) ||
    estab.nome_responsavel.toLowerCase().includes(filtro.toLowerCase())
  );

  // Carregar histórico de pedidos
  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      // Carregar todos os pedidos concluídos ou cancelados
      const { data, error } = await supabase
        .from('fila_pedidos')
        .select(`
          *,
          estabelecimento:estabelecimentos!estabelecimento_id (
            nome_estabelecimento
          )
        `)
        .in('status', ['entregue', 'cancelado'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Filtrar apenas pedidos que têm telefone_cliente (feitos pelo cliente)
      // Isso diferencia pedidos feitos pelo estabelecimento manualmente
      const pedidosCliente = (data || []).filter(pedido => pedido.telefone_cliente);
      
      setHistoricoPedidos(pedidosCliente);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Carregar histórico quando abrir o modal
  useEffect(() => {
    if (mostrarHistorico) {
      carregarHistorico();
    }
  }, [mostrarHistorico]);

  return (
    <div className="bg-animated-red">
      {/* Círculos decorativos */}
      <div className="decorative-circle decorative-circle-1"></div>
      <div className="decorative-circle decorative-circle-2"></div>
      <div className="decorative-circle decorative-circle-3"></div>

      <div className="page-container-centered max-w-7xl w-full mx-auto px-4">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="logo-animated logo-red mb-6">
              <span className="logo-emoji">📦</span>
            </div>

            <h1 className="page-title-white">
              Acompanhe seu Pedido
            </h1>

            {/* Botão de Histórico */}
            <div className="mt-4">
              <button
                onClick={() => setMostrarHistorico(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg"
              >
                📜 Meu Histórico de Pedidos
              </button>
            </div>

            {/* Busca de Estabelecimentos */}
            <div className="max-w-md mx-auto mb-4 mt-6">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar estabelecimento..."
                  className="animated-input animated-input-red w-full"
                />
                <span className="input-icon">🔍</span>
              </div>
            </div>
          </div>

          {/* Lista de Estabelecimentos */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="page-title-white" style={{ fontSize: '1.5rem', textAlign: 'left' }}>
                🏪 Estabelecimentos Cadastrados
              </h2>
              <span className="page-subtitle-white" style={{ margin: 0 }}>
                {estabelecimentosFiltrados.length} encontrado(s)
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-animated card-animated-red animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-300 rounded mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : estabelecimentosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {estabelecimentosFiltrados.map((estabelecimento) => (
                  <EstabelecimentoCard
                    key={estabelecimento.id}
                    estabelecimento={estabelecimento}
                  />
                ))}
              </div>
            ) : (
              <div className="card-animated card-animated-red text-center">
                <span className="text-6xl mb-4 block">😕</span>
                <p className="page-subtitle-white">
                  {filtro
                    ? `Nenhum estabelecimento encontrado para "${filtro}"`
                    : 'Nenhum estabelecimento cadastrado ainda'}
                </p>
              </div>
            )}
          </div>

          {/* Rastrear Pedido */}
          <div className="card-animated card-animated-red mb-8">
            <h3 className="page-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              🚀 Rastrear Pedido Existente
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="input-group">
                <label htmlFor="pedidoId" className="input-label">
                  ID do Pedido
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="pedidoId"
                    value={pedidoId}
                    onChange={(e) => {
                      setPedidoId(e.target.value);
                      setErro('');
                    }}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="animated-input animated-input-red font-mono"
                  />
                  <span className="input-icon">📦</span>
                </div>
                {erro && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {erro}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-animated btn-red"
              >
                <span className="btn-content">
                  <span>🚀</span>
                  <span>Rastrear Pedido</span>
                </span>
              </button>
            </form>

            {/* Informações */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="input-label mb-3">📍 Onde encontrar o ID do pedido?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>No comprovante enviado pelo estabelecimento (apenas o código UUID)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>No WhatsApp ou SMS recebido do estabelecimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>Pergunte ao atendente do estabelecimento</span>
                </li>
              </ul>
            </div>
          </div>

        {/* Modal de Histórico de Pedidos */}
        {mostrarHistorico && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  📜 Histórico de Pedidos
                </h3>
                <button
                  onClick={() => setMostrarHistorico(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {loadingHistorico ? (
                  <div className="text-center py-12">
                    <span className="text-4xl animate-spin block mb-4">⏳</span>
                    <p className="text-gray-600">Carregando histórico...</p>
                  </div>
                ) : historicoPedidos.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl block mb-4">📦</span>
                    <p className="text-gray-600 text-lg">Nenhum pedido no histórico</p>
                    <p className="text-gray-500 text-sm mt-2">Seus pedidos concluídos ou cancelados aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historicoPedidos.map((pedido) => (
                      <div
                        key={pedido.id}
                        className={`border-2 rounded-xl p-4 ${
                          pedido.status === 'entregue'
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                              {pedido.status === 'entregue' ? '✅ Pedido Entregue' : '❌ Pedido Cancelado'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              🕒 {new Date(pedido.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              pedido.status === 'entregue'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                          >
                            {pedido.status === 'entregue' ? 'CONCLUÍDO' : 'CANCELADO'}
                          </span>
                        </div>

                        {/* Informações do Pedido */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">👤 Cliente:</p>
                            <p className="text-sm font-bold text-gray-800">{pedido.cliente}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">🏪 Estabelecimento:</p>
                            <p className="text-sm font-bold text-gray-800">
                              {pedido.estabelecimento?.nome_estabelecimento || pedido.estabelecimento_nome || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Itens do Pedido */}
                        <div className="bg-white rounded-lg p-3 border mb-3">
                          <p className="text-xs font-bold text-gray-700 mb-2">📦 Itens:</p>
                          <ul className="space-y-1">
                            {Array.isArray(pedido.itens) ? (
                              pedido.itens.map((item: string, index: number) => (
                                <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                                  <span className="text-red-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-800">{pedido.itens}</li>
                            )}
                          </ul>
                        </div>

                        {/* Forma de Pagamento e Endereço */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">💳 Forma de Pagamento:</p>
                            <p className="text-sm font-bold text-gray-800">
                              {pedido.forma_pagamento === 'pix' && '💠 PIX'}
                              {pedido.forma_pagamento === 'dinheiro' && '💵 Dinheiro'}
                              {pedido.forma_pagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                              {pedido.forma_pagamento === 'cartao_debito' && '💳 Cartão de Débito'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">📍 Endereço:</p>
                            <p className="text-sm text-gray-800">{pedido.endereco || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Observações */}
                        {pedido.observacoes && (
                          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-yellow-800 mb-1">📝 Observações:</p>
                            <p className="text-sm text-gray-800">{pedido.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
