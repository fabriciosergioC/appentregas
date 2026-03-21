import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/services/api';
import '@/app/globals.css';

interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[];
  status: 'pendente' | 'aceito' | 'em_transito' | 'entregue';
  entregador_id?: string | null;
  entregadorId?: string;
  entregadorNome?: string;
  entregadorTelefone?: string;
  estabelecimento_nome?: string | null;
  estabelecimento_endereco?: string | null;
  valor_pedido?: number | null;
  valor_entregador?: number | null;
  liberado_pelo_estabelecimento?: boolean;
  liberado_em?: string | null;
  created_at: string;
  createdAt: Date;
}

type FiltroPedidos = 'todos' | 'pendentes' | 'em_entrega' | 'entregues';

export default function Estabelecimento() {
  const router = useRouter();
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [itens, setItens] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [enderecoEstabelecimento, setEnderecoEstabelecimento] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [valorEntregador, setValorEntregador] = useState('');
  const [valorPedidoFormatado, setValorPedidoFormatado] = useState('');
  const [valorEntregadorFormatado, setValorEntregadorFormatado] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroPedidos>('todos');
  const [statusConexao, setStatusConexao] = useState<'online' | 'offline'>('online');
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null);
  const [ultimoPedidoCriado, setUltimoPedidoCriado] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: string; email: string; nome_estabelecimento?: string } | null>(null);

  // Verificar se usuário está logado
  useEffect(() => {
    const user = localStorage.getItem('estabelecimento_user');
    if (!user) {
      router.push('/login-estabelecimento');
      return;
    }
    const userData = JSON.parse(user);
    setUsuarioLogado(userData);
    
    // Carregar nome do estabelecimento
    const nomeSalvo = localStorage.getItem('nome_estabelecimento') || userData.nome_estabelecimento;
    if (nomeSalvo) {
      setNomeEstabelecimento(nomeSalvo);
    }
  }, []);

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

  // Salvar nome e endereço do estabelecimento no localStorage
  const handleSalvarNomeEstabelecimento = (nome: string) => {
    setNomeEstabelecimento(nome);
    localStorage.setItem('nome_estabelecimento', nome);
  };

  const handleSalvarEnderecoEstabelecimento = (endereco: string) => {
    setEnderecoEstabelecimento(endereco);
    localStorage.setItem('endereco_estabelecimento', endereco);
  };

  // Gerar link de rastreamento
  const gerarLinkRastreamento = (pedidoId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/painel-cliente/${pedidoId}`;
    }
    return `/painel-cliente/${pedidoId}`;
  };

  // Copiar apenas o ID do pedido
  const copiarIdPedido = async (pedidoId: string) => {
    try {
      await navigator.clipboard.writeText(pedidoId);
      setLinkCopiado(pedidoId);
      setTimeout(() => setLinkCopiado(null), 2000);
      alert(`✅ ID do pedido copiado!\n\n${pedidoId}\n\nO cliente pode usar este ID para acompanhar o pedido.`);
    } catch (error) {
      console.error('Erro ao copiar ID:', error);
      alert('Erro ao copiar ID. Tente novamente.');
    }
  };

  // Copiar link de rastreamento
  const copiarLinkRastreamento = async (pedidoId: string) => {
    const link = gerarLinkRastreamento(pedidoId);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(pedidoId);
      setTimeout(() => setLinkCopiado(null), 2000);
      alert(`✅ Link de rastreamento copiado!\n\n${link}\n\nEnvie este link para o cliente acompanhar o pedido em tempo real.`);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('Erro ao copiar link. Tente novamente.');
    }
  };

  // Compartilhar link de rastreamento
  const compartilharLinkRastreamento = async (pedidoId: string, clienteNome: string) => {
    const link = gerarLinkRastreamento(pedidoId);
    const shareData = {
      title: 'Acompanhar Pedido',
      text: `Olá! Acompanhe seu pedido em tempo real:`,
      url: link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        await copiarLinkRastreamento(pedidoId);
      }
    } else {
      await copiarLinkRastreamento(pedidoId);
    }
  };

  // Carregar pedidos ao iniciar
  useEffect(() => {
    // Carregar dados do estabelecimento do localStorage
    const nomeSalvo = localStorage.getItem('nome_estabelecimento');
    const enderecoSalvo = localStorage.getItem('endereco_estabelecimento');
    if (nomeSalvo) setNomeEstabelecimento(nomeSalvo);
    if (enderecoSalvo) setEnderecoEstabelecimento(enderecoSalvo);

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
        // Normalizar dados dos pedidos
        const pedidosNormalizados = data.map(pedido => ({
          ...pedido,
          entregadorId: pedido.entregador_id || pedido.entregadorId,
          entregadorNome: (pedido as any).entregador?.nome || pedido.entregadorNome,
          entregadorTelefone: (pedido as any).entregador?.telefone || pedido.entregadorTelefone,
          createdAt: pedido.created_at ? new Date(pedido.created_at) : new Date(),
          liberado_pelo_estabelecimento: pedido.liberado_pelo_estabelecimento || false
        }));
        
        setPedidos([...pedidosNormalizados].reverse()); // Mais recentes primeiro
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
        estabelecimento_endereco: enderecoEstabelecimento,
        valor_pedido: valorPedido ? parseFloat(valorPedido) : null,
        valor_entregador: valorEntregador ? parseFloat(valorEntregador) : null
      });

      const resultado = await api.criarPedido(
        cliente,
        endereco,
        itens.split('\n').filter(item => item.trim()),
        nomeEstabelecimento,
        valorPedido ? parseFloat(valorPedido) : null,
        valorEntregador ? parseFloat(valorEntregador) : null,
        enderecoEstabelecimento
      );

      if (resultado.error) {
        console.error('❌ Erro ao criar pedido:', resultado.error);
        alert('Erro ao criar pedido: ' + resultado.error.message);
        return;
      }

      console.log('✅ Pedido criado com sucesso:', resultado.data);
      
      // Gerar link de rastreamento
      const linkRastreamento = gerarLinkRastreamento(resultado.data.id);
      
      // Salvar ID do último pedido criado para mostrar o link
      setUltimoPedidoCriado(resultado.data.id);
      
      alert(`✅ Pedido criado e enviado para os entregadores!\n\n🔗 Link de rastreamento: ${linkRastreamento}\n\nEnvie este link para o cliente acompanhar o pedido em tempo real.`);
      
      setCliente('');
      setEndereco('');
      setItens('');
      setNomeEstabelecimento('');
      setEnderecoEstabelecimento('');
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

  // Liberar pedido para o entregador (direciona para Meus Pedidos no app do entregador)
  const handleLiberarPedido = async (pedidoId: string, entregadorId?: string) => {
    if (!entregadorId) {
      alert('⚠️ Nenhum entregador aceitou este pedido ainda!');
      return;
    }

    try {
      // Liberar pedido no Supabase
      const resultado = await api.liberarPedidoParaEntregador(pedidoId);

      if (resultado.error) {
        console.error('❌ Erro ao liberar pedido:', resultado.error);
        alert('Erro ao liberar pedido: ' + resultado.error.message);
        return;
      }

      console.log('✅ Pedido liberado com sucesso:', resultado.data);
      
      // Copiar link de rastreamento automaticamente
      const link = gerarLinkRastreamento(pedidoId);
      await navigator.clipboard.writeText(link);
      
      alert(`✅ Pedido liberado para o entregador!\n\n🔗 Link de rastreamento copiado!\n\nEnvie para o cliente acompanhar: ${link}`);

      // Recarregar pedidos para atualizar status
      carregarPedidos();
    } catch (error) {
      console.error('❌ Erro ao liberar pedido:', error);
      alert('Erro ao liberar pedido: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('estabelecimento_user');
    router.push('/login-estabelecimento');
  };

  return (
    <>
      {!usuarioLogado ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🔄</div>
            <p className="text-gray-600">Verificando login...</p>
          </div>
        </div>
      ) : (
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
              <h1 className="text-xl font-bold">🏪 {usuarioLogado?.nome_estabelecimento || 'Painel do Estabelecimento'}</h1>
              {usuarioLogado && (
                <p className="text-xs text-blue-200">📧 {usuarioLogado.email}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${
                statusConexao === 'online' ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <span className="text-xs">
                {statusConexao === 'online' ? '✅ Online' : '❌ Offline'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 max-w-4xl mx-auto">
          {/* Banner do Último Pedido Criado */}
          {ultimoPedidoCriado && (
            <section className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎉</span> Pedido Criado com Sucesso!
                  </h2>
                  <p className="text-green-100 mb-3">
                    Pedido #{ultimoPedidoCriado.slice(-8)}
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs font-medium text-green-50 mb-2">🔗 Link de Rastreamento:</p>
                    <code className="block bg-white/30 rounded px-3 py-2 text-sm font-mono break-all mb-3">
                      {gerarLinkRastreamento(ultimoPedidoCriado)}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copiarIdPedido(ultimoPedidoCriado)}
                        className="flex-1 bg-white text-green-600 hover:bg-green-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        {linkCopiado === ultimoPedidoCriado ? '✅ Copiado!' : '📋 Copiar ID'}
                      </button>
                      <button
                        onClick={() => compartilharLinkRastreamento(ultimoPedidoCriado, '')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        📤 Enviar
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setUltimoPedidoCriado(null)}
                  className="text-green-100 hover:text-white transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </section>
          )}

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
                  📍 Endereço do Estabelecimento
                </label>
                <input
                  type="text"
                  value={enderecoEstabelecimento}
                  onChange={(e) => handleSalvarEnderecoEstabelecimento(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
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
                        {pedido.estabelecimento_endereco && (
                          <p className="text-xs text-gray-500">📍 {pedido.estabelecimento_endereco}</p>
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

                    {/* Status de liberação */}
                    {pedido.entregadorId && (
                      <div className={`rounded p-2 mb-2 border ${
                        pedido.liberado_pelo_estabelecimento 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <p className={`text-xs font-medium ${
                          pedido.liberado_pelo_estabelecimento 
                            ? 'text-green-700' 
                            : 'text-yellow-700'
                        }`}>
                          {pedido.liberado_pelo_estabelecimento 
                            ? '✅ Pedido liberado para o entregador' 
                            : '⏳ Aguardando liberação do estabelecimento'}
                        </p>
                        {pedido.liberado_em && pedido.liberado_pelo_estabelecimento && (
                          <p className="text-xs text-green-600 mt-1">
                            Liberado em: {new Date(pedido.liberado_em).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Botão Liberar Pedido - aparece quando entregador aceitou e ainda não foi liberado */}
                    {pedido.status === 'aceito' && pedido.entregadorId && !pedido.liberado_pelo_estabelecimento && (
                      <button
                        onClick={() => handleLiberarPedido(pedido.id, pedido.entregadorId)}
                        className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        🚀 Liberar Pedido para Entregador
                      </button>
                    )}

                    {/* Link de Rastreamento - aparece em TODOS os pedidos */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2 text-center">
                          🔗 ID para Rastreamento
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copiarIdPedido(pedido.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {linkCopiado === pedido.id ? '✅ Copiado!' : '📋 Copiar ID'}
                          </button>
                          <button
                            onClick={() => compartilharLinkRastreamento(pedido.id, pedido.cliente)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            📤 Enviar
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-2 text-center">
                          Copie o ID e envie para o cliente acompanhar
                        </p>
                      </div>
                    </div>

                    {pedido.liberado_pelo_estabelecimento && (
                      <div className="space-y-2 mt-2">
                        <div className="text-center text-sm text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg p-2">
                          ✅ Entregador já foi notificado e pode iniciar a entrega
                        </div>
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
      )}
    </>
  );
}
