import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api, Pedido } from '@/services/api';
import PedidoCard from '@/components/pedidoCard/PedidoCard';
import '@/app/globals.css';

export default function DevolucoesAdmin() {
  const router = useRouter();
  const [pedidosSolicitados, setPedidosSolicitados] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<'pendentes' | 'finalizados'>('pendentes');
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('estabelecimento_user');
    if (user) {
      const userData = JSON.parse(user);
      setEstabelecimentoId(userData.id);
      carregarSolicitacoes(userData.id);
    } else {
      // Se não estiver logado, tenta buscar todas as solicitações (para teste)
      carregarSolicitacoes();
    }
    
    // Polling para atualizações
    const intervalo = setInterval(() => {
      const storedUser = localStorage.getItem('estabelecimento_user');
      const id = storedUser ? JSON.parse(storedUser).id : null;
      carregarSolicitacoes(id);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarSolicitacoes = async (estId?: string) => {
    try {
      let query = api.listarSolicitacoesDevolucao;
      // Se tiver ID de estabelecimento, filtra, senão traz tudo para teste
      const { data, error } = estId 
        ? await api.listarSolicitacoesDevolucao(estId)
        : await api.listarTodosPedidos(); // Fallback para ver algo na tela sem login
      
      if (error) throw error;
      
      // Se não tem estId, filtra apenas as que estão aguardando devolução
      const filtrados = estId 
        ? (data || []) 
        : (data || []).filter((p: Pedido) => p.status === 'solicitado_devolucao');
        
      setPedidosSolicitados(filtrados);
    } catch (err) {
      console.error('Erro ao carregar devoluções:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessarDevolucao = async (pedidoId: string) => {
    const motivo = prompt('Informe o motivo da devolução (ex: Cliente ausente, Endereço errado):');
    if (motivo === null) return; // Cancelou prompt
    if (!motivo.trim()) {
      alert('O motivo é obrigatório para confirmar a devolução.');
      return;
    }

    try {
      const { error } = await api.processarDevolucao(pedidoId, motivo);
      if (error) throw error;
      
      alert('✅ Devolução confirmada com sucesso!');
      carregarSolicitacoes(estabelecimentoId!);
    } catch (err: any) {
      alert('Erro ao processar devolução: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Gestão de Devoluções - Admin</title>
      </Head>

      {/* Header Premium */}
      <header className="bg-white border-b border-gray-200 px-6 py-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => router.back()}
              className="text-blue-600 font-bold mb-2 flex items-center gap-1 hover:underline text-sm"
            >
              ← Voltar ao Painel
            </button>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              📦 Gestão de <span className="text-red-600">Devoluções</span>
            </h1>
            <p className="text-gray-500 font-medium">Pedidos com solicitação de retorno de urgência</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setStatusFiltro('pendentes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFiltro === 'pendentes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pendentes ({pedidosSolicitados.length})
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Buscando solicitações...</p>
          </div>
        ) : pedidosSolicitados.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100 mt-10">
            <span className="text-6xl mb-6 block">✨</span>
            <h2 className="text-2xl font-black text-gray-800 mb-2">Nenhuma devolução pendente</h2>
            <p className="text-gray-500">Tudo em ordem! Não há pedidos aguardando retorno no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 mt-6">
            {pedidosSolicitados.map((pedido) => (
              <div key={pedido.id} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <PedidoCard 
                    pedido={pedido} 
                    mostrarAcoes={true}
                    onProcessarDevolucao={() => handleProcessarDevolucao(pedido.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm">
        Sistema de Entregas - Módulo de Gestão de Crises
      </footer>
    </div>
  );
}
