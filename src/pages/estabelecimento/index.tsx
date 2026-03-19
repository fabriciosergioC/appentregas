import { useState, useEffect } from 'react';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';

interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[];
  status: 'pendente' | 'aceito' | 'em_transito' | 'entregue';
  entregadorId?: string;
  entregadorNome?: string;
  entregadorTelefone?: string;
  estabelecimento_nome?: string | null;
  valor_pedido?: number | null;
  valor_entregador?: number | null;
  createdAt: Date;
}

type FiltroPedidos = 'todos' | 'pendentes' | 'em_entrega' | 'entregues';

export default function Estabelecimento() {
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [itens, setItens] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [valorEntregador, setValorEntregador] = useState('');
  const [valorPedidoFormatado, setValorPedidoFormatado] = useState('');
  const [valorEntregadorFormatado, setValorEntregadorFormatado] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroPedidos>('todos');
  const [statusConexao, setStatusConexao] = useState<'online' | 'offline'>('online');

  // Formatar valor em moeda enquanto digita
  const handleValorPedidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setValorPedidoFormatado(`R$ ${valor}`);
    setValorPedido(valor.replace(',', '.'));
  };

  const handleValorEntregadorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setValorEntregadorFormatado(`R$ ${valor}`);
    setValorEntregador(valor.replace(',', '.'));
  };

  // Salvar nome do estabelecimento no localStorage
  const handleSalvarNomeEstabelecimento = (nome: string) => {
    setNomeEstabelecimento(nome);
    localStorage.setItem('nome_estabelecimento', nome);
  };

  // Carregar pedidos ao iniciar
  useEffect(() => {
    carregarPedidos();

    // Atualizar lista periodicamente
    const intervalo = setInterval(carregarPedidos, 5000);
    return () => {
      clearInterval(intervalo);
    };
  }, []);

  const carregarPedidos = async () => {
    try {
      const resultado = await api.listarTodosPedidos();
      const data = resultado.data || [];
      
      if (Array.isArray(data)) {
        setPedidos([...data].reverse()); // Mais recentes primeiro
        setStatusConexao('online');
      } else {
        console.error('Dados não são um array:', data);
        setPedidos([]);
        setStatusConexao('offline');
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
      setStatusConexao('offline');
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'pendentes') return pedido.status === 'pendente' || pedido.status === 'aceito';
    if (filtroAtivo === 'em_entrega') return pedido.status === 'em_transito';
    if (filtroAtivo === 'entregues') return pedido.status === 'entregue';
    return true;
  });

  const contagemPedidos = {
    todos: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'pendente' || p.status === 'aceito').length,
    em_entrega: pedidos.filter(p => p.status === 'em_transito').length,
    entregues: pedidos.filter(p => p.status === 'entregue').length,
  };

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente || !endereco || !itens) {
      alert('Preencha todos os campos!');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Criando pedido no Supabase...');
      console.log('📦 Dados do pedido:', {
        cliente,
        endereco,
        itens: itens.split('\n').filter(item => item.trim()),
        estabelecimento: nomeEstabelecimento,
        valor_pedido: valorPedido ? parseFloat(valorPedido) : null,
        valor_entregador: valorEntregador ? parseFloat(valorEntregador) : null
      });

      const resultado = await api.criarPedido(
        cliente,
        endereco,
        itens.split('\n').filter(item => item.trim()),
        nomeEstabelecimento,
        valorPedido ? parseFloat(valorPedido) : null,
        valorEntregador ? parseFloat(valorEntregador) : null
      );

      if (resultado.error) {
        console.error('❌ Erro ao criar pedido:', resultado.error);
        alert('Erro ao criar pedido: ' + resultado.error.message);
        return;
      }

      console.log('✅ Pedido criado com sucesso:', resultado.data);
      alert('✅ Pedido criado e enviado para os entregadores!');
      setCliente('');
      setEndereco('');
      setItens('');
      setNomeEstabelecimento('');
      setValorPedido('');
      setValorEntregador('');
      setValorPedidoFormatado('');
      setValorEntregadorFormatado('');
      carregarPedidos();
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      alert('Erro ao criar pedido: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: '⏳ Pendente',
      aceito: '✅ Aceito',
      em_transito: '🚗 Em trânsito',
      entregue: '✅ Entregue',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      aceito: 'bg-blue-100 text-blue-800',
      em_transito: 'bg-purple-100 text-purple-800',
      entregue: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatarValor = (valor: number | null | undefined) => {
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <>
      <Head>
        <title>Painel do Estabelecimento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🏪 Painel do Estabelecimento</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${
                statusConexao === 'online' ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <span className="text-xs">
                {statusConexao === 'online' ? '✅ Online' : '❌ Offline'}
              </span>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 max-w-4xl mx-auto">
          {/* Formulário de Novo Pedido */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Criar Novo Pedido
            </h2>

            <form onSubmit={handleCriarPedido} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={nomeEstabelecimento}
                  onChange={(e) => handleSalvarNomeEstabelecimento(e.target.value)}
                  placeholder="Ex: Pizzaria do Jaime"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço de Entrega
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itens do Pedido
                </label>
                <textarea
                  value={itens}
                  onChange={(e) => setItens(e.target.value)}
                  placeholder="Digite cada item em uma linha&#10;Ex: Pizza Grande&#10;Refrigerante 2L"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Digite cada item em uma linha separada</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Valor do Pedido
                  </label>
                  <input
                    type="text"
                    value={valorPedidoFormatado}
                    onChange={handleValorPedidoChange}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🛵 Valor do Entregador
                  </label>
                  <input
                    type="text"
                    value={valorEntregadorFormatado}
                    onChange={handleValorEntregadorChange}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Enviando...' : '📦 Criar Pedido e Enviar para Entregadores'}
              </button>
            </form>
          </section>

          {/* Lista de Pedidos */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Pedidos
              <span className="text-sm font-normal text-gray-500">({pedidosFiltrados.length})</span>
            </h2>

            {/* Filtros */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFiltroAtivo('todos')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({contagemPedidos.todos})
              </button>
              <button
                onClick={() => setFiltroAtivo('pendentes')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'pendentes'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pendentes ({contagemPedidos.pendentes})
              </button>
              <button
                onClick={() => setFiltroAtivo('em_entrega')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'em_entrega'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Em Entrega ({contagemPedidos.em_entrega})
              </button>
              <button
                onClick={() => setFiltroAtivo('entregues')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'entregues'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Entregues ({contagemPedidos.entregues})
              </button>
            </div>

            {pedidosFiltrados.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-6xl">📦</span>
                <p className="text-gray-500 mt-4">
                  {filtroAtivo === 'todos' 
                    ? 'Nenhum pedido registrado' 
                    : filtroAtivo === 'pendentes'
                    ? 'Nenhum pedido pendente'
                    : filtroAtivo === 'em_entrega'
                    ? 'Nenhum pedido em entrega'
                    : 'Nenhum pedido entregue'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosFiltrados.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">Pedido #{pedido.id.slice(-4)}</h3>
                        <p className="text-sm text-gray-600">{pedido.cliente}</p>
                        {pedido.estabelecimento_nome && (
                          <p className="text-xs text-gray-500">🏪 {pedido.estabelecimento_nome}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                        {getStatusLabel(pedido.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <p className="flex items-center gap-1">
                        <span>📍</span>
                        {pedido.endereco}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded p-2 mb-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Itens:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {pedido.itens.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-green-50 rounded p-2 border border-green-100">
                        <p className="text-xs font-medium text-green-700 mb-1">💰 Valor do Pedido:</p>
                        <p className="text-sm text-green-900 font-bold">{formatarValor(pedido.valor_pedido)}</p>
                      </div>
                      <div className="bg-purple-50 rounded p-2 border border-purple-100">
                        <p className="text-xs font-medium text-purple-700 mb-1">🛵 Valor do Entregador:</p>
                        <p className="text-sm text-purple-900 font-bold">{formatarValor(pedido.valor_entregador)}</p>
                      </div>
                    </div>

                    {pedido.entregadorId && pedido.entregadorNome && (
                      <div className="bg-blue-50 rounded p-2 mb-2 border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-1">🛵 Entregador:</p>
                        <p className="text-sm text-blue-900 font-medium">{pedido.entregadorNome}</p>
                        {pedido.entregadorTelefone && (
                          <p className="text-xs text-blue-600">📞 {pedido.entregadorTelefone}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
