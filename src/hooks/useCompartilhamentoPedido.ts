'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para compartilhar link de rastreamento do pedido
 */
export function useCompartilhamentoPedido(pedidoId: string | null) {
  const [copiado, setCopiado] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    if (pedidoId) {
      setLink(`${window.location.origin}/painel-cliente/${pedidoId}`);
    }
  }, [pedidoId]);

  const copiarLink = async () => {
    if (!link) return;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      return true;
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      return false;
    }
  };

  const compartilhar = async () => {
    if (!link) return;

    const shareData = {
      title: 'Acompanhar Pedido',
      text: 'Acompanhe meu pedido em tempo real!',
      url: link,
    };

    // Verificar se o navegador suporta Web Share API
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        // Fallback para copiar
        return await copiarLink();
      }
    } else {
      // Fallback para copiar
      return await copiarLink();
    }
  };

  return {
    link,
    copiado,
    copiarLink,
    compartilhar,
  };
}
