import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/services/api';
import { createClient } from '@supabase/supabase-js';
import ModalPagamentoEntregador from '@/components/modalPagamentoEntregador/ModalPagamentoEntregador';
import '@/app/globals.css';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[] | string;
  status: 'pendente' | 'aceito' | 'em_transito' | 'no_local' | 'entregue';
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
  telefone_cliente?: string;
  forma_pagamento?: string;
  observacoes?: string;
}

interface FilaPedido {
  id: string;
  cliente: string;
  telefone_cliente: string;
  endereco: string;
  forma_pagamento?: string;
  observacoes?: string;
  itens: string[];
  status: string;
  estabelecimento_nome?: string;
  estabelecimento_id?: string;
  criado_por?: string;
  convertido_em?: string;
  pedido_id?: string;
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
  const [formaPagamento, setFormaPagamento] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroPedidos>('todos');
  const [statusConexao, setStatusConexao] = useState<'online' | 'offline'>('online');
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null);
  const [ultimoPedidoCriado, setUltimoPedidoCriado] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<{ id: string; email: string; nome_estabelecimento?: string } | null>(null);
  const [mostrarFilaPedidos, setMostrarFilaPedidos] = useState(false);
  const [filaPedidos, setFilaPedidos] = useState<FilaPedido[]>([]);
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [carregandoPagamentos, setCarregandoPagamentos] = useState(false);

  // Verificar se usuário está logado
  useEffect(() => {
    // Verificação apenas no lado do cliente
    if (typeof window === 'undefined') return;

    const user = localStorage.getItem('estabelecimento_user');
    console.log('🔐 Verificando autenticação - User:', user);

    if (!user) {
      console.log('❌ Usuário não autenticado, redirecionando para login...');
      router.replace('/login-estabelecimento');
      return;
    }

    try {
      const userData = JSON.parse(user);
      console.log('✅ Usuário autenticado:', userData);

      setUsuarioLogado(userData);
      setEstabelecimentoId(userData.id);

      // Carregar nome do estabelecimento
      const nomeSalvo = localStorage.getItem('nome_estabelecimento') || userData.nome_estabelecimento;
      if (nomeSalvo) {
        setNomeEstabelecimento(nomeSalvo);
      }
    } catch (error) {
      console.error('❌ Erro ao parsear usuário:', error);
      localStorage.removeItem('estabelecimento_user');
      router.replace('/login-estabelecimento');
    }
  }, [router]);

  // Timeout de inatividade - 1 minuto
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const TEMPO_INATIVIDADE_MS = 60 * 1000; // 1 minuto
    let timeoutId: NodeJS.Timeout;

    const resetarTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('⏰ Tempo de inatividade atingido, redirecionando para login...');
        localStorage.removeItem('estabelecimento_user');
        localStorage.removeItem('nome_estabelecimento');
        router.replace('/login-estabelecimento');
      }, TEMPO_INATIVIDADE_MS);
    };

    // Eventos que resetam o timeout
    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    eventos.forEach(evento => {
      window.addEventListener(evento, resetarTimeout);
    });

    // Iniciar timeout
    resetarTimeout();

    // Limpar ao desmontar
    return () => {
      clearTimeout(timeoutId);
      eventos.forEach(evento => {
        window.removeEventListener(evento, resetarTimeout);
      });
    };
  }, [router]);

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
    carregarFilaPedidos();

    // Atualizar lista periodicamente
    const intervalo = setInterval(carregarPedidos, 5000);
    const intervaloFila = setInterval(carregarFilaPedidos, 5000);
    return () => {
      clearInterval(intervalo);
      clearInterval(intervaloFila);
    };
  }, [estabelecimentoId]);

  const carregarPedidos = async () => {
    try {
      const resultado = await api.listarTodosPedidos();
      const data = resultado.data || [];

      if (Array.isArray(data)) {
        // Filtrar apenas pedidos que NÃO vieram da fila de clientes (criados manualmente pelo estabelecimento)
        // Pedidos da fila têm estabelecimento_nome E foram criados via carrinho
        const pedidosFiltrados = data.filter(pedido => {
          // Mostra pedidos criados manualmente (sem estabelecimento_nome ou sem telefone_cliente)
          return !pedido.telefone_cliente;
        });

        // Normalizar dados dos pedidos
        const pedidosNormalizados = pedidosFiltrados.map(pedido => ({
          ...pedido,
          entregadorId: pedido.entregador_id || pedido.entregadorId,
          entregadorNome: (pedido as any).entregador?.nome || pedido.entregadorNome,
          entregadorTelefone: (pedido as any).entregador?.telefone || pedido.entregadorTelefone,
          createdAt: pedido.created_at ? new Date(pedido.created_at) : new Date(),
          liberado_pelo_estabelecimento: pedido.liberado_pelo_estabelecimento || false,
          telefone_cliente: pedido.telefone_cliente || '',
          forma_pagamento: pedido.forma_pagamento || '',
          observacoes: pedido.observacoes || ''
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

  // Carregar pedidos da fila (tabela separada)
  const carregarFilaPedidos = async () => {
    try {
      // Se não tiver estabelecimento_id, não carrega
      if (!estabelecimentoId) {
        console.log('⚠️ Sem estabelecimento_id para filtrar fila');
        setFilaPedidos([]);
        return;
      }

      console.log('🔍 Buscando fila de pedidos para estabelecimento_id:', estabelecimentoId);

      const { data, error } = await supabase
        .from('fila_pedidos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .in('status', ['pendente', 'em_preparacao', 'em_rota'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar fila de pedidos:', error);
        setFilaPedidos([]);
        return;
      }

      console.log('✅ Fila carregada:', data?.length || 0, 'pedidos');
      if (data && data.length > 0) {
        console.log('📋 Primeiro pedido:', data[0]);
      }

      if (data) {
        const filaNormalizada = data.map(pedido => ({
          ...pedido,
          createdAt: pedido.created_at ? new Date(pedido.created_at) : new Date(),
        }));
        setFilaPedidos(filaNormalizada);
      } else {
        setFilaPedidos([]);
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao carregar fila:', err);
      setFilaPedidos([]);
    }
  };

  // Aceitar pedido da fila (mudar status para em_preparacao e criar pedido)
  const aceitarPedidoFila = async (filaPedido: FilaPedido) => {
    try {
      // O pedido não é mais enviado automaticamente para o painel de pedidos do entregador
      console.log('Pedido aceito na fila. Não será enviado para a tabela de pedidos.');

      // Atualizar fila mudando status para em_preparacao
      const { error: erroUpdate } = await supabase
        .from('fila_pedidos')
        .update({ 
          status: 'em_preparacao',
          convertido_em: new Date().toISOString()
        })
        .eq('id', filaPedido.id);

      if (erroUpdate) {
        console.error('Erro ao atualizar fila_pedidos:', erroUpdate);
        alert('Erro ao atualizar o status na fila: ' + erroUpdate.message);
        return;
      }

      alert(`✅ Pedido aceito!\n\nO pedido de ${filaPedido.cliente} está em preparação.`);

      // Recarregar listas
      carregarPedidos();
      carregarFilaPedidos();
    } catch (err) {
      console.error('Erro ao aceitar pedido:', err);
      alert('Erro ao aceitar pedido!');
    }
  };

  // Atualizar status de um pedido na fila (manual)
  const atualizarStatusFila = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('fila_pedidos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar status: ' + error.message);
        return;
      }

      carregarFilaPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro inesperado ao atualizar status');
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'pendentes') return pedido.status === 'pendente' || pedido.status === 'aceito';
    if (filtroAtivo === 'em_entrega') return pedido.status === 'em_transito' || pedido.status === 'no_local';
    if (filtroAtivo === 'entregues') return pedido.status === 'entregue';
    return true;
  });

  const contagemPedidos = {
    todos: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'pendente' || p.status === 'aceito').length,
    em_entrega: pedidos.filter(p => p.status === 'em_transito' || p.status === 'no_local').length,
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
        valor_pedido: valorPedido ? parseFloat(valorPedido) : 0,
        valor_entregador: valorEntregador ? parseFloat(valorEntregador) : 0
      });

      const resultado = await api.criarPedido(
        cliente,
        endereco,
        itens.split('\n').filter(item => item.trim()),
        nomeEstabelecimento,
        valorPedido ? parseFloat(valorPedido) : 0,
        valorEntregador ? parseFloat(valorEntregador) : 0,
        enderecoEstabelecimento,
        formaPagamento
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
      setFormaPagamento('');
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
      no_local: '📍 No Local',
      entregue: '✅ Entregue',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      aceito: 'bg-blue-100 text-blue-800',
      em_transito: 'bg-purple-100 text-purple-800',
      no_local: 'bg-orange-100 text-orange-800',
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

  const carregarPagamentos = async () => {
    if (!estabelecimentoId) return;
    
    setCarregandoPagamentos(true);
    try {
      const { data, error } = await supabase
        .from('pagamentos_entregadores')
        .select(`
          *,
          entregador:entregadores(nome, telefone)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPagamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setCarregandoPagamentos(false);
    }
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
        {/* Sidebar Desktop e Barra de Navegação Mobile */}
        {/* Desktop Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 hidden lg:block">
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              Menu
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setMostrarFilaPedidos(false)}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center gap-3 text-left ${
                  !mostrarFilaPedidos && router.pathname !== '/cadastro-produto'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl">📋</span>
                Pedidos
              </button>
              <button
                onClick={() => setMostrarFilaPedidos(true)}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center gap-3 text-left relative ${
                  mostrarFilaPedidos && router.pathname !== '/cadastro-produto'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl">⏳</span>
                Fila de Pedidos
                {filaPedidos.filter(p => p.status === 'pendente').length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {filaPedidos.filter(p => p.status === 'pendente').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/cadastro-produto')}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-all flex items-center gap-3 text-left ${
                  router.pathname === '/cadastro-produto'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xl">🛍️</span>
                Produtos
              </button>
            </nav>
          </div>
        </aside>

        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md lg:ml-64">
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
                onClick={() => {
                  carregarPagamentos();
                  setModalPagamentoAberto(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
                title="Pagar entregadores"
              >
                💰 Pagamentos
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 w-full bg-white shadow-lg z-50 border-t border-gray-200 lg:hidden flex justify-around p-2 pb-safe">
          <button
            onClick={() => setMostrarFilaPedidos(false)}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              !mostrarFilaPedidos && router.pathname !== '/cadastro-produto' ? 'text-blue-600 font-bold' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-1">📋</span>
            <span className="text-xs">Pedidos</span>
          </button>
          
          <button
            onClick={() => setMostrarFilaPedidos(true)}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 relative ${
              mostrarFilaPedidos && router.pathname !== '/cadastro-produto' ? 'text-orange-500 font-bold' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <span className="text-2xl mb-1">⏳</span>
              {filaPedidos.filter(p => p.status === 'pendente').length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {filaPedidos.filter(p => p.status === 'pendente').length}
                </span>
              )}
            </div>
            <span className="text-xs">Fila</span>
          </button>
          
          <button
            onClick={() => router.push('/cadastro-produto')}
            className={`flex flex-col items-center p-2 rounded-lg flex-1 ${
              router.pathname === '/cadastro-produto' ? 'text-green-600 font-bold' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-1">🛍️</span>
            <span className="text-xs">Produtos</span>
          </button>
        </nav>

        <main className="p-4 max-w-4xl mx-auto lg:ml-64 mb-20">
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
          {!mostrarFilaPedidos && (
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🏪</span>
                  <input
                    type="text"
                    value={nomeEstabelecimento}
                    onChange={(e) => handleSalvarNomeEstabelecimento(e.target.value)}
                    placeholder="Ex: Pizzaria do Jaime"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📍 Endereço do Estabelecimento
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📍</span>
                  <input
                    type="text"
                    value={enderecoEstabelecimento}
                    onChange={(e) => handleSalvarEnderecoEstabelecimento(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço de Entrega
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🏠</span>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💳 Forma de Pagamento
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">💳</span>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all appearance-none"
                  >
                    <option value="">Selecione a forma de pagamento (Opcional)</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Maquininha na Entrega">Maquininha na Entrega</option>
                    <option value="Pago no App/Site">Já Pago no App/Site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itens do Pedido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-4 text-gray-400 text-lg">📦</span>
                  <textarea
                    value={itens}
                    onChange={(e) => setItens(e.target.value)}
                    placeholder="Digite cada item em uma linha&#10;Ex: Pizza Grande&#10;Refrigerante 2L"
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Digite cada item em uma linha separada</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Valor do Pedido
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">💰</span>
                    <input
                      type="text"
                      value={valorPedidoFormatado}
                      onChange={handleValorPedidoChange}
                      placeholder="R$ 0,00"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black text-lg transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🛵 Valor do Entregador
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🤝</span>
                    <input
                      type="text"
                      value={valorEntregadorFormatado}
                      onChange={handleValorEntregadorChange}
                      placeholder="R$ 0,00"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black text-lg transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Subtotal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center mt-2">
                <span className="font-bold text-blue-800">💵 Subtotal do Pedido:</span>
                <span className="text-2xl font-black text-blue-900">
                  {((parseFloat(valorPedido || '0') || 0) + (parseFloat(valorEntregador || '0') || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
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
          )}

          {/* Lista de Pedidos */}
          {!mostrarFilaPedidos && (
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
                        {Array.isArray(pedido.itens) ? (
                          pedido.itens.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))
                        ) : (
                          <li>{String(pedido.itens)}</li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-2 mb-2">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs font-medium text-green-700 uppercase mb-1">Subtotal do Produto</p>
                        <p className="text-lg font-bold text-green-900">{formatarValor(pedido.valor_pedido)}</p>
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
          )}

          {/* Fila de Pedidos - Pedidos do Cliente (Tabela Separada) */}
          {mostrarFilaPedidos && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">⏳</span>
                  Fila de Pedidos - Clientes
                </h2>
                <span className="text-sm font-medium text-gray-500">
                  {filaPedidos.length} pedido(s) | {filaPedidos.filter(p => p.status === 'pendente').length} novos | {filaPedidos.filter(p => p.status === 'em_preparacao').length} em preparação | {filaPedidos.filter(p => p.status === 'em_rota').length} em rota
                </span>
              </div>

              {/* Pedidos Pendentes (Novos) */}
              <h3 className="text-md font-bold text-red-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🚨</span>
                Novos Pedidos (Pendentes)
                <span className="text-sm font-normal text-gray-500">
                  ({filaPedidos.filter(p => p.status === 'pendente').length})
                </span>
              </h3>

              {filaPedidos.filter(p => p.status === 'pendente').length > 0 && (
                <div className="space-y-3 mb-6">
                  {filaPedidos
                    .filter(p => p.status === 'pendente')
                    .map((pedido) => (
                    <div
                      key={pedido.id}
                      className="border-2 border-red-300 bg-red-50 rounded-lg p-4 shadow-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            👤 {pedido.cliente}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800 uppercase animate-pulse">
                          Aguardando Aceite
                        </span>
                      </div>

                      {/* Dados de Entrega */}
                      <div className="space-y-3 mb-4">
                        {/* Itens do Pedido */}
                        <div className="bg-white rounded p-3 border border-red-100">
                          <p className="text-xs font-bold text-red-700 mb-2">📦 ITENS DO PEDIDO:</p>
                          <ul className="space-y-1">
                            {Array.isArray(pedido.itens) ? (
                              pedido.itens.map((item, index) => (
                                <li key={index} className="text-sm text-gray-800 font-medium flex items-start gap-2">
                                  <span className="text-red-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-800 font-medium">{pedido.itens}</li>
                            )}
                          </ul>
                        </div>

                        {/* Telefone */}
                        {pedido.telefone_cliente && (
                          <div className="bg-white rounded p-2 border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-1">📞 Telefone/WhatsApp:</p>
                            <p className="text-sm text-gray-800">{pedido.telefone_cliente}</p>
                          </div>
                        )}

                        {/* Endereço */}
                        {pedido.endereco && (
                          <div className="bg-white rounded p-2 border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-1">📍 Endereço de Entrega:</p>
                            <p className="text-sm text-gray-800">{pedido.endereco}</p>
                          </div>
                        )}

                        {/* Forma de Pagamento */}
                        {pedido.forma_pagamento && (
                          <div className="bg-white rounded p-2 border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-1">💳 Forma de Pagamento:</p>
                            <p className="text-sm text-gray-800">
                              {pedido.forma_pagamento === 'pix' && '💠 PIX'}
                              {pedido.forma_pagamento === 'dinheiro' && '💵 Dinheiro'}
                              {pedido.forma_pagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                              {pedido.forma_pagamento === 'cartao_debito' && '💳 Cartão de Débito'}
                            </p>
                          </div>
                        )}

                        {/* Observações */}
                        {pedido.observacoes && (
                          <div className="bg-white rounded p-2 border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-1">📝 Observações:</p>
                            <p className="text-sm text-gray-800 font-medium bg-yellow-50">{pedido.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => aceitarPedidoFila(pedido)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                      >
                        ✅ ACEITAR PEDIDO E INICIAR PREPARAÇÃO
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pedidos em Preparação */}
              <h3 className="text-md font-bold text-orange-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🔥</span>
                Em Preparação
                <span className="text-sm font-normal text-gray-500">
                  ({filaPedidos.filter(p => p.status === 'em_preparacao').length})
                </span>
              </h3>

              {filaPedidos.filter(p => p.status === 'em_preparacao').length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <span className="text-4xl">📦</span>
                  <p className="text-gray-500 mt-2 text-sm">
                    Nenhum pedido em preparação
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filaPedidos
                    .filter(p => p.status === 'em_preparacao')
                    .map((pedido) => (
                    <div
                      key={pedido.id}
                      className="border border-orange-200 bg-orange-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            👤 {pedido.cliente}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                          🔥 Em Preparação
                        </span>
                      </div>

                      {/* Dados de Entrega */}
                      <div className="space-y-3">
                        {/* Itens do Pedido */}
                        <div className="bg-white rounded p-3 border border-orange-100">
                          <p className="text-xs font-bold text-orange-700 mb-2">📦 SEUS ITENS:</p>
                          <ul className="space-y-1">
                            {Array.isArray(pedido.itens) ? (
                              pedido.itens.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-orange-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-700">{pedido.itens}</li>
                            )}
                          </ul>
                        </div>

                        {/* Telefone */}
                        {pedido.telefone_cliente && (
                          <div className="bg-white rounded p-2 border border-orange-100">
                            <p className="text-xs font-medium text-orange-700 mb-1">📞 Telefone/WhatsApp:</p>
                            <p className="text-sm text-gray-800">{pedido.telefone_cliente}</p>
                          </div>
                        )}

                        {/* Endereço */}
                        {pedido.endereco && (
                          <div className="bg-white rounded p-2 border border-orange-100">
                            <p className="text-xs font-medium text-orange-700 mb-1">📍 Endereço de Entrega:</p>
                            <p className="text-sm text-gray-800">{pedido.endereco}</p>
                          </div>
                        )}

                        {/* Forma de Pagamento */}
                        {pedido.forma_pagamento && (
                          <div className="bg-white rounded p-2 border border-orange-100">
                            <p className="text-xs font-medium text-orange-700 mb-1">💳 Forma de Pagamento:</p>
                            <p className="text-sm text-gray-800">
                              {pedido.forma_pagamento === 'pix' && '💠 PIX'}
                              {pedido.forma_pagamento === 'dinheiro' && '💵 Dinheiro'}
                              {pedido.forma_pagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                              {pedido.forma_pagamento === 'cartao_debito' && '💳 Cartão de Débito'}
                            </p>
                          </div>
                        )}

                        {/* Observações */}
                        {pedido.observacoes && (
                          <div className="bg-white rounded p-2 border border-orange-100">
                            <p className="text-xs font-medium text-orange-700 mb-1">📝 Observações:</p>
                            <p className="text-sm text-gray-800">{pedido.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Atualizar Status:</label>
                        <select
                          value={pedido.status}
                          onChange={(e) => atualizarStatusFila(pedido.id, e.target.value)}
                          className="w-full bg-white border border-orange-300 text-orange-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 font-bold cursor-pointer hover:bg-orange-50 transition-colors"
                        >
                          <option value="em_preparacao">🔥 Em Preparação</option>
                          <option value="em_rota">🚛 Em Rota de Entrega</option>
                          <option value="entregue">✅ Entregue</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pedidos em Rota */}
              <h3 className="text-md font-bold text-purple-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🚛</span>
                Em Rota de Entrega
                <span className="text-sm font-normal text-gray-500">
                  ({filaPedidos.filter(p => p.status === 'em_rota').length})
                </span>
              </h3>

              {filaPedidos.filter(p => p.status === 'em_rota').length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <span className="text-4xl">📦</span>
                  <p className="text-gray-500 mt-2 text-sm">
                    Nenhum pedido em rota
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filaPedidos
                    .filter(p => p.status === 'em_rota')
                    .map((pedido) => (
                    <div
                      key={pedido.id}
                      className="border border-purple-200 bg-purple-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">
                            👤 {pedido.cliente}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                          🚛 Em Rota
                        </span>
                      </div>

                      {/* Dados de Entrega */}
                      <div className="space-y-3">
                        {/* Itens do Pedido */}
                        <div className="bg-white rounded p-3 border border-purple-100">
                          <p className="text-xs font-bold text-purple-700 mb-2">📦 SEUS ITENS:</p>
                          <ul className="space-y-1">
                            {Array.isArray(pedido.itens) ? (
                              pedido.itens.map((item, index) => (
                                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span>{item}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-700">{pedido.itens}</li>
                            )}
                          </ul>
                        </div>

                        {/* Telefone */}
                        {pedido.telefone_cliente && (
                          <div className="bg-white rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📞 Telefone/WhatsApp:</p>
                            <p className="text-sm text-gray-800">{pedido.telefone_cliente}</p>
                          </div>
                        )}

                        {/* Endereço */}
                        {pedido.endereco && (
                          <div className="bg-white rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📍 Endereço de Entrega:</p>
                            <p className="text-sm text-gray-800">{pedido.endereco}</p>
                          </div>
                        )}

                        {/* Forma de Pagamento */}
                        {pedido.forma_pagamento && (
                          <div className="bg-white rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">💳 Forma de Pagamento:</p>
                            <p className="text-sm text-gray-800">
                              {pedido.forma_pagamento === 'pix' && '💠 PIX'}
                              {pedido.forma_pagamento === 'dinheiro' && '💵 Dinheiro'}
                              {pedido.forma_pagamento === 'cartao_credito' && '💳 Cartão de Crédito'}
                              {pedido.forma_pagamento === 'cartao_debito' && '💳 Cartão de Débito'}
                            </p>
                          </div>
                        )}

                        {/* Observações */}
                        {pedido.observacoes && (
                          <div className="bg-white rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📝 Observações:</p>
                            <p className="text-sm text-gray-800">{pedido.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Atualizar Status:</label>
                        <select
                          value={pedido.status}
                          onChange={(e) => atualizarStatusFila(pedido.id, e.target.value)}
                          className="w-full bg-white border border-purple-300 text-purple-800 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 font-bold cursor-pointer hover:bg-purple-50 transition-colors"
                        >
                          <option value="em_rota">🚛 Em Rota de Entrega</option>
                          <option value="entregue">✅ Entregue</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Histórico de Pagamentos */}
        <section className="lg:ml-64 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                💰 Histórico de Pagamentos
              </h2>
              <button
                onClick={carregarPagamentos}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                🔄 Atualizar
              </button>
            </div>

            {carregandoPagamentos ? (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-2">🔄</div>
                <p className="text-gray-500">Carregando pagamentos...</p>
              </div>
            ) : pagamentos.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <span className="text-5xl">📭</span>
                <p className="text-gray-500 mt-4">Nenhum pagamento registrado</p>
                <p className="text-gray-400 text-sm mt-2">
                  Os pagamentos realizados aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left text-xs font-bold text-purple-700 uppercase py-3 px-4">Data</th>
                      <th className="text-left text-xs font-bold text-purple-700 uppercase py-3 px-4">Entregador</th>
                      <th className="text-left text-xs font-bold text-purple-700 uppercase py-3 px-4">Forma</th>
                      <th className="text-left text-xs font-bold text-purple-700 uppercase py-3 px-4">Descrição</th>
                      <th className="text-right text-xs font-bold text-purple-700 uppercase py-3 px-4">Valor</th>
                      <th className="text-center text-xs font-bold text-purple-700 uppercase py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((pagamento) => (
                      <tr key={pagamento.id} className="border-t border-gray-100 hover:bg-purple-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {new Date(pagamento.criado_em).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">{pagamento.entregador?.nome}</p>
                            <p className="text-xs text-gray-500">{pagamento.entregador?.telefone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {pagamento.forma_pagamento === 'pix' && '💠 PIX'}
                          {pagamento.forma_pagamento === 'dinheiro' && '💵 Dinheiro'}
                          {pagamento.forma_pagamento === 'transferencia' && '🏦 Transferência'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {pagamento.descricao || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-purple-600 text-right">
                          {parseFloat(pagamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {pagamento.status === 'realizado' && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              ✅ Realizado
                            </span>
                          )}
                          {pagamento.status === 'cancelado' && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                              ❌ Cancelado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modal de Pagamento */}
        <ModalPagamentoEntregador
          aberto={modalPagamentoAberto}
          onClose={() => setModalPagamentoAberto(false)}
          onPagamentoRealizado={() => {
            carregarPagamentos();
          }}
        />
      </div>
      </>
      )}
    </>
  );
}
