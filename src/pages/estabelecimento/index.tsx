import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/services/api';
import { createClient } from '@supabase/supabase-js';
import ModalPagamentoEntregador from '@/components/modalPagamentoEntregador/ModalPagamentoEntregador';
import '@/app/globals.css';
import '../login-estabelecimento/login-animations.css';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Pedido {
  id: string;
  cliente: string;
  endereco: string;
  itens: string[] | string;
  status: 'pendente' | 'em_preparacao' | 'em_rota' | 'entregue' | 'cancelado' | 'aceito' | 'em_transito' | 'no_local';
  entregador_id?: string | null;
  entregadorId?: string;
  entregadorNome?: string;
  entregadorTelefone?: string;
  estabelecimento_nome?: string | null;
  estabelecimento_endereco?: string | null;
  estabelecimento_id?: string | null;
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
  valor_pedido?: number | null;
  valor_entregador?: number | null;
  comprovante_pix?: string;
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
  const [filtroEntregador, setFiltroEntregador] = useState('');
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
  const [carregando, setCarregando] = useState(true);
  const [mostrarCadastroProduto, setMostrarCadastroProduto] = useState(false);
  const [mostrarChavesPix, setMostrarChavesPix] = useState(false);
  const [mostrarComprovante, setMostrarComprovante] = useState(false);
  const [comprovanteSelecionado, setComprovanteSelecionado] = useState<string | null>(null);
  const [pedidoComprovante, setPedidoComprovante] = useState<any>(null);
  const [mostrarRetiradas, setMostrarRetiradas] = useState(false);
  const [solicitacoesRetirada, setSolicitacoesRetirada] = useState<any[]>([]);
  const [carregandoRetiradas, setCarregandoRetiradas] = useState(false);
  const [retiradaParaPagar, setRetiradaParaPagar] = useState<any>(null);

  // Estados para produtos
  const [produtos, setProdutos] = useState<any[]>([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [precoFormatado, setPrecoFormatado] = useState('');
  const [categoria, setCategoria] = useState('');
  const [disponivel, setDisponivel] = useState(true);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [loadingProduto, setLoadingProduto] = useState(false);
  const [filtroProduto, setFiltroProduto] = useState('');
  const [produtoEditando, setProdutoEditando] = useState<any | null>(null);
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [abaHistorico, setAbaHistorico] = useState<'pagamentos' | 'pedidos'>('pagamentos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [historicoPedidos, setHistoricoPedidos] = useState<Pedido[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [devolucoesPendentes, setDevolucoesPendentes] = useState<Pedido[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para chaves PIX
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('cpf');
  const [nomeTitularPix, setNomeTitularPix] = useState('');
  const [bancoPix, setBancoPix] = useState('');
  const [chavesPixSalvas, setChavesPixSalvas] = useState<any[]>([]);
  const [loadingChavePix, setLoadingChavePix] = useState(false);

  // ============ FUNÇÕES DE NAVEGAÇÃO DO MENU ============
  const handleMenuClick = (secao: 'pedidos' | 'fila' | 'produtos' | 'pix' | 'retiradas') => {
    setMostrarFilaPedidos(secao === 'fila');
    setMostrarCadastroProduto(secao === 'produtos');
    setMostrarChavesPix(secao === 'pix');
    setMostrarRetiradas(secao === 'retiradas');
  };

  // ============ FUNÇÕES DE PRODUTOS ============
  
  // Carregar produtos
  const carregarProdutos = async () => {
    const user = localStorage.getItem('estabelecimento_user');
    if (!user) return;
    const userData = JSON.parse(user);
    const estabelecimentoId = userData.id;
    try {
      const { data, error } = await supabase.from('produtos').select('*').eq('estabelecimento_id', estabelecimentoId).order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProdutos(data);
    } catch (err) { console.error('Erro ao carregar produtos:', err); }
  };

  // Formatar preço
  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setPrecoFormatado(`R$ ${valor}`);
    setPreco(valor.replace(',', '.'));
  };

  // Upload imagem
  const uploadImagemProduto = async (file: File): Promise<string | null> => {
    try {
      const user = localStorage.getItem('estabelecimento_user');
      if (!user) return null;
      const userData = JSON.parse(user);
      const fileName = `${userData.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('produtos-imagens').upload(fileName, file);
      if (error) throw error;
      const { data } = await supabase.storage.from('produtos-imagens').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) { console.error('Erro no upload:', err); return null; }
  };

  // Cadastrar produto
  const handleCadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProduto || !preco) { alert('Preencha nome e preço!'); return; }
    setLoadingProduto(true);
    try {
      const user = localStorage.getItem('estabelecimento_user');
      if (!user) return;
      const userData = JSON.parse(user);
      let imagemUrl = null;
      if (imagemFile) imagemUrl = await uploadImagemProduto(imagemFile);
      const { error } = await supabase.from('produtos').insert([{ nome: nomeProduto, descricao: descricao || null, preco: parseFloat(preco), categoria: categoria || null, disponivel, imagem_url: imagemUrl, estabelecimento_id: userData.id }]);
      if (error) throw error;
      alert('✅ Produto cadastrado!');
      setNomeProduto(''); setDescricao(''); setPreco(''); setPrecoFormatado(''); setCategoria(''); setDisponivel(true); setImagemFile(null); setImagemPreview(null);
      carregarProdutos();
    } catch (err) { alert('Erro: ' + (err as Error).message); }
    finally { setLoadingProduto(false); }
  };

  // Atualizar produto
  const handleAtualizarProduto = async (id: string, atualizacoes: any) => {
    try { const { error } = await supabase.from('produtos').update(atualizacoes).eq('id', id); if (error) throw error; carregarProdutos(); }
    catch (err) { alert('Erro ao atualizar'); }
  };

  // Abrir modal de edição
  const handleAbrirEdicao = (produto: any) => {
    setProdutoEditando({ ...produto });
    setMostrarModalEdicao(true);
  };

  // Salvar edição
  const handleSalvarEdicao = async () => {
    if (!produtoEditando) return;
    try {
      const { error } = await supabase.from('produtos').update({
        nome: produtoEditando.nome,
        descricao: produtoEditando.descricao,
        preco: produtoEditando.preco,
        categoria: produtoEditando.categoria,
      }).eq('id', produtoEditando.id);
      if (error) throw error;
      alert('✅ Produto atualizado!');
      setMostrarModalEdicao(false);
      setProdutoEditando(null);
      carregarProdutos();
    } catch (err) {
      alert('Erro: ' + (err as Error).message);
    }
  };

  // Excluir produto
  const handleExcluirProduto = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    try { const { error } = await supabase.from('produtos').delete().eq('id', id); if (error) throw error; alert('✅ Produto excluído!'); carregarProdutos(); }
    catch (err) { alert('Erro ao excluir'); }
  };

  // Filtro produtos
  const produtosFiltrados = produtos.filter(p =>
    p.nome?.toLowerCase().includes(filtroProduto?.toLowerCase() || '') ||
    p.categoria?.toLowerCase().includes(filtroProduto?.toLowerCase() || '')
  );

  // ============ FUNÇÕES DE CHAVES PIX ============

  // Carregar chaves PIX salvas
  const carregarChavesPix = async () => {
    const user = localStorage.getItem('estabelecimento_user');
    if (!user) return;
    const userData = JSON.parse(user);
    const estabelecimentoId = userData.id;
    try {
      const { data, error } = await supabase
        .from('chaves_pix')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      if (data) setChavesPixSalvas(data);
    } catch (err) { console.error('Erro ao carregar chaves PIX:', err); }
  };

  // Cadastrar chave PIX
  const handleCadastrarChavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chavePix || !nomeTitularPix || !bancoPix) {
      alert('Preencha todos os campos!');
      return;
    }
    setLoadingChavePix(true);
    try {
      const user = localStorage.getItem('estabelecimento_user');
      if (!user) return;
      const userData = JSON.parse(user);
      const { error } = await supabase.from('chaves_pix').insert([{
        chave: chavePix,
        tipo: tipoChavePix,
        titular: nomeTitularPix,
        banco: bancoPix,
        estabelecimento_id: userData.id,
      }]);
      if (error) throw error;
      alert('✅ Chave PIX cadastrada com sucesso!');
      setChavePix('');
      setNomeTitularPix('');
      setBancoPix('');
      setTipoChavePix('cpf');
      carregarChavesPix();
    } catch (err) {
      alert('Erro ao cadastrar chave PIX: ' + (err as Error).message);
    } finally {
      setLoadingChavePix(false);
    }
  };

  // Excluir chave PIX
  const handleExcluirChavePix = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta chave PIX?')) return;
    try {
      const { error } = await supabase.from('chaves_pix').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Chave PIX excluída com sucesso!');
      carregarChavesPix();
    } catch (err) {
      alert('Erro ao excluir chave PIX');
    }
  };

  // ============ FUNÇÕES DE RETIRADAS ============

  // Carregar solicitações de retirada
  const carregarRetiradas = async () => {
    setCarregandoRetiradas(true);
    try {
      if (!estabelecimentoId) {
        console.log('⚠️ Sem estabelecimento_id para carregar retiradas');
        setSolicitacoesRetirada([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('solicitacoes_retirada')
        .select(`
          *,
          entregador:entregadores(id, nome, telefone)
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setSolicitacoesRetirada(data || []);
    } catch (err) {
      console.error('Erro ao carregar retiradas:', err);
    } finally {
      setCarregandoRetiradas(false);
    }
  };

  // Aprovar retirada (Abre modal de pagamento)
  const handleAprovarRetirada = (solicitacao: any) => {
    setRetiradaParaPagar({
      solicitacao_id: solicitacao.id,
      entregador_id: solicitacao.entregador_id,
      valor: solicitacao.valor,
      descricao: `Retirada de Saldo - ${solicitacao.entregador?.nome || 'Entregador'}`
    });
    setModalPagamentoAberto(true);
  };

  // Cancelar retirada
  const handleCancelarRetirada = async (solicitacao: any) => {
    if (!confirm('Tem certeza que deseja cancelar esta retirada?')) return;
    try {
      const { error } = await supabase
        .from('solicitacoes_retirada')
        .update({ status: 'cancelada' })
        .eq('id', solicitacao.id);
      if (error) throw error;
      alert('❌ Retirada cancelada!');
      carregarRetiradas();
    } catch (err) {
      alert('Erro ao cancelar retirada');
    }
  };

  // Verificar se usuário está logado
  useEffect(() => {
    // Verificação apenas no lado do cliente
    if (typeof window === 'undefined') return;

    console.log('🔐 Verificando autenticação...');
    
    const user = localStorage.getItem('estabelecimento_user');
    console.log('📦 Conteúdo do localStorage:', user);

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
      return;
    }

    setCarregando(false);
  }, [router]);

  // Carregar produtos quando mostrarCadastroProduto for true
  useEffect(() => {
    if (mostrarCadastroProduto && estabelecimentoId) {
      carregarProdutos();
    }
  }, [mostrarCadastroProduto, estabelecimentoId]);

  // Carregar seção ativa (unificado para evitar conflitos de scroll)
  useEffect(() => {
    if (!estabelecimentoId) return;
    
    // Scroll automático para a seção ativa
    setTimeout(() => {
      let elementoId = null;
      
      if (mostrarCadastroProduto) {
        carregarProdutos();
        elementoId = 'secao-produtos';
      } else if (mostrarChavesPix) {
        carregarChavesPix();
        elementoId = 'secao-chaves-pix';
      } else if (mostrarRetiradas) {
        carregarRetiradas();
        elementoId = 'secao-retiradas';
      }
      
      if (elementoId) {
        const elemento = document.getElementById(elementoId);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
          elemento.focus();
        }
      }
    }, 100);
  }, [mostrarCadastroProduto, mostrarChavesPix, mostrarRetiradas, estabelecimentoId]);

  // Timeout de inatividade - 5 minutos
  useEffect(() => {
    if (typeof window === 'undefined' || !usuarioLogado) return;

    const TEMPO_INATIVIDADE_MS = 5 * 60 * 1000; // 5 minutos
    let timeoutId: NodeJS.Timeout;

    const resetarTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('⏰ Tempo de inatividade atingido (5 minutos), fazendo logout...');
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
  }, [router, usuarioLogado]);

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
    carregarHistoricoPedidos();
    carregarSolicitacoesDevolucao();

    // Atualizar lista periodicamente
    const intervalo = setInterval(() => {
      carregarPedidos();
      carregarFilaPedidos();
      carregarSolicitacoesDevolucao();
    }, 5000);
    return () => {
      clearInterval(intervalo);
    };
  }, [estabelecimentoId]);

  const carregarSolicitacoesDevolucao = async () => {
    if (!estabelecimentoId) return;
    try {
      const { data } = await api.listarSolicitacoesDevolucao(estabelecimentoId);
      setDevolucoesPendentes(data || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações de devolução:', err);
    }
  };

  const carregarPedidos = async () => {
    try {
      if (!estabelecimentoId) {
        console.log('⚠️ Sem estabelecimento_id para carregar pedidos');
        setPedidos([]);
        return;
      }

      const resultado = await api.listarTodosPedidos();
      const data = resultado.data || [];

      if (Array.isArray(data)) {
        // Filtrar apenas pedidos que:
        // 1. Foram criados manualmente pelo estabelecimento (sem telefone_cliente)
        // 2. Possuem entregador vinculado (entregador_id)
        // 3. Pertencem ao estabelecimento logado
        const pedidosFiltrados = data.filter(pedido => {
          return !pedido.telefone_cliente && 
                 pedido.entregador_id && 
                 pedido.estabelecimento_id === estabelecimentoId;
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

  const carregarHistoricoPedidos = async () => {
    if (!estabelecimentoId) return;
    setCarregandoHistorico(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          entregador:entregador_id (
            nome,
            telefone
          )
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const normalizados = (data || []).map(p => ({
        ...p,
        entregadorNome: p.entregador?.nome,
        entregadorTelefone: p.entregador?.telefone,
        createdAt: new Date(p.created_at)
      }));
      
      setHistoricoPedidos(normalizados);
    } catch (error) {
      console.error('Erro ao carregar histórico de pedidos:', error);
    } finally {
      setCarregandoHistorico(false);
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

  // Cancelar pedido na fila
  const handleCancelarPedidoFila = async (pedido: FilaPedido) => {
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja CANCELAR este pedido?\n\nCliente: ${pedido.cliente}\n\nEste pedido irá para o histórico como CANCELADO e o cliente será notificado.\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fila_pedidos')
        .update({ status: 'cancelado' })
        .eq('id', pedido.id);

      if (error) {
        console.error('Erro ao cancelar pedido:', error);
        alert('Erro ao cancelar pedido: ' + error.message);
        return;
      }

      alert('❌ Pedido cancelado com sucesso!\n\nO pedido foi movido para o histórico como CANCELADO.');
      carregarFilaPedidos();
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      alert('Erro inesperado ao cancelar pedido');
    }
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    // Filtro por Data
    if (filtroDataInicio) {
      const dInicio = new Date(filtroDataInicio + 'T00:00:00');
      if (pedido.createdAt < dInicio) return false;
    }
    if (filtroDataFim) {
      const dFim = new Date(filtroDataFim + 'T23:59:59');
      if (pedido.createdAt > dFim) return false;
    }
    
    // Filtro por Entregador
    if (filtroEntregador && (!pedido.entregadorNome || !pedido.entregadorNome.toLowerCase().includes(filtroEntregador.toLowerCase()))) {
      return false;
    }

    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'pendentes') return pedido.status === 'pendente' || pedido.status === 'aceito';
    if (filtroAtivo === 'em_entrega') return pedido.status === 'em_transito' || pedido.status === 'no_local';
    if (filtroAtivo === 'entregues') return pedido.status === 'entregue';
    return true;
  });

  const filtrarParaContagem = (p: Pedido) => {
    // Data
    if (filtroDataInicio) {
      const dInicio = new Date(filtroDataInicio + 'T00:00:00');
      if (p.createdAt < dInicio) return false;
    }
    if (filtroDataFim) {
      const dFim = new Date(filtroDataFim + 'T23:59:59');
      if (p.createdAt > dFim) return false;
    }
    // Entregador
    if (filtroEntregador && (!p.entregadorNome || !p.entregadorNome.toLowerCase().includes(filtroEntregador.toLowerCase()))) {
      return false;
    }
    return true;
  };

  const contagemPedidos = {
    todos: pedidos.filter(p => filtrarParaContagem(p)).length,
    pendentes: pedidos.filter(p => filtrarParaContagem(p) && (p.status === 'pendente' || p.status === 'aceito')).length,
    em_entrega: pedidos.filter(p => filtrarParaContagem(p) && (p.status === 'em_transito' || p.status === 'no_local')).length,
    entregues: pedidos.filter(p => filtrarParaContagem(p) && p.status === 'entregue').length,
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
        formaPagamento,
        estabelecimentoId || undefined
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
          entregador:entregadores(nome, telefone),
          retirada:solicitacoes_retirada(
            pedido:pedidos(itens)
          )
        `)
        .eq('estabelecimento_id', estabelecimentoId)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }
      setPagamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setCarregandoPagamentos(false);
    }
  };

  return (
    <div>
      <Head>
        <title>Painel do Estabelecimento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
      </Head>

      {carregando || !usuarioLogado ? (
        <div className="login-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="login-logo" style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem' }}>
              <span className="logo-emoji" style={{ fontSize: '2rem' }}>🏪</span>
            </div>
            <p className="text-white font-medium">Verificando autenticação...</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
          {/* Desktop Sidebar */}
          <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-40 hidden lg:block overflow-y-auto">
          <div className="p-5">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">🏪</span>
                Menu
              </h2>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => { setMostrarFilaPedidos(false); setMostrarCadastroProduto(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
                className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left ${
                  !mostrarFilaPedidos && !mostrarCadastroProduto && !mostrarChavesPix && !mostrarRetiradas
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-2xl">📋</span>
                <span>Pedidos</span>
              </button>
              <button
                onClick={() => { setMostrarFilaPedidos(true); setMostrarCadastroProduto(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
                className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left relative ${
                  mostrarFilaPedidos && !mostrarCadastroProduto
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-2xl">⏳</span>
                <span>Fila de Pedidos</span>
                {filaPedidos.filter(p => p.status === 'pendente').length > 0 && (
                  <span className="absolute right-3 bg-red-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {filaPedidos.filter(p => p.status === 'pendente').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { handleMenuClick('produtos'); setMostrarFilaPedidos(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
                className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left ${
                  mostrarCadastroProduto
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-2xl">🛍️</span>
                <span>Produtos</span>
              </button>
              <button
                onClick={() => { handleMenuClick('pix'); setMostrarFilaPedidos(false); setMostrarCadastroProduto(false); setMostrarRetiradas(false); }}
                className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left ${
                  mostrarChavesPix
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-2xl">💠</span>
                <span>Cadastrar Chave PIX</span>
              </button>
              <button
                onClick={() => { handleMenuClick('retiradas'); setMostrarFilaPedidos(false); setMostrarCadastroProduto(false); setMostrarChavesPix(false); }}
                className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left ${
                  mostrarRetiradas
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-2xl">🏦</span>
                <span>Retiradas</span>
              </button>
              <button
                onClick={() => {
                  carregarPagamentos();
                  setModalPagamentoAberto(true);
                }}
                className="w-full font-semibold py-3.5 px-4 rounded-xl transition-all flex items-center gap-3 text-left bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <span className="text-2xl">💰</span>
                <span>Pagamentos</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Header */}
        <header className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 shadow-xl lg:ml-72 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto">
            {/* Alerta de Devoluções de Urgência */}
            {devolucoesPendentes.length > 0 && (
              <div 
                onClick={() => router.push('/estabelecimento/devolucoes')}
                className="mb-4 bg-white text-red-600 p-3 rounded-xl flex items-center justify-between cursor-pointer animate-pulse shadow-lg transition-colors border-2 border-red-500"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚩</span>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tighter">🚨 URGÊNCIA: {devolucoesPendentes.length} DEVOLUÇÃO(ÕES) SOLICITADA(S)</p>
                    <p className="text-[10px] font-bold opacity-90">Entregadores não localizaram clientes e aguardam autorização de retorno.</p>
                  </div>
                </div>
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">Ver Agora</div>
              </div>
            )}
            <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🏪 {usuarioLogado?.nome_estabelecimento || 'Painel do Estabelecimento'}</h1>
              {usuarioLogado && (
                <p className="text-xs text-red-100 mt-0.5">📧 {usuarioLogado.email}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  statusConexao === 'online' ? 'bg-green-400' : 'bg-red-400'
                } animate-pulse`}></span>
                <span className="text-xs font-medium">
                  {statusConexao === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white hover:bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 border-t border-gray-200 lg:hidden flex justify-around p-2 pb-safe">
          <button
            onClick={() => { handleMenuClick('pedidos'); setMostrarFilaPedidos(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
            className={`flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all ${
              !mostrarFilaPedidos && !mostrarCadastroProduto && !mostrarChavesPix && !mostrarRetiradas ? 'text-red-600 bg-red-50' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-0.5">📋</span>
            <span className="text-xs font-medium">Pedidos</span>
          </button>

          <button
            onClick={() => { handleMenuClick('fila'); setMostrarCadastroProduto(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
            className={`flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all relative ${
              mostrarFilaPedidos ? 'text-red-600 bg-red-50' : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <span className="text-2xl mb-0.5">⏳</span>
              {filaPedidos.filter(p => p.status === 'pendente').length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {filaPedidos.filter(p => p.status === 'pendente').length}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Fila</span>
          </button>

          <button
            onClick={() => { handleMenuClick('produtos'); setMostrarFilaPedidos(false); setMostrarChavesPix(false); setMostrarRetiradas(false); }}
            className={`flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all ${
              mostrarCadastroProduto ? 'text-red-600 bg-red-50' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-0.5">🛍️</span>
            <span className="text-xs font-medium">Produtos</span>
          </button>

          <button
            onClick={() => { handleMenuClick('pix'); setMostrarFilaPedidos(false); setMostrarCadastroProduto(false); setMostrarRetiradas(false); }}
            className={`flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all ${
              mostrarChavesPix ? 'text-red-600 bg-red-50' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-0.5">💠</span>
            <span className="text-xs font-medium">PIX</span>
          </button>

          <button
            onClick={() => { handleMenuClick('retiradas'); setMostrarFilaPedidos(false); setMostrarCadastroProduto(false); setMostrarChavesPix(false); }}
            className={`flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all ${
              mostrarRetiradas ? 'text-red-600 bg-red-50' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl mb-0.5">🏦</span>
            <span className="text-xs font-medium">Retiradas</span>
          </button>

          <button
            onClick={() => {
              carregarPagamentos();
              setModalPagamentoAberto(true);
            }}
            className="flex flex-col items-center p-2.5 rounded-xl flex-1 min-w-[60px] transition-all text-gray-500 hover:bg-gray-50"
          >
            <span className="text-2xl mb-0.5">💰</span>
            <span className="text-xs font-medium">Pagar</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="p-4 lg:p-6 lg:ml-72 mb-24 lg:mb-8">
          <div className="max-w-7xl mx-auto">
          {/* Cadastro de Produtos */}
          {mostrarCadastroProduto && (
            <section id="secao-produtos" tabIndex={-1} className="bg-white rounded-lg shadow-lg p-6 mb-6 outline-none">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  Gerenciar Produtos
                </h2>
                <button
                  onClick={() => setMostrarCadastroProduto(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                >
                  ✕ Fechar
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleCadastrarProduto} className="space-y-4 mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Novo Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🍔</span>
                      <input type="text" value={nomeProduto} onChange={(e) => setNomeProduto(e.target.value)} placeholder="Ex: Pizza Calabresa"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">💰 Preço *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">💰</span>
                      <input type="text" value={precoFormatado} onChange={handlePrecoChange} placeholder="R$ 0,00"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all text-xl font-bold" required />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <div className="relative">
                    <span className="absolute left-3 top-4 text-gray-400 text-lg">📝</span>
                    <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ingredientes, detalhes..." rows={2}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Categoria</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🏷️</span>
                      <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Pizzas"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="disponivel" checked={disponivel} onChange={(e) => setDisponivel(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
                    <label htmlFor="disponivel" className="text-sm font-medium text-gray-700">Disponível</label>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={loadingProduto} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50">
                      {loadingProduto ? '⏳...' : '✅ Cadastrar'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📷 Imagem</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {imagemPreview ? (
                      <div className="relative inline-block">
                        <img src={imagemPreview} alt="Preview" className="max-h-32 rounded-lg shadow-md" />
                        <button type="button" onClick={() => { setImagemPreview(null); setImagemFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg">✕</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <span className="text-3xl">📷</span>
                        <p className="text-sm text-gray-600 mt-1">Clique para adicionar imagem</p>
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImagemFile(file); setImagemPreview(URL.createObjectURL(file)); } }} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </form>

              {/* Lista de Produtos */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">Produtos Cadastrados ({produtosFiltrados.length})</h3>
                  <div className="relative w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                    <input type="text" value={filtroProduto} onChange={(e) => setFiltroProduto(e.target.value)} placeholder="Buscar produto..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all text-sm" />
                  </div>
                </div>

                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <span className="text-5xl">📦</span>
                    <p className="text-gray-500 mt-2">Nenhum produto cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {produtosFiltrados.map((produto) => (
                      <div key={produto.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center gap-4">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-3xl text-gray-300">📦</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-800 truncate">{produto.nome}</h4>
                              {produto.disponivel ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">Ativo</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-bold">Pausado</span>
                              )}
                            </div>
                            <p className="text-xl font-black text-red-600">{produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            {produto.categoria ? (
                              <span className="text-xs text-gray-500">🏷️ {produto.categoria}</span>
                            ) : (
                              <span className="text-xs text-orange-500 font-medium">⚠️ Sem categoria</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleAbrirEdicao(produto)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all">✏️ Editar</button>
                            <button onClick={() => handleAtualizarProduto(produto.id, { disponivel: !produto.disponivel })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${produto.disponivel ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                              {produto.disponivel ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={() => handleExcluirProduto(produto.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-all">🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Modal de Edição de Produto */}
          {mostrarModalEdicao && produtoEditando && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">✏️</span>
                    Editar Produto
                  </h3>
                  <button onClick={() => setMostrarModalEdicao(false)} className="text-gray-500 hover:text-gray-700 text-lg">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={produtoEditando.nome}
                      onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={produtoEditando.descricao || ''}
                      onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={produtoEditando.preco}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, preco: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Categoria *</label>
                      <input
                        type="text"
                        value={produtoEditando.categoria || ''}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
                        placeholder="Ex: Pizzas"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setMostrarModalEdicao(false)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarEdicao}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      ✅ Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gerenciamento de Chaves PIX */}
          {mostrarChavesPix && (
            <section id="secao-chaves-pix" tabIndex={-1} className="bg-white rounded-lg shadow-lg p-6 mb-6 outline-none">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💠</span>
                  Gerenciar Chaves PIX
                </h2>
                <button
                  onClick={() => setMostrarChavesPix(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                >
                  ✕ Fechar
                </button>
              </div>

              {/* Formulário de Cadastro de Chave PIX */}
              <form onSubmit={handleCadastrarChavePix} className="space-y-4 mb-6">
                <h3 className="font-bold text-gray-700 mb-2">Nova Chave PIX</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave *</label>
                    <select
                      value={tipoChavePix}
                      onChange={(e) => setTipoChavePix(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                      required
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX *</label>
                    <input
                      type="text"
                      value={chavePix}
                      onChange={(e) => setChavePix(e.target.value)}
                      placeholder="Digite a chave PIX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Titular *</label>
                  <input
                    type="text"
                    value={nomeTitularPix}
                    onChange={(e) => setNomeTitularPix(e.target.value)}
                    placeholder="Nome completo do titular da conta"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                  <input
                    type="text"
                    value={bancoPix}
                    onChange={(e) => setBancoPix(e.target.value)}
                    placeholder="Nome do banco (ex: Nubank, Itaú, Bradesco...)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingChavePix}
                  className={`w-full py-3 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                    loadingChavePix
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 hover:shadow-xl'
                  }`}
                >
                  {loadingChavePix ? '⏳ Cadastrando...' : '✅ Cadastrar Chave PIX'}
                </button>
              </form>

              {/* Lista de Chaves PIX Cadastradas */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-700 mb-4">Chaves PIX Cadastradas ({chavesPixSalvas.length})</h3>

                {chavesPixSalvas.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <span className="text-5xl">💠</span>
                    <p className="text-gray-500 mt-2">Nenhuma chave PIX cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chavesPixSalvas.map((chave) => (
                      <div key={chave.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold uppercase">
                                {chave.tipo}
                              </span>
                              <h4 className="font-bold text-gray-800">{chave.chave}</h4>
                            </div>
                            <p className="text-sm text-gray-600">👤 {chave.titular}</p>
                            <p className="text-sm text-gray-500">🏦 {chave.banco}</p>
                          </div>
                          <button
                            onClick={() => handleExcluirChavePix(chave.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Gerenciamento de Retiradas */}
          {mostrarRetiradas && (
            <section id="secao-retiradas" tabIndex={-1} className="bg-white rounded-lg shadow-lg p-6 mb-6 outline-none">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  Solicitações de Retirada
                </h2>
                <button
                  onClick={() => setMostrarRetiradas(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
                >
                  ✕ Fechar
                </button>
              </div>

              {carregandoRetiradas ? (
                <div className="text-center py-12">
                  <span className="text-4xl animate-spin block mb-4">⏳</span>
                  <p className="text-gray-600">Carregando solicitações...</p>
                </div>
              ) : solicitacoesRetirada.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <span className="text-5xl">📭</span>
                  <p className="text-gray-500 mt-2">Nenhuma solicitação de retirada</p>
                  <p className="text-gray-400 text-sm mt-1">As solicitações dos entregadores aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {solicitacoesRetirada.map((solicitacao) => (
                    <div
                      key={solicitacao.id}
                      className="border-2 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">👤</span>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">
                                {solicitacao.entregador?.nome || 'Entregador'}
                              </h3>
                              {solicitacao.entregador?.telefone && (
                                <p className="text-sm text-gray-600">
                                  📞 {solicitacao.entregador.telefone}
                                </p>
                              )}
                            </div>
                          </div>
                          {solicitacao.pedido?.itens && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">📦 ITENS DO PEDIDO:</p>
                              <ul className="text-xs text-gray-700 space-y-0.5">
                                {Array.isArray(solicitacao.pedido.itens) ? (
                                  solicitacao.pedido.itens.map((item: any, i: number) => (
                                    <li key={i}>• {item}</li>
                                  ))
                                ) : (
                                  <li>• {solicitacao.pedido.itens}</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {solicitacao.valor.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(solicitacao.criado_em).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                            solicitacao.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : solicitacao.status === 'aprovada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {solicitacao.status === 'pendente' && '⏳ Pendente'}
                          {solicitacao.status === 'aprovada' && '✅ Aprovada'}
                          {solicitacao.status === 'cancelada' && '❌ Cancelada'}
                        </span>

                        {solicitacao.status === 'pendente' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAprovarRetirada(solicitacao)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                              ✅ Aprovar
                            </button>
                            <button
                              onClick={() => handleCancelarRetirada(solicitacao)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Banner do Último Pedido Criado */}
          {ultimoPedidoCriado && (
            <section className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎉</span> Pedido Criado com Sucesso!
                  </h2>
                  <p className="text-red-100 mb-3">
                    Pedido #{ultimoPedidoCriado.slice(-8)}
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs font-medium text-red-50 mb-2">🔗 Link de Rastreamento:</p>
                    <code className="block bg-white/30 rounded px-3 py-2 text-sm font-mono break-all mb-3">
                      {gerarLinkRastreamento(ultimoPedidoCriado)}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copiarIdPedido(ultimoPedidoCriado)}
                        className="flex-1 bg-white text-red-600 hover:bg-red-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        {linkCopiado === ultimoPedidoCriado ? '✅ Copiado!' : '📋 Copiar ID'}
                      </button>
                      <button
                        onClick={() => compartilharLinkRastreamento(ultimoPedidoCriado, '')}
                        className="flex-1 bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        📤 Enviar
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setUltimoPedidoCriado(null)}
                  className="text-red-100 hover:text-white transition-colors"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </section>
          )}

          {/* Formulário de Novo Pedido */}
          {!mostrarFilaPedidos && !mostrarCadastroProduto && !mostrarChavesPix && !mostrarRetiradas && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Coluna da Esquerda: Novo Pedido */}
              <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-24">
                <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
                  <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <span className="text-3xl">📝</span>
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 placeholder:font-normal font-black transition-all"
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
                className={`w-full py-3 rounded-lg font-medium text-white transition-colors shadow-lg ${
                  loading
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                }`}
              >
                {loading ? 'Enviando...' : '📦 Criar Pedido e Enviar para Entregadores'}
              </button>
            </form>
                </section>
              </div>

              {/* Coluna da Direita: Lista de Pedidos */}
              <div className="xl:col-span-7 2xl:col-span-8">
                <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-2 sm:mb-0">
                      <span className="text-3xl">📦</span>
                      Gerenciamento de Pedidos
                    </h2>
                    <span className="text-sm font-bold text-red-700 bg-red-100 px-4 py-1.5 rounded-full shadow-sm">
                      Total: {pedidosFiltrados.length} pedidos
                    </span>
                  </div>

            {/* Filtros */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Pesquisa por ID e Entregador */}
              {/* Filtros: Datas e Entregador */}
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Filtro de Data Início */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all text-sm font-bold h-11 bg-white"
                      title="Data de Início"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-500 uppercase">Início</span>
                  </div>

                  {/* Filtro de Data Fim */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all text-sm font-bold h-11 bg-white"
                      title="Data de Fim"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-500 uppercase">Fim</span>
                  </div>

                  {/* Botão Limpar Datas */}
                  {(filtroDataInicio || filtroDataFim) && (
                    <button
                      onClick={() => { setFiltroDataInicio(''); setFiltroDataFim(''); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-1 border border-gray-200"
                    >
                      ✕ Limpar
                    </button>
                  )}
                </div>
                
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🛵</span>
                  <input
                    type="text"
                    placeholder="Filtrar por Entregador..."
                    value={filtroEntregador}
                    onChange={(e) => setFiltroEntregador(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 focus:outline-none transition-all text-sm font-bold h-11 bg-white"
                  />
                  <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-gray-500 uppercase">Entregador</span>
                </div>
              </div>

              {/* Abas */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setFiltroAtivo('todos')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'todos'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({contagemPedidos.todos})
              </button>
              <button
                onClick={() => setFiltroAtivo('pendentes')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'pendentes'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pendentes ({contagemPedidos.pendentes})
              </button>
              <button
                onClick={() => setFiltroAtivo('em_entrega')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'em_entrega'
                    ? 'bg-red-400 text-white shadow-lg shadow-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Em Entrega ({contagemPedidos.em_entrega})
              </button>
              <button
                onClick={() => setFiltroAtivo('entregues')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  filtroAtivo === 'entregues'
                    ? 'bg-red-700 text-white shadow-lg shadow-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Entregues ({contagemPedidos.entregues})
              </button>
            </div>
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

                    <div className="pt-2 mb-2 space-y-2">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs font-medium text-green-700 uppercase mb-1">💰 Valor do Pedido</p>
                        <p className="text-lg font-bold text-green-900">{formatarValor(pedido.valor_pedido)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 uppercase mb-1">🛵 Valor do Entregador</p>
                        <p className="text-lg font-bold text-blue-900">{formatarValor(pedido.valor_entregador)}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <p className="text-xs font-medium text-purple-700 uppercase mb-1">📊 Subtotal</p>
                        <p className="text-xl font-black text-purple-900">{formatarValor((pedido.valor_pedido || 0) + (pedido.valor_entregador || 0))}</p>
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
              </div>
            </div>
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

                        {/* Valores - Pedido, Entregador e Subtotal */}
                        <div className="space-y-2">
                          <div className="bg-green-50 rounded p-2 border border-green-100">
                            <p className="text-xs font-medium text-green-700 mb-1">💰 Valor do Pedido</p>
                            <p className="text-sm font-bold text-green-900">{formatarValor(pedido.valor_pedido)}</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2 border border-blue-100">
                            <p className="text-xs font-medium text-blue-700 mb-1">🛵 Valor do Entregador</p>
                            <p className="text-sm font-bold text-blue-900">{formatarValor(pedido.valor_entregador)}</p>
                          </div>
                          <div className="bg-purple-50 rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📊 Subtotal</p>
                            <p className="text-sm font-black text-purple-900">{formatarValor((pedido.valor_pedido || 0) + (pedido.valor_entregador || 0))}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Comprovante PIX */}
                      {pedido.forma_pagamento === 'pix' && pedido.comprovante_pix && (
                        <button
                          onClick={() => {
                            setComprovanteSelecionado(pedido.comprovante_pix || null);
                            setPedidoComprovante(pedido);
                            setMostrarComprovante(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 mb-3"
                        >
                          📎 Ver Comprovante de Pagamento PIX
                        </button>
                      )}

                      {pedido.forma_pagamento === 'pix' && !pedido.comprovante_pix && (
                        <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 font-medium py-2 px-4 rounded-lg mb-3 text-center text-sm">
                          ⚠️ Comprovante não anexado
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => aceitarPedidoFila(pedido)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          ✅ ACEITAR
                        </button>
                        <button
                          onClick={() => handleCancelarPedidoFila(pedido)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          ❌ CANCELAR
                        </button>
                      </div>
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

                        {/* Valores - Pedido, Entregador e Subtotal */}
                        <div className="space-y-2">
                          <div className="bg-green-50 rounded p-2 border border-green-100">
                            <p className="text-xs font-medium text-green-700 mb-1">💰 Valor do Pedido</p>
                            <p className="text-sm font-bold text-green-900">{formatarValor(pedido.valor_pedido)}</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2 border border-blue-100">
                            <p className="text-xs font-medium text-blue-700 mb-1">🛵 Valor do Entregador</p>
                            <p className="text-sm font-bold text-blue-900">{formatarValor(pedido.valor_entregador)}</p>
                          </div>
                          <div className="bg-purple-50 rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📊 Subtotal</p>
                            <p className="text-sm font-black text-purple-900">{formatarValor((pedido.valor_pedido || 0) + (pedido.valor_entregador || 0))}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Comprovante PIX - Em Preparação */}
                      {pedido.forma_pagamento === 'pix' && pedido.comprovante_pix && (
                        <button
                          onClick={() => {
                            setComprovanteSelecionado(pedido.comprovante_pix || null);
                            setPedidoComprovante(pedido);
                            setMostrarComprovante(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 mb-3"
                        >
                          📎 Ver Comprovante de Pagamento PIX
                        </button>
                      )}

                      <div className="mt-4 flex gap-2">
                        <select
                          value={pedido.status}
                          onChange={(e) => atualizarStatusFila(pedido.id, e.target.value)}
                          className="flex-1 bg-white border border-orange-300 text-orange-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 font-bold cursor-pointer hover:bg-orange-50 transition-colors"
                        >
                          <option value="em_preparacao">🔥 Em Preparação</option>
                          <option value="em_rota">🚛 Em Rota de Entrega</option>
                          <option value="entregue">✅ Entregue</option>
                        </select>
                        <button
                          onClick={() => handleCancelarPedidoFila(pedido)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          ❌ Cancelar
                        </button>
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

                        {/* Valores - Pedido, Entregador e Subtotal */}
                        <div className="space-y-2">
                          <div className="bg-green-50 rounded p-2 border border-green-100">
                            <p className="text-xs font-medium text-green-700 mb-1">💰 Valor do Pedido</p>
                            <p className="text-sm font-bold text-green-900">{formatarValor(pedido.valor_pedido)}</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2 border border-blue-100">
                            <p className="text-xs font-medium text-blue-700 mb-1">🛵 Valor do Entregador</p>
                            <p className="text-sm font-bold text-blue-900">{formatarValor(pedido.valor_entregador)}</p>
                          </div>
                          <div className="bg-purple-50 rounded p-2 border border-purple-100">
                            <p className="text-xs font-medium text-purple-700 mb-1">📊 Subtotal</p>
                            <p className="text-sm font-black text-purple-900">{formatarValor((pedido.valor_pedido || 0) + (pedido.valor_entregador || 0))}</p>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Comprovante PIX - Em Rota */}
                      {pedido.forma_pagamento === 'pix' && pedido.comprovante_pix && (
                        <button
                          onClick={() => {
                            setComprovanteSelecionado(pedido.comprovante_pix || null);
                            setPedidoComprovante(pedido);
                            setMostrarComprovante(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 mb-3"
                        >
                          📎 Ver Comprovante de Pagamento PIX
                        </button>
                      )}

                      <div className="mt-4 flex gap-2">
                        <select
                          value={pedido.status}
                          onChange={(e) => atualizarStatusFila(pedido.id, e.target.value)}
                          className="flex-1 bg-white border border-purple-300 text-purple-800 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 font-bold cursor-pointer hover:bg-purple-50 transition-colors"
                        >
                          <option value="em_rota">🚛 Em Rota de Entrega</option>
                          <option value="entregue">✅ Entregue</option>
                        </select>
                        <button
                          onClick={() => handleCancelarPedidoFila(pedido)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Histórico e Abas */}
          <section className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAbaHistorico('pagamentos')}
                  className={`text-xl font-bold pb-2 transition-all border-b-4 ${
                    abaHistorico === 'pagamentos' 
                      ? 'text-gray-800 border-red-600' 
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  💰 Histórico de Pagamentos
                </button>
                <button
                  onClick={() => setAbaHistorico('pedidos')}
                  className={`text-xl font-bold pb-2 transition-all border-b-4 ${
                    abaHistorico === 'pedidos' 
                      ? 'text-gray-800 border-red-600' 
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  📦 Histórico de Pedidos
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase ml-2 mr-1">📅 Filtrar Data:</span>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 p-1.5"
                />
                <span className="text-gray-400">até</span>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 p-1.5"
                />
                {(filtroDataInicio || filtroDataFim) && (
                  <button
                    onClick={() => { setFiltroDataInicio(''); setFiltroDataFim(''); }}
                    className="text-xs text-red-600 hover:underline font-bold px-2"
                  >
                    Limpar
                  </button>
                )}
                <button
                  onClick={() => {
                    if (abaHistorico === 'pagamentos') carregarPagamentos();
                    else carregarPedidos();
                  }}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors ml-2"
                  title="Atualizar"
                >
                  🔄
                </button>
              </div>
            </div>

            {abaHistorico === 'pagamentos' ? (
              /* TABELA DE PAGAMENTOS */
              carregandoPagamentos ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Buscando pagamentos...</p>
                </div>
              ) : pagamentos.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <span className="text-6xl mb-4 block">💰</span>
                  <p className="text-gray-500 font-bold text-xl">Nenhum pagamento registrado</p>
                  <p className="text-gray-400 mt-2">Os registros de repasses aparecerão aqui.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest font-black">
                        <th className="py-3 px-4 text-left">Data</th>
                        <th className="py-3 px-4 text-left">Entregador</th>
                        <th className="py-3 px-4 text-left">Método</th>
                        <th className="py-3 px-4 text-left">Descrição</th>
                        <th className="py-3 px-4 text-left">Itens</th>
                        <th className="py-3 px-4 text-right">Valor</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos
                        .filter(p => {
                          if (!filtroDataInicio && !filtroDataFim) return true;
                          const dataPag = new Date(p.criado_em);
                          dataPag.setHours(0, 0, 0, 0);
                          if (filtroDataInicio && dataPag < new Date(filtroDataInicio + 'T00:00:00')) return false;
                          if (filtroDataFim && dataPag > new Date(filtroDataFim + 'T23:59:59')) return false;
                          return true;
                        })
                        .map((pagamento) => {
                        const itensPedido = pagamento.itens_em_pedido || pagamento.retirada?.pedido?.itens;
                        return (
                          <tr key={pagamento.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                            <td className="py-4 px-4 text-sm font-bold text-gray-500 group-hover:text-red-600">
                              {new Date(pagamento.criado_em).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center text-red-600 font-bold text-xs">
                                  {pagamento.entregador?.nome?.charAt(0).toUpperCase() || 'E'}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-800">{pagamento.entregador?.nome}</p>
                                  <p className="text-[10px] text-gray-500 font-medium">{pagamento.entregador?.telefone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                {pagamento.forma_pagamento === 'pix' ? '💠 PIX' : '💵 Dinheiro'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs text-gray-600 italic">
                              {pagamento.descricao || 'Retirada de saldo'}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(itensPedido) ? (
                                  itensPedido.slice(0, 2).map((item: string, i: number) => (
                                    <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-bold uppercase">
                                      {item}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-bold uppercase">
                                    {itensPedido}
                                  </span>
                                )}
                                {Array.isArray(itensPedido) && itensPedido.length > 2 && (
                                  <span className="text-[9px] text-gray-400 font-bold">+{itensPedido.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <p className="text-sm font-black text-red-600">
                                {parseFloat(pagamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${
                                pagamento.status === 'realizado' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {pagamento.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* TABELA DE HISTÓRICO DE PEDIDOS */
              carregandoHistorico ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Processando histórico...</p>
                </div>
              ) : historicoPedidos.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <span className="text-6xl mb-4 block">📦</span>
                  <p className="text-gray-500 font-bold text-xl">Nenhum pedido no histórico</p>
                  <p className="text-gray-400 mt-2">Os pedidos finalizados aparecerão aqui.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest font-black">
                        <th className="py-3 px-4 text-left">Pedido</th>
                        <th className="py-3 px-4 text-left">Data/Hora</th>
                        <th className="py-3 px-4 text-left">Entregador</th>
                        <th className="py-3 px-4 text-left">Pagamento</th>
                        <th className="py-3 px-4 text-left">Itens</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoPedidos
                        .filter(p => {
                          if (!filtroDataInicio && !filtroDataFim) return true;
                          const dataPed = new Date(p.created_at || p.createdAt);
                          if (filtroDataInicio && dataPed < new Date(filtroDataInicio + 'T00:00:00')) return false;
                          if (filtroDataFim && dataPed > new Date(filtroDataFim + 'T23:59:59')) return false;
                          return true;
                        })
                        .map((pedido) => (
                          <tr key={pedido.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 group">
                            <td className="py-4 px-4">
                              <span className="text-sm font-black text-gray-800 group-hover:text-red-600 transition-colors">
                                #{pedido.id.slice(-6).toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-bold text-gray-600">
                                {new Date(pedido.created_at || pedido.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {new Date(pedido.created_at || pedido.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              {pedido.entregadorNome ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center text-[10px] font-bold text-red-600 border border-red-100">
                                    {pedido.entregadorNome.charAt(0)}
                                  </div>
                                  <p className="text-xs font-bold text-gray-700">{pedido.entregadorNome}</p>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter italic">Pendente</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                {pedido.forma_pagamento || 'N/A'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {Array.isArray(pedido.itens) ? (
                                  pedido.itens.slice(0, 2).map((item, i) => (
                                    <span key={i} className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                      {item}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                    {pedido.itens}
                                  </span>
                                )}
                                {Array.isArray(pedido.itens) && pedido.itens.length > 2 && (
                                  <span className="text-[9px] text-gray-400 font-black">+{pedido.itens.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <p className="text-sm font-black text-gray-900">
                                {formatarValor((pedido.valor_pedido || 0) + (pedido.valor_entregador || 0))}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm ${
                                pedido.status === 'entregue' ? 'bg-green-500 text-white' : 
                                pedido.status === 'cancelado' ? 'bg-red-500 text-white' : 
                                'bg-blue-500 text-white'
                              }`}>
                                {pedido.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>
        </div>
      </main>
        {/* Modal de Pagamento */}
        <ModalPagamentoEntregador
          aberto={modalPagamentoAberto}
          onClose={() => setModalPagamentoAberto(false)}
          onPagamentoRealizado={() => {
            carregarPagamentos();
            carregarRetiradas();
            setRetiradaParaPagar(null);
          }}
          dadosRetirada={retiradaParaPagar}
        />

        {/* Modal de Comprovante PIX */}
        {mostrarComprovante && comprovanteSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  📎 Comprovante de Pagamento PIX
                </h3>
                <button
                  onClick={() => {
                    setMostrarComprovante(false);
                    setComprovanteSelecionado(null);
                    setPedidoComprovante(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Informações do Pedido */}
                {pedidoComprovante && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="font-bold text-gray-800 mb-3">📋 Informações do Pedido</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium text-gray-800">{pedidoComprovante.cliente}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium text-gray-800">
                          {new Date(pedidoComprovante.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-gray-800 capitalize">
                          {pedidoComprovante.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pagamento:</span>
                        <span className="font-medium text-gray-800">💠 PIX</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprovante */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">🖼️ Comprovante Anexado</h4>
                  {comprovanteSelecionado.endsWith('.pdf') ? (
                    <div className="border-2 border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                      <span className="text-6xl mb-4 block">📄</span>
                      <p className="text-gray-600 mb-4">Arquivo PDF</p>
                      <a
                        href={comprovanteSelecionado || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        📥 Abrir PDF
                      </a>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <img
                        src={comprovanteSelecionado || ''}
                        alt="Comprovante de Pagamento"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3">
                  <a
                    href={comprovanteSelecionado || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
                  >
                    📥 Baixar Comprovante
                  </a>
                  <button
                    onClick={async () => {
                      if (!comprovanteSelecionado) return;
                      try {
                        await navigator.clipboard.writeText(comprovanteSelecionado);
                        alert('✅ Link do comprovante copiado!');
                      } catch (err) {
                        console.error('Erro ao copiar:', err);
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    📋 Copiar Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
