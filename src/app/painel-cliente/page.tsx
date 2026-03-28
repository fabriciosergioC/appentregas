'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import EstabelecimentoCard from '@/components/estabelecimentoCard/EstabelecimentoCard';
import '../animations-global.css';

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
    <div className="bg-animated-red">
      {/* Círculos decorativos */}
      <div className="decorative-circle decorative-circle-1"></div>
      <div className="decorative-circle decorative-circle-2"></div>
      <div className="decorative-circle decorative-circle-3"></div>

      <div className="page-container-centered max-w-7xl w-full mx-auto px-4">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="logo-animated logo-red mb-6">
              <span className="logo-emoji">📦</span>
            </div>

            <h1 className="page-title-white">
              Acompanhe seu Pedido
            </h1>
            <p className="page-subtitle-white">
              Digite o ID do pedido ou escolha um estabelecimento
            </p>

            {/* Busca de Estabelecimentos */}
            <div className="max-w-md mx-auto mb-4 mt-6">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="🔍 Buscar estabelecimento..."
                  className="animated-input animated-input-red w-full"
                />
                <span className="input-icon">🔍</span>
              </div>
            </div>
          </div>

          {/* Lista de Estabelecimentos */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="page-title-white" style={{ fontSize: '1.5rem', textAlign: 'left' }}>
                🏪 Estabelecimentos Cadastrados
              </h2>
              <span className="page-subtitle-white" style={{ margin: 0 }}>
                {estabelecimentosFiltrados.length} encontrado(s)
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card-animated card-animated-red animate-pulse">
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
              <div className="card-animated card-animated-red text-center">
                <span className="text-6xl mb-4 block">😕</span>
                <p className="page-subtitle-white">
                  {filtro
                    ? `Nenhum estabelecimento encontrado para "${filtro}"`
                    : 'Nenhum estabelecimento cadastrado ainda'}
                </p>
              </div>
            )}
          </div>

          {/* Rastrear Pedido */}
          <div className="card-animated card-animated-red mb-8">
            <h3 className="page-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              🚀 Rastrear Pedido Existente
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="input-group">
                <label htmlFor="pedidoId" className="input-label">
                  ID do Pedido
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="pedidoId"
                    value={pedidoId}
                    onChange={(e) => {
                      setPedidoId(e.target.value);
                      setErro('');
                    }}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="animated-input animated-input-red font-mono"
                  />
                  <span className="input-icon">📦</span>
                </div>
                {erro && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {erro}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-animated btn-red"
              >
                <span className="btn-content">
                  <span>🚀</span>
                  <span>Rastrear Pedido</span>
                </span>
              </button>
            </form>

            {/* Informações */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="input-label mb-3">📍 Onde encontrar o ID do pedido?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>No comprovante enviado pelo estabelecimento (apenas o código UUID)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>No WhatsApp ou SMS recebido do estabelecimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✓</span>
                  <span>Pergunte ao atendente do estabelecimento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Funcionalidades */}
          <div className="card-animated card-animated-red mb-8">
            <h3 className="page-subtitle-white" style={{ marginBottom: '1rem', textAlign: 'center' }}>O que você pode acompanhar:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗺️</span>
                <span className="page-subtitle-white" style={{ margin: 0, textAlign: 'left' }}>Localização do entregador em tempo real</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <span className="page-subtitle-white" style={{ margin: 0, textAlign: 'left' }}>Status atualizado do seu pedido</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛵</span>
                <span className="page-subtitle-white" style={{ margin: 0, textAlign: 'left' }}>Dados do entregador responsável</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <span className="page-subtitle-white" style={{ margin: 0, textAlign: 'left' }}>Detalhes completos do pedido</span>
              </div>
            </div>
          </div>

      </div>
    </div>
  );
}
