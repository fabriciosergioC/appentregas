'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import EstabelecimentoCard from '@/components/estabelecimentoCard/EstabelecimentoCard';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 p-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">📦</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Acompanhe seu Pedido
          </h1>
          <p className="text-green-100 text-lg mb-6">
            Digite o ID do pedido ou escolha um estabelecimento
          </p>

          {/* Busca de Estabelecimentos */}
          <div className="max-w-md mx-auto mb-4">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="🔍 Buscar estabelecimento..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-800"
            />
          </div>
        </div>

        {/* Lista de Estabelecimentos */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              🏪 Estabelecimentos Cadastrados
            </h2>
            <span className="text-green-100 text-sm">
              {estabelecimentosFiltrados.length} encontrado(s)
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
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
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <span className="text-6xl mb-4 block">😕</span>
              <p className="text-white text-lg">
                {filtro 
                  ? `Nenhum estabelecimento encontrado para "${filtro}"`
                  : 'Nenhum estabelecimento cadastrado ainda'}
              </p>
            </div>
          )}
        </div>

        {/* Rastrear Pedido */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🚀 Rastrear Pedido Existente
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pedidoId" className="block text-sm font-medium text-gray-700 mb-2">
                ID do Pedido
              </label>
              <input
                type="text"
                id="pedidoId"
                value={pedidoId}
                onChange={(e) => {
                  setPedidoId(e.target.value);
                  setErro('');
                }}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-800 font-mono"
              />
              {erro && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {erro}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-colors text-lg"
            >
              🚀 Rastrear Pedido
            </button>
          </form>

          {/* Informações */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">📍 Onde encontrar o ID do pedido?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>No comprovante enviado pelo estabelecimento (apenas o código UUID)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>No WhatsApp ou SMS recebido do estabelecimento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Pergunte ao atendente do estabelecimento</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h3 className="text-white font-bold mb-4 text-center">O que você pode acompanhar:</h3>
          <div className="space-y-3 text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span className="text-left">Localização do entregador em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <span className="text-left">Status atualizado do seu pedido</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛵</span>
              <span className="text-left">Dados do entregador responsável</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <span className="text-left">Detalhes completos do pedido</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
