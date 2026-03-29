'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useCarrinho } from '@/contexts/CarrinhoContext';

interface Estabelecimento {
  id: string;
  nome_estabelecimento: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  cnpj?: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  imagem_url?: string;
  disponivel: boolean;
}

interface EstabelecimentoCardProps {
  estabelecimento: Estabelecimento;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function EstabelecimentoCard({ estabelecimento }: EstabelecimentoCardProps) {
  const router = useRouter();
  const { adicionarItem, itens, estabelecimentoId, limparCarrinho } = useCarrinho();
  const [mostrarContato, setMostrarContato] = useState(false);
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');

  // Verificar se há itens no carrinho deste estabelecimento
  const itensNoCarrinho = estabelecimentoId === estabelecimento.id
    ? itens.filter(item => item.estabelecimento_id === estabelecimento.id).length
    : 0;

  // Carregar produtos do estabelecimento
  useEffect(() => {
    if (mostrarProdutos) {
      carregarProdutos();
    }
  }, [mostrarProdutos]);

  const carregarProdutos = async () => {
    try {
      setLoadingProdutos(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('estabelecimento_id', estabelecimento.id)
        .eq('disponivel', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

      if (data) {
        setProdutos(data);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Extrair categorias únicas
  const categorias = Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean))).sort() as string[];

  // Filtrar produtos por categoria
  const produtosFiltrados = filtroCategoria
    ? produtos.filter(p => p.categoria === filtroCategoria)
    : produtos;

  const handleWhatsApp = () => {
    if (!estabelecimento.telefone) return;
    
    const telefoneLimpo = estabelecimento.telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Gostaria de fazer um pedido no ${estabelecimento.nome_estabelecimento}.`
    );
    
    window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagem}`, '_blank');
  };

  const handleEmail = () => {
    const assunto = encodeURIComponent(`Pedido - ${estabelecimento.nome_estabelecimento}`);
    const corpo = encodeURIComponent(
      `Olá! Gostaria de fazer um pedido.\n\nAguardo informações sobre o cardápio e valores.`
    );
    
    window.open(`mailto:${estabelecimento.email}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  const handleTelefone = () => {
    window.location.href = `tel:${estabelecimento.telefone}`;
  };

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    // Verificar se já há itens de outro estabelecimento no carrinho
    if (estabelecimentoId && estabelecimentoId !== estabelecimento.id) {
      if (confirm('Seu carrinho contém itens de outro estabelecimento. Deseja limpar o carrinho e continuar?')) {
        limparCarrinho();
        adicionarItem(produto);
      }
      return;
    }

    adicionarItem(produto);
    alert(`✅ ${produto.nome} adicionado ao carrinho!`);
  };

  const handleIrAoCarrinho = () => {
    router.push('/painel-cliente/carrinho');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      {/* Cabeçalho do Card */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-3xl">🏪</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-xl text-gray-800 mb-1">
            {estabelecimento.nome_estabelecimento}
          </h3>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <span>👤</span>
            {estabelecimento.nome_responsavel}
          </p>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">📧</span>
          <span className="truncate">{estabelecimento.email}</span>
        </div>

        {estabelecimento.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">📞</span>
            <span>{estabelecimento.telefone}</span>
          </div>
        )}

        {estabelecimento.cnpj && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-lg">📄</span>
            <span>CNPJ: {estabelecimento.cnpj}</span>
          </div>
        )}
      </div>

      {/* Botão de Contato */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMostrarContato(!mostrarContato)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>📞</span>
          {mostrarContato ? 'Ocultar Contatos' : 'Ver Contatos'}
        </button>

        <button
          onClick={() => setMostrarProdutos(!mostrarProdutos)}
          className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>🛍️</span>
          {mostrarProdutos ? 'Ocultar Produtos' : 'Ver Produtos'}
        </button>
      </div>

      {/* Botão Ir ao Carrinho */}
      {itensNoCarrinho > 0 && (
        <button
          onClick={handleIrAoCarrinho}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <span>🛒</span>
          Ver Carrinho ({itensNoCarrinho} {itensNoCarrinho === 1 ? 'item' : 'itens'})
        </button>
      )}

      {/* Opções de Contato */}
      {mostrarContato && estabelecimento.telefone && (
        <div className="mt-4 space-y-2 animate-fadeIn">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 text-center">
              ENTRE EM CONTATO
            </p>

            <div className="grid grid-cols-3 gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
              >
                <span className="text-lg">💬</span>
                <span>WhatsApp</span>
              </button>

              {/* Telefone */}
              <button
                onClick={handleTelefone}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
              >
                <span className="text-lg">📱</span>
                <span>Ligar</span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 text-xs"
              >
                <span className="text-lg">✉️</span>
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      {mostrarProdutos && (
        <div className="mt-4 animate-fadeIn">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 text-center">
              PRODUTOS DISPONÍVEIS
            </p>

            {loadingProdutos ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-gray-50 rounded animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : produtos.length > 0 ? (
              <>
                {/* Filtro de Categorias */}
                {categorias.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => setFiltroCategoria('')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          filtroCategoria === ''
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📋 Todos
                      </button>
                      {categorias.map((categoria) => (
                        <button
                          key={categoria}
                          onClick={() => setFiltroCategoria(categoria)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filtroCategoria === categoria
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          🏷️ {categoria}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Produtos */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex gap-3 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      {produto.imagem_url ? (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm truncate">{produto.nome}</h4>
                          {produto.descricao && (
                            <p className="text-xs text-gray-500 truncate">{produto.descricao}</p>
                          )}
                          {produto.categoria && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              🏷️ {produto.categoria}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-green-600 font-bold text-sm">
                            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <button
                            onClick={() => handleAdicionarAoCarrinho(produto)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg text-xs transition-colors flex items-center gap-1"
                          >
                            <span>➕</span>
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mensagem se não houver produtos na categoria */}
                {produtosFiltrados.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    <span className="text-4xl block mb-2">🔍</span>
                    Nenhum produto nesta categoria
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                <span className="text-4xl block mb-2">📦</span>
                Nenhum produto cadastrado ainda
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          ID: {estabelecimento.id.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}
