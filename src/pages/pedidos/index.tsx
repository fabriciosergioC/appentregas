import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api, Pedido, supabase } from '@/services/api';
import { assinarPedidos, removerAssinaturaPedidos, assinarLiberacaoPedidos } from '@/services/realtime';
import PedidoCard from '@/components/pedidoCard/PedidoCard';
import ModalSaldo from '@/components/modalSaldo/ModalSaldo';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import '@/app/globals.css';
import '../login-estabelecimento/login-animations.css';

// Canal de comunicação entre abas
const CHANNEL_NAME = 'app-entrega-channel';
const TAB_ID_KEY = 'tab_id_entregador';
const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'server';

export default function Pedidos() {
  const router = useRouter();
  const { iniciarSomRepetitivo, pararSom, testarSom, ativarAudio, audioEnabled } = useNotificationSound();
  const [entregador, setEntregador] = useState<{ id: string; nome: string; foto_url?: string | null; placa_moto?: string | null } | null>(null);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Pedido[]>([]);
  const [meusPedidos, setMeusPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<'disponiveis' | 'meus'>('disponiveis');
  const [modalSaldoAberto, setModalSaldoAberto] = useState(false);
  const [temPedidoNovo, setTemPedidoNovo] = useState(false);
  const [audioSilenciadoManualmente, setAudioSilenciadoManualmente] = useState(false);
  const [pedidosRecusados, setPedidosRecusados] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const salvas = localStorage.getItem('pedidos_recusados');
      return salvas ? new Set(JSON.parse(salvas)) : new Set();
    }
    return new Set();
  });
  const pedidosRecusadosRef = useRef(pedidosRecusados);

  // Estados para chaves PIX do entregador
  const [mostrarChavesPix, setMostrarChavesPix] = useState(false);
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('cpf');
  const [nomeTitularPix, setNomeTitularPix] = useState('');
  const [bancoPix, setBancoPix] = useState('');
  const [chavesPixSalvas, setChavesPixSalvas] = useState<any[]>([]);
  const [loadingChavePix, setLoadingChavePix] = useState(false);

  // Atualizar ref quando pedidosRecusados mudar
  useEffect(() => {
    pedidosRecusadosRef.current = pedidosRecusados;
  }, [pedidosRecusados]);

  // Parar som quando não houver mais pedidos disponíveis
  useEffect(() => {
    if (pedidosDisponiveis.length === 0) {
      if (temPedidoNovo) setTemPedidoNovo(false);
      pararSom();
      setAudioSilenciadoManualmente(false); // Reseta o silêncio para a próxima leva
    } else if (pedidosDisponiveis.length > 0 && !temPedidoNovo && !audioSilenciadoManualmente) {
      console.log('🔔 Detectado pedidos pendentes, ativando som...');
      setTemPedidoNovo(true);
      iniciarSomRepetitivo();
    }
  }, [pedidosDisponiveis.length, temPedidoNovo, audioSilenciadoManualmente, pararSom, iniciarSomRepetitivo]);

  // Função auxiliar para pegar o ID do entregador do localStorage
  const getEntregadorId = (): string | null => {
    const dados = localStorage.getItem('entregador');
    if (!dados) return null;
    try {
      const parsed = JSON.parse(dados);
      return parsed?.id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    console.log('📊 Estado atual - Disponíveis:', pedidosDisponiveis.length, 'Meus:', meusPedidos.length, 'Tab:', tabAtiva);
  }, [pedidosDisponiveis, meusPedidos, tabAtiva]);

  useEffect(() => {
    // Registrar esta aba e ouvir eventos de fechamento
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(TAB_ID_KEY, TAB_ID);
    
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'LOGOUT_REALIZADO') {
        // Fecha esta aba se não for a página de login
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Timeout de inatividade - 5 minutos
  useEffect(() => {
    if (typeof window === 'undefined' || !entregador) return;

    const TEMPO_INATIVIDADE_MS = 5 * 60 * 1000; // 5 minutos
    let timeoutId: NodeJS.Timeout;

    const resetarTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('⏰ Tempo de inatividade atingido (5 minutos), fazendo logout...');
        localStorage.removeItem('entregador');
        
        // Enviar mensagem para outras abas fecharem
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({
          type: 'LOGOUT_REALIZADO'
        });
        channel.close();
        
        router.replace('/login');
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
  }, [router, entregador]);

  useEffect(() => {
    // Garantir que está rodando no cliente (browser)
    if (typeof window === 'undefined') {
      return;
    }

    // Verificar se está logado
    const dadosEntregador = localStorage.getItem('entregador');
    if (!dadosEntregador) {
      router.push('/login');
      return;
    }

    const entregadorData = JSON.parse(dadosEntregador);
    setEntregador(entregadorData);

    console.log('👤 Dados do localStorage:', {
      nome: entregadorData.nome,
      tem_foto: !!entregadorData.foto_url,
      foto_length: entregadorData.foto_url?.length || 0
    });

    // Buscar dados atualizados do entregador (incluindo foto)
    const buscarDadosEntregador = async () => {
      try {
        console.log('🔄 Buscando dados atualizados do banco (Supabase)...');
        const { data, error } = await supabase
          .from('entregadores')
          .select('*')
          .eq('id', entregadorData.id)
          .single();

        if (error) {
          console.error('❌ Erro Supabase ao buscar entregador:', error);
          return;
        }

        if (data) {
          console.log('✅ Dados carregados do banco:', {
            nome: data.nome,
            tem_foto: !!data.foto_url,
            foto_length: data.foto_url?.length || 0
          });
          
          setEntregador(data);
          // Atualizar localStorage com os dados mais recentes do banco
          localStorage.setItem('entregador', JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar dados do entregador:', error);
      }
    };

    buscarDadosEntregador();

    // Assinar mudanças em tempo real com Supabase
    assinarPedidos(
      // Novo pedido
      (novoPedido) => {
        console.log('📦 [REALTIME] Novo pedido recebido:', novoPedido);
        if (novoPedido.status === 'pendente') {
          // Ignorar pedidos recusados
          if (pedidosRecusadosRef.current.has(novoPedido.id)) {
            console.log('⚠️ Pedido recusado, ignorando...', novoPedido.id);
            return;
          }
          setPedidosDisponiveis((prev) => {
            if (prev.find(p => p.id === novoPedido.id)) {
              console.log('⚠️ Pedido já existe, ignorando...');
              return prev;
            }
            console.log('✅ Adicionando novo pedido à lista');
            return [novoPedido, ...prev];
          });
          // Iniciar som repetitivo
          console.log('🔔 Iniciando som repetitivo de novo pedido...');
          setTemPedidoNovo(true);
          iniciarSomRepetitivo();
          // Notificação
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Novo pedido disponível!', {
              body: `Pedido de ${novoPedido.cliente}`,
              icon: '/favicon.ico',
            });
          }
        }
      },
      // Pedido atualizado
      (pedidoAtualizado) => {
        console.log('📝 [REALTIME] Pedido atualizado:', pedidoAtualizado);
        // Se foi aceito por este entregador
        if (pedidoAtualizado.status === 'aceito' && pedidoAtualizado.entregador_id === entregadorData.id) {
          setPedidosDisponiveis((prev) => prev.filter(p => p.id !== pedidoAtualizado.id));
          setMeusPedidos((prev) => {
            const jaExiste = prev.find(p => p.id === pedidoAtualizado.id);
            if (jaExiste) {
              return prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p);
            }
            return [pedidoAtualizado, ...prev];
          });
        }

        // Se o pedido voltou para pendente (recusado), remover de meus pedidos
        if (pedidoAtualizado.status === 'pendente' && pedidoAtualizado.entregador_id === null) {
          console.log('❌ Pedido recusado, removendo da lista:', pedidoAtualizado.id);
          setMeusPedidos((prev) => prev.filter(p => p.id !== pedidoAtualizado.id));
        }

        // Atualizar pedido em meus pedidos se for deste entregador
        setMeusPedidos((prev) => {
          const pedidoDestEntregador = prev.find(p => p.id === pedidoAtualizado.id);
          if (pedidoDestEntregador) {
            console.log('🔄 Atualizando pedido na lista:', pedidoAtualizado.id);
            return prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p);
          }
          return prev;
        });
      }
    );

    // Assinar liberação de pedidos em tempo real
    assinarLiberacaoPedidos((pedidoLiberado) => {
      console.log('🔓 [REALTIME] Pedido liberado:', pedidoLiberado);
      // Atualizar o pedido na lista de meus pedidos
      setMeusPedidos((prev) => {
        const pedidoAtualizado = prev.find(p => p.id === pedidoLiberado.id);
        if (pedidoAtualizado && pedidoAtualizado.entregador_id === entregadorData.id) {
          console.log('✅ Atualizando pedido liberado:', pedidoLiberado.id);
          return prev.map(p => p.id === pedidoLiberado.id ? { ...p, liberado_pelo_estabelecimento: true, liberado_em: pedidoLiberado.liberado_em } : p);
        }
        return prev;
      });
    });

    // Carregar pedidos iniciais
    console.log('🔄 Carregando pedidos iniciais...');
    carregarPedidos(entregadorData.id);

    // Polling de backup
    const intervaloPolling = setInterval(() => {
      const id = getEntregadorId();
      if (id) {
        carregarPedidos(id);
      }
    }, 5000);

    return () => {
      removerAssinaturaPedidos();
      clearInterval(intervaloPolling);
    };
  }, [router, iniciarSomRepetitivo]);

  // Carregar chaves PIX quando mostrarChavesPix for true
  useEffect(() => {
    if (mostrarChavesPix) {
      carregarChavesPix();
    }
  }, [mostrarChavesPix]);

  // Função para remover todas as assinaturas
  const limparAssinaturas = () => {
    removerAssinaturaPedidos();
  };

  const carregarPedidos = async (entregadorId: string) => {
    try {
      console.log('🔄 Carregando pedidos...', { entregadorId });

      if (!entregadorId) {
        console.error('❌ entregadorId é undefined ou vazio!');
        console.log('👤 Estado do entregador:', entregador);
        return;
      }

      // Usar Supabase direto SEMPRE (mais confiável)
      const [resultadoDisponiveis, resultadoMeus] = await Promise.all([
        api.listarPedidosDisponiveis(),
        api.meusPedidos(entregadorId),
      ]);

      // Extrair os dados (a API retorna { data, error })
      const disponiveis = resultadoDisponiveis.data || [];
      const meus = resultadoMeus.data || [];

      console.log('📋 Pedidos disponíveis (Supabase):', disponiveis.length, disponiveis);
      console.log('📋 Meus pedidos (Supabase):', meus.length, meus);

      // Atualizar lista de disponíveis
      setPedidosDisponiveis(prev => {
        const novosIds = new Set(disponiveis.map(p => p.id));
        // Remove pedidos que não estão mais disponíveis
        const filtrados = prev.filter(p => novosIds.has(p.id));
        // Adiciona novos pedidos (exceto os recusados)
        const existentesIds = new Set(filtrados.map(p => p.id));
        const novos = disponiveis.filter(p => !existentesIds.has(p.id) && !pedidosRecusadosRef.current.has(p.id));

        if (novos.length > 0) {
          console.log('✅ Adicionando', novos.length, 'novos pedidos');
        }
        if (prev.length !== disponiveis.length) {
          console.log('📊 Mudança detectada:', prev.length, '->', disponiveis.length);
        }

        return [...novos, ...filtrados];
      });
      setMeusPedidos(meus);
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error);
      setPedidosDisponiveis([]);
      setMeusPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAtivarSomManualmente = () => {
    console.log('🔊 Ativando som manualmente...');
    ativarAudio();
    setAudioSilenciadoManualmente(false);
    
    if (pedidosDisponiveis.length > 0) {
      setTemPedidoNovo(true);
      iniciarSomRepetitivo();
    } else {
      testarSom();
    }
  };

  const handleAceitarPedido = async (pedidoId: string) => {
    const entregadorId = getEntregadorId();

    if (!entregadorId) {
      console.error('❌ Entregador não encontrado');
      console.log('👤 Estado atual do entregador:', entregador);
      return;
    }

    console.log('✅ Aceitando pedido:', pedidoId, 'Entregador:', entregadorId);

    // Parar som ao aceitar pedido
    pararSom();
    setTemPedidoNovo(false);

    try {
      const resultado = await api.aceitarPedido(pedidoId, entregadorId);
      console.log('📝 Pedido aceito no backend:', resultado);

      if (resultado.error) {
        console.error('❌ Erro ao aceitar pedido:', resultado.error);
        alert('Erro ao aceitar pedido: ' + resultado.error.message);
        return;
      }

      const pedidoAtualizado = resultado.data;
      console.log('📦 Pedido atualizado:', pedidoAtualizado);

      // Remover da lista de disponíveis imediatamente
      setPedidosDisponiveis((prev) => {
        const novaLista = prev.filter((p) => p.id !== pedidoId);
        console.log('📋 Pedidos disponíveis após aceitar:', novaLista.length);
        return novaLista;
      });

      // Adicionar na lista de meus pedidos imediatamente
      setMeusPedidos((prev) => {
        // Verificar se já não está na lista
        const jaExiste = prev.find(p => p.id === pedidoId);
        if (jaExiste) {
          console.log('⚠️ Pedido já está em meus pedidos, atualizando...');
          return prev.map(p => p.id === pedidoId ? pedidoAtualizado : p);
        }
        console.log('✅ Adicionando pedido aceito em meus pedidos');
        return [pedidoAtualizado, ...prev];
      });

      // Recarregar pedidos para garantir sincronia
      console.log('🔄 Recarregando pedidos para sincronizar...', { entregadorId });
      await carregarPedidos(entregadorId);

      alert('Pedido aceito com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao aceitar pedido:', error);
      alert('Erro ao aceitar pedido: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  // ============ FUNÇÕES DE CHAVES PIX DO ENTREGADOR ============

  // Carregar chaves PIX salvas
  const carregarChavesPix = async () => {
    const entregadorId = getEntregadorId();
    if (!entregadorId) return;
    try {
      const { data, error } = await supabase
        .from('chaves_pix_entregadores')
        .select('*')
        .eq('entregador_id', entregadorId)
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
      const entregadorId = getEntregadorId();
      if (!entregadorId) return;
      const { error } = await supabase.from('chaves_pix_entregadores').insert([{
        chave: chavePix,
        tipo: tipoChavePix,
        titular: nomeTitularPix,
        banco: bancoPix,
        entregador_id: entregadorId,
      }]);
      if (error) throw error;
      alert('✅ Chave PIX cadastrada com sucesso!');
      setChavePix('');
      setNomeTitularPix('');
      setBancoPix('');
      setTipoChavePix('cpf');
      setMostrarChavesPix(false); // Fechar modal após sucesso
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
      const { error } = await supabase.from('chaves_pix_entregadores').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Chave PIX excluída com sucesso!');
      carregarChavesPix();
    } catch (err) {
      alert('Erro ao excluir chave PIX');
    }
  };

  const handleRecusarPedido = async (pedidoId: string) => {
    if (!confirm('Tem certeza que deseja recusar este pedido?')) {
      return;
    }

    console.log('❌ Recusando pedido:', pedidoId);

    // Parar som ao recusar pedido
    pararSom();
    setTemPedidoNovo(false);

    try {
      const resultado = await api.recusarPedido(pedidoId);
      console.log('📝 Pedido recusado no backend:', resultado);

      if (resultado.error) {
        console.error('❌ Erro ao recusar pedido:', resultado.error);
        alert('Erro ao recusar pedido: ' + resultado.error.message);
        return;
      }

      // Adicionar na lista de pedidos recusados e salvar no localStorage
      setPedidosRecusados((prev) => {
        const novoSet = new Set(prev).add(pedidoId);
        localStorage.setItem('pedidos_recusados', JSON.stringify(Array.from(novoSet)));
        return novoSet;
      });

      // Remover da lista de disponíveis imediatamente
      setPedidosDisponiveis((prev) => {
        const novaLista = prev.filter((p) => p.id !== pedidoId);
        console.log('📋 Pedidos disponíveis após recusar:', novaLista.length);
        return novaLista;
      });

      alert('Pedido recusado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao recusar pedido:', error);
      alert('Erro ao recusar pedido: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleIniciarEntrega = async (pedidoId: string) => {
    try {
      await api.iniciarEntrega(pedidoId);

      setMeusPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: 'em_transito' } : p))
      );

      alert('Entrega iniciada! Redirecionando para navegação...');
      router.push('/mapa');
    } catch (error) {
      console.error('Erro ao iniciar entrega:', error);
      alert('Erro ao iniciar entrega');
    }
  };

  const handleChegarLocal = async (id: string) => {
    try {
      const { error } = await api.notificarChegada(id);
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        alert('Erro ao notificar chegada: ' + error.message);
        return;
      }
      alert('📍 Cliente notificado que você chegou!');
      // Atualizar localmente
      setMeusPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'no_local' } : p))
      );
    } catch (error) {
      console.error('Erro ao notificar chegada:', error);
      alert('Erro ao notificar chegada');
    }
  };

  const handleFinalizarEntrega = async (pedido: Pedido) => {
    try {
      await api.finalizarPedido(pedido.id);
      
      setMeusPedidos((prev) =>
        prev.map((p) => (p.id === pedido.id ? { ...p, status: 'entregue' } : p))
      );
      
      const subtotal = ((parseFloat(String(pedido.valor_pedido).replace(',', '.')) || 0) + (parseFloat(String(pedido.valor_entregador).replace(',', '.')) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const pag = pedido.forma_pagamento ? `\n💳 Forma de Pagamento: ${pedido.forma_pagamento}` : '';
      alert(`✅ Entrega finalizada com sucesso!\n\n💵 Receber do cliente: ${subtotal}${pag}`);
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error);
      alert('Erro ao finalizar entrega');
    }
  };

  const handleLogout = () => {
    // Enviar mensagem para outras abas fecharem
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'LOGOUT_REALIZADO' });
    channel.close();
    
    localStorage.removeItem('entregador');
    localStorage.removeItem('pedidos_recusados');
    localStorage.removeItem(TAB_ID_KEY);
    
    window.location.replace('/login');
  };

  return (
    <>
      <Head>
        <title>Pedidos - App do Entregador</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      {/* Container Principal Mobile Native (100% largura) */}
      <div className="min-h-screen bg-gray-50 flex flex-col pb-16 relative">

        {/* Aviso de som - oculto a pedido */}
        <div className="hidden">
          <div className={`border-l-4 p-3 text-sm ${temPedidoNovo ? 'bg-red-100 border-red-500 text-red-700 animate-pulse' : audioEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'}`}>
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span>
                <strong>Som de notificação:</strong> {temPedidoNovo ? '🔊 NOVO PEDIDO! Som tocando até aceitar.' : audioEnabled ? 'Ativado! Você ouvirá um som repetitivo quando chegar novo pedido.' : 'Clique em qualquer lugar para ativar.'}
              </span>
              <button
                onClick={handleAtivarSomManualmente}
                className="ml-auto bg-white hover:bg-gray-50 text-blue-600 px-3 py-1 rounded text-xs font-medium focus:ring-2 focus:ring-blue-400 border-2 border-blue-100"
              >
                Testar Som
              </button>
              {temPedidoNovo && (
                <button
                  onClick={() => { 
                    pararSom(); 
                    setTemPedidoNovo(false); 
                    setAudioSilenciadoManualmente(true);
                  }}
                  className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium focus:ring-2 focus:ring-red-400"
                >
                  Silenciar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Header Header/Perfil Mobile-First */}
        <header className="bg-white px-5 pt-8 pb-5 rounded-b-[2rem] shadow-sm z-10">
          <div className="flex items-center gap-4 mb-6">
            {/* Foto do entregador */}
            <div className="relative">
              {entregador?.foto_url ? (
                <img
                  src={entregador.foto_url}
                  alt={entregador.nome}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <span className="text-3xl">🛵</span>
                </div>
              )}
              {entregador?.placa_moto && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                  {entregador.placa_moto}
                </div>
              )}
            </div>

            {/* Informações do entregador */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 font-medium">Bem-vindo(a),</p>
              <h1 className="text-xl font-extrabold text-gray-800 tracking-tight leading-none mt-1 truncate">
                {entregador?.nome || 'Carregando...'}
              </h1>
            </div>

            {/* Ação: Sair (No canto superior direito) */}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
              title="Sair"
            >
              <span className="text-xl">👋</span>
            </button>
          </div>

          {/* Grid de Ações */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={handleAtivarSomManualmente}
              className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl text-blue-600 transition-colors"
            >
              <span className="text-2xl mb-1">🔔</span>
              <span className="text-xs font-semibold">Som</span>
            </button>
            <button
              onClick={() => setModalSaldoAberto(true)}
              className="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-2xl text-green-600 transition-colors"
            >
              <span className="text-2xl mb-1">💰</span>
              <span className="text-xs font-semibold">Saldo</span>
            </button>
            <button
              onClick={() => setMostrarChavesPix(true)}
              className="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-2xl text-purple-600 transition-colors"
            >
              <span className="text-2xl mb-1">💠</span>
              <span className="text-xs font-semibold">PIX</span>
            </button>
          </div>

          {/* Tabs movidas para a barra de navegação inferior */}
        </header>

        <main className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Carregando pedidos...</p>
            </div>
          ) : tabAtiva === 'disponiveis' ? (
            pedidosDisponiveis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                  <span className="text-5xl">📦</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Tudo tranquilo por enquanto</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Nenhum pedido disponível no momento. Fique conectado, logo aparece algum!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidosDisponiveis.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onAceitar={() => handleAceitarPedido(pedido.id)}
                    onRecusar={() => handleRecusarPedido(pedido.id)}
                    mostrarAcoes
                  />
                ))}
              </div>
            )
          ) : meusPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl">🛵</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Sua mochila está vazia</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Você ainda não aceitou nenhum pedido. Verifique a aba de disponíveis!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meusPedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onIniciar={() => handleIniciarEntrega(pedido.id)}
                  onFinalizar={() => handleFinalizarEntrega(pedido)}
                  mostrarAcoes
                />
              ))}
            </div>
          )}
        </main>

        {/* Botão flutuante para mapa (Ajustado) */}
        {meusPedidos.some((p) => p.status === 'em_transito') && (
          <button
            onClick={() => router.push('/mapa')}
            className="fixed bottom-24 right-5 bg-white hover:bg-gray-50 text-blue-600 p-4 rounded-full shadow-2xl border-2 border-blue-500 z-30 transition-transform active:scale-95"
          >
            <span className="text-2xl">🗺️</span>
          </button>
        )}

        {/* Barra de Navegação Inferior (Mobile-Native) */}
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t space-x-1 border-gray-200 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setTabAtiva('disponiveis')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 h-full relative transition-colors ${
                tabAtiva === 'disponiveis' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative mt-1">
                <span className="text-[22px]">📦</span>
                {pedidosDisponiveis.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {pedidosDisponiveis.length}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${tabAtiva === 'disponiveis' ? 'text-blue-600' : 'text-gray-500'}`}>
                Disponíveis
              </span>
            </button>
            <div className="w-px h-8 bg-gray-200"></div>
            <button
              onClick={() => setTabAtiva('meus')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 h-full relative transition-colors ${
                tabAtiva === 'meus' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative mt-1">
                <span className="text-[22px]">🛵</span>
                {meusPedidos.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {meusPedidos.length}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${tabAtiva === 'meus' ? 'text-blue-600' : 'text-gray-500'}`}>
                Meus Pedidos
              </span>
            </button>
          </div>
        </nav>

        {/* Modal de Saldo */}
        {entregador && (
          <ModalSaldo
            aberto={modalSaldoAberto}
            entregadorId={entregador.id}
            onClose={() => setModalSaldoAberto(false)}
          />
        )}

        {/* Modal de Chaves PIX */}
        {mostrarChavesPix && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              // Fechar ao clicar fora
              if (e.target === e.currentTarget) {
                setMostrarChavesPix(false);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  💠 Minhas Chaves PIX
                </h3>
                <button
                  onClick={() => setMostrarChavesPix(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                {/* Formulário de Cadastro */}
                <form onSubmit={handleCadastrarChavePix} className="space-y-3 mb-4">
                  <h4 className="font-bold text-gray-700 mb-2 text-center">Nova Chave PIX</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        value={tipoChavePix}
                        onChange={(e) => setTipoChavePix(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 focus:outline-none transition-all text-sm"
                        required
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone</option>
                        <option value="aleatoria">Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Chave *</label>
                      <input
                        type="text"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        placeholder="Digite a chave"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 focus:outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Titular *</label>
                    <input
                      type="text"
                      value={nomeTitularPix}
                      onChange={(e) => setNomeTitularPix(e.target.value)}
                      placeholder="Nome completo do titular"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 focus:outline-none transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Banco *</label>
                    <input
                      type="text"
                      value={bancoPix}
                      onChange={(e) => setBancoPix(e.target.value)}
                      placeholder="Nome do banco (ex: Nubank, Itaú...)"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 focus:outline-none transition-all text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingChavePix}
                    className={`w-full py-2 rounded-lg font-bold text-blue-600 text-sm shadow-lg transition-all border-2 border-blue-100 ${
                      loadingChavePix
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-white hover:bg-gray-50 hover:shadow-xl'
                    }`}
                  >
                    {loadingChavePix ? '⏳ Cadastrando...' : '✅ Cadastrar Chave PIX'}
                  </button>
                </form>

                {/* Lista de Chaves Cadastradas */}
                <div className="border-t pt-3">
                  <h4 className="font-bold text-gray-700 mb-3 text-sm">Chaves Cadastradas ({chavesPixSalvas.length})</h4>

                  {chavesPixSalvas.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <span className="text-4xl">💠</span>
                      <p className="text-gray-500 mt-2 text-sm">Nenhuma chave cadastrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {chavesPixSalvas.map((chave) => (
                        <div key={chave.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold uppercase">
                                  {chave.tipo}
                                </span>
                                <span className="font-bold text-gray-800 text-sm truncate">{chave.chave}</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">👤 {chave.titular}</p>
                              <p className="text-xs text-gray-500">🏦 {chave.banco}</p>
                            </div>
                            <button
                              onClick={() => handleExcluirChavePix(chave.id)}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200 transition-all flex-shrink-0"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
