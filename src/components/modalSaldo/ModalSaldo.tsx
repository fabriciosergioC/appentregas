import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Extrato {
  id: string;
  entregador_id: string;
  pedido_id: string | null;
  tipo: 'credito' | 'debito' | 'saque';
  valor: number;
  descricao: string;
  created_at: string;
  pedidos?: {
    estabelecimento_nome: string | null;
    estabelecimento_id: string | null;
  };
}

interface Pagamento {
  id: string;
  entregador_id: string;
  estabelecimento_id: string;
  valor: number;
  forma_pagamento: string;
  descricao: string | null;
  comprovante_pix: string | null;
  status: string;
  criado_em: string;
}

interface SolicitacaoRetirada {
  id: string;
  entregador_id: string;
  valor: number;
  status: 'pendente' | 'aprovada' | 'concluida' | 'cancelada';
  criado_em: string;
}

interface ModalSaldoProps {
  aberto: boolean;
  entregadorId: string;
  onClose: () => void;
  onPagamentoVisualizado?: () => void;
}

export default function ModalSaldo({ aberto, entregadorId, onClose, onPagamentoVisualizado }: ModalSaldoProps) {
  const [saldo, setSaldo] = useState<number>(0);
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRetirada[]>([]);
  const [loading, setLoading] = useState(false);
  const [comprovanteSelecionado, setComprovanteSelecionado] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'extrato' | 'pagamentos' | 'retiradas'>('extrato');
  const [valorRetirada, setValorRetirada] = useState('');
  const [solicitandoRetirada, setSolicitandoRetirada] = useState(false);
  const [temRetiradaPendente, setTemRetiradaPendente] = useState(false);
  const [temRetiradaAprovadaNaoPaga, setTemRetiradaAprovadaNaoPaga] = useState(false);
  const [retiradasAprovadasNaoPagas, setRetiradasAprovadasNaoPagas] = useState<SolicitacaoRetirada[]>([]);
  const [todasSolicitacoes, setTodasSolicitacoes] = useState<SolicitacaoRetirada[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<{id: string, nome: string}[]>([]);
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<string>('');
  const [travarEstabelecimento, setTravarEstabelecimento] = useState(false);
  const [pedidoIdRetirada, setPedidoIdRetirada] = useState<string | null>(null);

  useEffect(() => {
    if (aberto && entregadorId) {
      carregarSaldo();
      carregarPagamentos();
      carregarSolicitacoes();
      carregarEstabelecimentoVinculado();
    }
  }, [aberto, entregadorId, abaAtiva]);

  const carregarEstabelecimentoVinculado = async () => {
    try {
      const { data: pedidosData, error } = await supabase
        .from('pedidos')
        .select('estabelecimento_id, estabelecimento_nome')
        .eq('entregador_id', entregadorId)
        .in('status', ['entregue', 'no_local']);

      if (error) throw error;

      if (pedidosData && pedidosData.length > 0) {
        const unicos: {id: string, nome: string}[] = [];
        const map = new Map();
        for (const item of pedidosData) {
          if (item.estabelecimento_id && item.estabelecimento_nome && !map.has(item.estabelecimento_id)) {
            map.set(item.estabelecimento_id, true);
            unicos.push({
              id: item.estabelecimento_id,
              nome: item.estabelecimento_nome
            });
          }
        }
        setEstabelecimentos(unicos);
        if (unicos.length === 1) {
          setEstabelecimentoSelecionado(unicos[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error);
    }
  };

  const carregarSaldo = async () => {
    setLoading(true);
    try {
      // Buscar saldo atual
      const { data: entregador, error } = await supabase
        .from('entregadores')
        .select('saldo')
        .eq('id', entregadorId)
        .single();

      if (error) {
        console.error('Erro ao buscar saldo:', error);
        return;
      }

      setSaldo(entregador?.saldo || 0);

      // Buscar extratos (últimos 50)
      const { data: extratosData } = await supabase
        .from('extratos')
        .select(`
          *,
          pedidos (
            estabelecimento_nome,
            estabelecimento_id
          )
        `)
        .eq('entregador_id', entregadorId)
        .order('created_at', { ascending: false })
        .limit(50);

      setExtratos(extratosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarPagamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagamentos_entregadores')
        .select('*')
        .eq('entregador_id', entregadorId)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPagamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const carregarSolicitacoes = async () => {
    try {
      // Buscar todas as solicitações do entregador
      const { data: todasSolicitacoes, error: errorSolicitacoes } = await supabase
        .from('solicitacoes_retirada')
        .select('*')
        .eq('entregador_id', entregadorId)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (errorSolicitacoes) throw errorSolicitacoes;
      
      // Filtrar apenas pendentes para exibição no formulário
      const pendentes = (todasSolicitacoes || []).filter(s => s.status === 'pendente');
      setSolicitacoes(pendentes);

      // Verificar se tem retirada pendente
      const temPendente = pendentes.length > 0;
      setTemRetiradaPendente(temPendente);
      
      // Verificar retiradas aprovadas que ainda não foram pagas
      const aprovadas = (todasSolicitacoes || []).filter(s => s.status === 'aprovada');
      
      // Buscar pagamentos para verificar quais retiradas já foram pagas
      const { data: pagamentos, error: errorPagamentos } = await supabase
        .from('pagamentos_entregadores')
        .select('valor, criado_em')
        .eq('entregador_id', entregadorId)
        .eq('status', 'realizado')
        .order('criado_em', { ascending: false });
      
      if (errorPagamentos) console.error('Erro ao buscar pagamentos:', errorPagamentos);
      
      // Verificar se há retiradas aprovadas sem pagamento correspondente
      const retiradasNaoPagas: SolicitacaoRetirada[] = [];
      for (const retirada of aprovadas) {
        // Verifica se existe um pagamento com valor igual ou superior após a data da aprovação
        const pagamentoCorrespondente = pagamentos?.find(p => 
          new Date(p.criado_em) >= new Date(retirada.criado_em) &&
          p.valor >= retirada.valor
        );
        
        if (!pagamentoCorrespondente) {
          retiradasNaoPagas.push(retirada);
        }
      }
      
      setRetiradasAprovadasNaoPagas(retiradasNaoPagas);
      setTemRetiradaAprovadaNaoPaga(retiradasNaoPagas.length > 0);
      
      // Armazenar todas as solicitações para o histórico completo
      setTodasSolicitacoes(todasSolicitacoes || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const handleSolicitarRetirada = async (e: React.FormEvent) => {
    e.preventDefault();

    const valorNumerico = parseFloat(valorRetirada.replace(',', '.'));
    if (!valorRetirada || isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Informe um valor válido');
      return;
    }

    if (valorNumerico > saldo) {
      alert('Saldo insuficiente para esta retirada');
      return;
    }

    if (valorNumerico <= 0) {
      alert('Informe um valor válido maior que zero');
      return;
    }

    if (!estabelecimentoSelecionado) {
      alert('⚠️ Selecione de qual local você está solicitando a retirada.');
      return;
    }

    setSolicitandoRetirada(true);

    try {
      const { error } = await supabase.from('solicitacoes_retirada').insert([{
        entregador_id: entregadorId,
        estabelecimento_id: estabelecimentoSelecionado,
        valor: valorNumerico,
        status: 'pendente',
        pedido_id: pedidoIdRetirada
      }]);

      if (error) throw error;

      alert('✅ Solicitação de retirada enviada! O estabelecimento irá processar.');
      setValorRetirada('');
      carregarSolicitacoes();
    } catch (error) {
      console.error('Erro ao solicitar retirada:', error);
      alert('Erro ao solicitar retirada. Tente novamente.');
    } finally {
      setSolicitandoRetirada(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return '💰';
      case 'debito':
        return '💳';
      case 'saque':
        return '🏦';
      default:
        return '📝';
    }
  };

  const getTipoClasse = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'text-green-600';
      case 'debito':
        return 'text-red-600';
      case 'saque':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">💰 Meu Saldo</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Saldo Atual */}
          <div className="mt-6 text-center">
            <p className="text-green-100 text-sm font-medium">Saldo Disponível</p>
            {loading ? (
              <div className="flex items-center justify-center mt-2">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <p className="text-5xl font-bold mt-3">{formatarMoeda(saldo)}</p>
            )}
          </div>
        </div>

        {/* Extrato, Pagamentos e Retiradas */}
        <div className="p-8 overflow-y-auto max-h-[500px]">
          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setAbaAtiva('extrato')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                abaAtiva === 'extrato'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Extrato
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('pagamentos')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                abaAtiva === 'pagamentos'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💳 Pagamentos
            </button>
            <button
              type="button"
              onClick={() => { 
                setAbaAtiva('retiradas'); 
                setTravarEstabelecimento(false);
                setPedidoIdRetirada(null);
              }}
              className={`hidden flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                abaAtiva === 'retiradas'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏦 Retiradas
            </button>
          </div>

          {/* Conteúdo do Extrato */}
          {abaAtiva === 'extrato' && (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Extrato
              </h3>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Carregando extrato...</p>
                </div>
              ) : extratos.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-5xl">📭</span>
                  <p className="text-gray-500 mt-4">Nenhuma transação registrada</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Seu saldo será atualizado após cada entrega finalizada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {extratos.map((extrato) => (
                    <div
                      key={extrato.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTipoIcon(extrato.tipo)}</span>
                        <div>
                          <p className="font-medium text-gray-800">
                            {extrato.pedidos?.estabelecimento_nome 
                              ? (extrato.descricao.includes('Entrega finalizada') ? `Entrega finalizada - ${extrato.pedidos.estabelecimento_nome}` : extrato.descricao)
                              : extrato.descricao}
                          </p>
                          <p className="text-xs text-gray-500">{formatarData(extrato.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`font-bold ${getTipoClasse(extrato.tipo)}`}>
                          {extrato.tipo === 'credito' ? '+' : '-'}
                          {formatarMoeda(Math.abs(extrato.valor))}
                        </span>
                        {extrato.tipo === 'credito' && extrato.descricao.includes('Entrega finalizada') && extrato.pedidos?.estabelecimento_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setAbaAtiva('retiradas');
                              setEstabelecimentoSelecionado(extrato.pedidos!.estabelecimento_id!);
                              setValorRetirada(Math.abs(extrato.valor).toString());
                              setPedidoIdRetirada(extrato.pedido_id);
                              setTravarEstabelecimento(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-all"
                          >
                            💸 Sacar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Conteúdo dos Pagamentos */}
          {abaAtiva === 'pagamentos' && (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                💳 Pagamentos Recebidos
              </h3>

              {pagamentos.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-5xl">📭</span>
                  <p className="text-gray-500 mt-4">Nenhum pagamento registrado</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Os pagamentos feitos pelo estabelecimento aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagamentos.map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {pagamento.forma_pagamento === 'pix' && '💠'}
                              {pagamento.forma_pagamento === 'dinheiro' && '💵'}
                              {pagamento.forma_pagamento === 'transferencia' && '🏦'}
                            </span>
                            <span className="text-xl font-bold text-gray-800">
                              {formatarMoeda(pagamento.valor)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatarData(pagamento.criado_em)}
                          </p>
                          {pagamento.descricao && (
                            <p className="text-xs text-gray-600 mt-1">
                              📝 {pagamento.descricao}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          pagamento.status === 'realizado'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {pagamento.status === 'realizado' ? '✅ Realizado' : '⏳ Pendente'}
                        </span>
                      </div>

                      {/* Comprovante PIX */}
                      {pagamento.comprovante_pix && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setComprovanteSelecionado(pagamento.comprovante_pix)}
                            className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            📎 Ver Comprovante PIX
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Conteúdo das Retiradas */}
          {abaAtiva === 'retiradas' && (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🏦 Solicitar Retirada
              </h3>

              {/* Saldo Disponível */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-bold">Saldo Disponível:</span>
                  <span className="text-3xl font-bold text-green-900">{formatarMoeda(saldo)}</span>
                </div>
              </div>

              {/* Aviso de Retirada Aprovada Pendente de Pagamento */}
              {temRetiradaAprovadaNaoPaga && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6 text-[env(safe-area-inset-bottom)] pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-bold text-orange-800">Pagamento Pendente</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Você possui {retiradasAprovadasNaoPagas.length} retirada(s) aprovada(s) aguardando pagamento:
                      </p>
                      <div className="mt-2 space-y-1">
                        {retiradasAprovadasNaoPagas.map(r => (
                          <p key={r.id} className="text-xs text-orange-600 font-medium">
                            • {formatarMoeda(r.valor)} - Aprovada em {formatarData(r.criado_em)}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-orange-600 mt-3 font-bold">
                        💡 Aguarde o pagamento ser realizado antes de solicitar uma nova retirada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Retirada Pendente */}
              {temRetiradaPendente && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <p className="font-bold text-yellow-800">Retirada Pendente</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Você já possui uma solicitação de retirada aguardando aprovação do estabelecimento.
                      </p>
                      <p className="text-xs text-yellow-600 mt-2 font-bold">
                        💡 Você só poderá solicitar um novo saque após este ser aceito ou cancelado.
                      </p>
                    </div>
                  </div>
                </div>
              )}



              {/* Formulário de Solicitação */}
              <form onSubmit={handleSolicitarRetirada} className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    De qual local deseja retirar? *
                  </label>
                  <select
                    value={estabelecimentoSelecionado}
                    onChange={(e) => setEstabelecimentoSelecionado(e.target.value)}
                    disabled={travarEstabelecimento}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold bg-white mb-4 disabled:bg-gray-100 disabled:text-gray-500"
                    required
                  >
                    <option value="" disabled>Selecione um estabelecimento...</option>
                    {estabelecimentos.map(est => (
                      <option key={est.id} value={est.id}>{est.nome}</option>
                    ))}
                  </select>

                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valor da Retirada *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">R$</span>
                    <input
                      type="number"
                      value={valorRetirada}
                      onChange={(e) => setValorRetirada(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                      min="0.01"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Você pode solicitar a retirada de qualquer valor do seu saldo disponível.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={solicitandoRetirada || !valorRetirada || temRetiradaPendente || temRetiradaAprovadaNaoPaga}
                  className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
                    solicitandoRetirada || !valorRetirada || temRetiradaPendente || temRetiradaAprovadaNaoPaga
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {temRetiradaAprovadaNaoPaga 
                    ? '💳 Aguarde Pagamento' 
                    : temRetiradaPendente 
                      ? '⏳ Aguarde Aprovação' 
                      : solicitandoRetirada 
                        ? '⏳ Solicitando...' 
                        : '🏦 Solicitar Retirada'}
                </button>
              </form>

              {/* Histórico de Solicitações */}
              <div className="border-t-2 pt-4">
                <h4 className="font-bold text-gray-700 mb-3 text-base">
                  📋 Histórico de Solicitações
                </h4>

                {todasSolicitacoes.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <span className="text-4xl">📭</span>
                    <p className="text-gray-500 mt-2 text-sm">Nenhuma solicitação enviada</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todasSolicitacoes.map((solicitacao) => (
                      <div
                        key={solicitacao.id}
                        className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800 text-lg">
                                {formatarMoeda(solicitacao.valor)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatarData(solicitacao.criado_em)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                solicitacao.status === 'pendente'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : solicitacao.status === 'aprovada'
                                  ? 'bg-green-100 text-green-700 font-black ring-2 ring-green-500 animate-pulse'
                                  : solicitacao.status === 'concluida'
                                  ? 'bg-emerald-100 text-emerald-700 font-bold'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {solicitacao.status === 'pendente' && '⏳ Pendente'}
                              {solicitacao.status === 'aprovada' && '✅ Aprovada / Paga!'}
                              {solicitacao.status === 'concluida' && '🏁 Concluída'}
                              {solicitacao.status === 'cancelada' && '❌ Cancelada'}
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            💡 O saldo é atualizado automaticamente após cada entrega finalizada
          </p>
        </div>
      </div>

      {/* Modal de Comprovante PIX */}
      {comprovanteSelecionado && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"
          onClick={() => setComprovanteSelecionado(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                📎 Comprovante de Pagamento PIX
              </h3>
              <button
                onClick={() => setComprovanteSelecionado(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <img
                src={comprovanteSelecionado}
                alt="Comprovante de Pagamento"
                className="w-full h-auto rounded-lg"
              />
              <div className="mt-4 flex gap-3">
                <a
                  href={comprovanteSelecionado}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  📥 Baixar Comprovante
                </a>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(comprovanteSelecionado);
                      alert('✅ Link do comprovante copiado!');
                    } catch (err) {
                      console.error('Erro ao copiar:', err);
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  📋 Copiar Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
