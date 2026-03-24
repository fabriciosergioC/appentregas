import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api, Pedido } from '@/services/api';
import { assinarPedidos, removerAssinaturaPedidos, assinarLiberacaoPedidos } from '@/services/realtime';
import PedidoCard from '@/components/pedidoCard/PedidoCard';
import ModalSaldo from '@/components/modalSaldo/ModalSaldo';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import '@/app/globals.css';

export default function Pedidos() {
  const router = useRouter();
  const { iniciarSomRepetitivo, pararSom, testarSom, ativarAudio, audioEnabled } = useNotificationSound();
  const [entregador, setEntregador] = useState<{ id: string; nome: string } | null>(null);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Pedido[]>([]);
  const [meusPedidos, setMeusPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<'disponiveis' | 'meus'>('disponiveis');
  const [modalSaldoAberto, setModalSaldoAberto] = useState(false);
  const [temPedidoNovo, setTemPedidoNovo] = useState(false);
  const [audioSilenciadoManualmente, setAudioSilenciadoManualmente] = useState(false);
  const [pedidosRecusados, setPedidosRecusados] = useState<Set<string>>(new Set());
  const pedidosRecusadosRef = useRef(pedidosRecusados);

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

    console.log('👤 Entregador logado:', entregadorData);

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

      // Adicionar na lista de pedidos recusados
      setPedidosRecusados((prev) => new Set(prev).add(pedidoId));

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
    localStorage.removeItem('entregador');
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Pedidos - App do Entregador</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Aviso de som */}
        <div className={`border-l-4 p-3 text-sm ${temPedidoNovo ? 'bg-red-100 border-red-500 text-red-700 animate-pulse' : audioEnabled ? 'bg-green-100 border-green-500 text-green-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'}`}>
          <div className="flex items-center gap-2">
            <span>🔔</span>
            <span>
              <strong>Som de notificação:</strong> {temPedidoNovo ? '🔊 NOVO PEDIDO! Som tocando até aceitar.' : audioEnabled ? 'Ativado! Você ouvirá um som repetitivo quando chegar novo pedido.' : 'Clique em qualquer lugar para ativar.'}
            </span>
            <button
              onClick={handleAtivarSomManualmente}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium focus:ring-2 focus:ring-green-400"
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

        {/* Header */}
        <header className="bg-green-600 text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🛵 App do Entregador</h1>
              {entregador && <p className="text-sm text-green-100">{entregador.nome}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAtivarSomManualmente}
                className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
                title="Ativar/Testar som de notificação"
              >
                🔔 Som
              </button>
              <button
                onClick={() => setModalSaldoAberto(true)}
                className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded text-sm font-medium flex items-center gap-1"
                title="Ver saldo"
              >
                💰 Saldo
              </button>
              <button
                onClick={handleLogout}
                className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded text-sm"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 gap-2">
            <button
              onClick={() => setTabAtiva('disponiveis')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                tabAtiva === 'disponiveis'
                  ? 'bg-white text-green-600'
                  : 'bg-green-700 text-green-100'
              }`}
            >
              Disponíveis ({pedidosDisponiveis.length})
            </button>
            <button
              onClick={() => setTabAtiva('meus')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                tabAtiva === 'meus'
                  ? 'bg-white text-green-600'
                  : 'bg-green-700 text-green-100'
              }`}
            >
              Meus Pedidos ({meusPedidos.length})
            </button>
          </div>
        </header>

        <main className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : tabAtiva === 'disponiveis' ? (
            pedidosDisponiveis.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-6xl">📦</span>
                <p className="text-gray-500 mt-4">Nenhum pedido disponível no momento</p>
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
            <div className="text-center py-10">
              <span className="text-6xl">🚗</span>
              <p className="text-gray-500 mt-4">Você ainda não tem pedidos</p>
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

        {/* Botão flutuante para mapa */}
        {meusPedidos.some((p) => p.status === 'em_transito') && (
          <button
            onClick={() => router.push('/mapa')}
            className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg"
          >
            🗺️
          </button>
        )}

        {/* Modal de Saldo */}
        {entregador && (
          <ModalSaldo
            aberto={modalSaldoAberto}
            entregadorId={entregador.id}
            onClose={() => setModalSaldoAberto(false)}
          />
        )}
      </div>
    </>
  );
}
