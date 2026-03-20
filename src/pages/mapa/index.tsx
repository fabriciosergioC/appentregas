import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api, Pedido } from '@/services/api';
import { escolherAppNavegacao } from '@/utils/navegacao';
import '@/app/globals.css';

const MapaEntrega = lazy(() => import('@/components/mapaEntrega/MapaEntrega'));

export default function Mapa() {
  const router = useRouter();
  const [pedidoAtivo, setPedidoAtivo] = useState<Pedido | null>(null);

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

    // Carregar pedido ativo
    carregarPedidoAtivo(entregadorData.id);
  }, [router]);

  const carregarPedidoAtivo = async (entregadorId: string) => {
    try {
      const resultado = await api.meusPedidos(entregadorId);
      const pedidos = resultado.data || [];
      const ativo = pedidos.find((p) => p.status === 'aceito' || p.status === 'em_transito');
      if (ativo) {
        setPedidoAtivo(ativo);
      }
    } catch (error) {
      console.error('Erro ao carregar pedido ativo:', error);
    }
  };

  const handleFinalizarEntrega = async () => {
    if (!pedidoAtivo) return;

    try {
      await api.finalizarPedido(pedidoAtivo.id);
      alert('Entrega finalizada com sucesso!');
      router.push('/pedidos');
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error);
      alert('Erro ao finalizar entrega');
    }
  };

  // Abrir navegação no app nativo (Google Maps ou Waze)
  const abrirNavegacaoNativa = (app?: 'maps' | 'waze') => {
    if (!pedidoAtivo) {
      alert('Pedido não disponível');
      return;
    }

    // Usar a função utilitária para abrir o app de navegação
    if (app) {
      // Se o usuário já escolheu um app específico
      const url = app === 'maps' 
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedidoAtivo.endereco)}`
        : `https://waze.com/ul?q=${encodeURIComponent(pedidoAtivo.endereco)}&navigate=yes`;
      window.open(url, '_blank');
      console.log(`🗺️ Abrindo ${app === 'maps' ? 'Google Maps' : 'Waze'} com endereço:`, pedidoAtivo.endereco);
    } else {
      // Usar a função utilitária que mostra o prompt de escolha
      escolherAppNavegacao(pedidoAtivo.endereco);
    }
  };

  return (
    <>
      <Head>
        <title>Mapa - App do Entregador</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-green-600 text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold">🗺️ Navegação</h1>
              {pedidoAtivo && (
                <p className="text-sm text-green-100">
                  Pedido #{pedidoAtivo.id.slice(0, 8)}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/pedidos')}
              className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded text-sm"
            >
              Voltar
            </button>
          </div>
        </header>

        {/* Mapa */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Carregando mapa...</p>
            </div>
          }>
            <MapaEntrega />
          </Suspense>

          {/* Painel de Informações */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4 max-h-[50vh] overflow-y-auto">
            {pedidoAtivo ? (
              <>
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 mb-2">📍 Destino</h3>
                  <p className="text-gray-600">{pedidoAtivo.endereco}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      pedidoAtivo.status === 'em_transito'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {pedidoAtivo.status === 'em_transito' ? '🚗 Em trânsito' : '✅ Aceito'}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 text-center mb-2">
                    🗺️ Selecione o app de navegação
                  </p>

                  {/* Botões de Apps de Navegação */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => abrirNavegacaoNativa('maps')}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm shadow-md transition-all"
                    >
                      🗺️ Google Maps
                    </button>
                    <button
                      onClick={() => abrirNavegacaoNativa('waze')}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-bold text-sm shadow-md transition-all"
                    >
                      🚗 Waze
                    </button>
                  </div>

                  {pedidoAtivo.status === 'em_transito' && (
                    <button
                      onClick={handleFinalizarEntrega}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
                    >
                      ✅ Finalizar Entrega
                    </button>
                  )}

                  {pedidoAtivo.status === 'aceito' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.iniciarEntrega(pedidoAtivo!.id);
                          setPedidoAtivo({ ...pedidoAtivo, status: 'em_transito' });
                          alert('Entrega iniciada! Agora selecione o app de navegação.');
                          // Abrir o app de navegação após iniciar a entrega
                          escolherAppNavegacao(pedidoAtivo!.endereco);
                        } catch (error) {
                          console.error('Erro ao iniciar entrega:', error);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                    >
                      🚗 Iniciar Entrega
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nenhum pedido ativo no momento</p>
                <button
                  onClick={() => router.push('/pedidos')}
                  className="mt-2 text-green-600 font-medium"
                >
                  Ver pedidos disponíveis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
