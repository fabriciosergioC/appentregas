'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  imagem_url?: string;
  disponivel: boolean;
  estabelecimento_id: string;
}

interface ItemCarrinho extends Produto {
  quantidade: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  estabelecimentoId: string | null;
  estabelecimentoNome: string | null;
  adicionarItem: (produto: Produto) => void;
  removerItem: (produtoId: string) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  totalCarrinho: number;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null);
  const [estabelecimentoNome, setEstabelecimentoNome] = useState<string | null>(null);

  // Carregar carrinho do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const carrinhoSalvo = localStorage.getItem('carrinho');
      const estabIdSalvo = localStorage.getItem('carrinho_estabelecimento_id');
      const estabNomeSalvo = localStorage.getItem('carrinho_estabelecimento_nome');

      if (carrinhoSalvo) {
        setItens(JSON.parse(carrinhoSalvo));
      }
      if (estabIdSalvo) {
        setEstabelecimentoId(estabIdSalvo);
      }
      if (estabNomeSalvo) {
        setEstabelecimentoNome(estabNomeSalvo);
      }
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carrinho', JSON.stringify(itens));
      localStorage.setItem('carrinho_estabelecimento_id', estabelecimentoId || '');
      localStorage.setItem('carrinho_estabelecimento_nome', estabelecimentoNome || '');
    }
  }, [itens, estabelecimentoId, estabelecimentoNome]);

  const adicionarItem = (produto: Produto) => {
    setItens((itensAnteriores) => {
      // Verificar se o produto já está no carrinho
      const itemExistente = itensAnteriores.find((item) => item.id === produto.id);

      if (itemExistente) {
        // Aumentar quantidade
        return itensAnteriores.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        // Adicionar novo item
        return [...itensAnteriores, { ...produto, quantidade: 1 }];
      }
    });

    // Salvar informações do estabelecimento
    if (!estabelecimentoId) {
      setEstabelecimentoId(produto.estabelecimento_id);
    }
  };

  const removerItem = (produtoId: string) => {
    setItens((itensAnteriores) => itensAnteriores.filter((item) => item.id !== produtoId));
  };

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(produtoId);
      return;
    }

    setItens((itensAnteriores) =>
      itensAnteriores.map((item) =>
        item.id === produtoId ? { ...item, quantidade } : item
      )
    );
  };

  const limparCarrinho = () => {
    setItens([]);
    setEstabelecimentoId(null);
    setEstabelecimentoNome(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('carrinho');
      localStorage.removeItem('carrinho_estabelecimento_id');
      localStorage.removeItem('carrinho_estabelecimento_nome');
    }
  };

  const totalCarrinho = itens.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        estabelecimentoId,
        estabelecimentoNome,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        totalCarrinho,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (context === undefined) {
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider');
  }
  return context;
}
