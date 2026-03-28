'use client';

import { Pedido } from '@/services/api';
import { escolherAppNavegacao } from '@/utils/navegacao';

interface PedidoCardProps {
  pedido: Pedido;
  entregador?: { nome: string; telefone: string } | null;
  onAceitar?: () => void;
  onRecusar?: () => void;
  onIniciar?: () => void;
  onCheguei?: () => void;
  onFinalizar?: () => void;
  mostrarAcoes?: boolean;
}

export default function PedidoCard({
  pedido,
  entregador,
  onAceitar,
  onRecusar,
  onIniciar,
  onCheguei,
  onFinalizar,
  mostrarAcoes = false,
}: PedidoCardProps) {
  const statusColors = {
    pendente: 'bg-yellow-100 text-yellow-800',
    aceito: 'bg-blue-100 text-blue-800',
    em_transito: 'bg-purple-100 text-purple-800',
    no_local: 'bg-orange-100 text-orange-800',
    entregue: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    pendente: '⏳ Pendente',
    aceito: '✅ Aceito',
    em_transito: '🚗 Em trânsito',
    no_local: '📍 No Local',
    entregue: '📦 Entregue',
  };

  const formatarValor = (valor: number | null | undefined) => {
    if (!valor) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">Pedido #{pedido.id.slice(0, 8)}</h3>
          <p className="text-gray-600">{pedido.cliente}</p>
          {pedido.estabelecimento_nome && (
            <p className="text-gray-500 text-sm">🏪 {pedido.estabelecimento_nome}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusColors[pedido.status]
          }`}
        >
          {statusLabels[pedido.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-gray-500">📍</span>
          <p className="text-gray-700">{pedido.endereco}</p>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-gray-500">📝</span>
          <div>
            <p className="text-gray-500 text-sm">Itens:</p>
            <ul className="text-gray-700 text-sm list-disc list-inside">
              {pedido.itens.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {pedido.forma_pagamento && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500">💳</span>
            <p className="text-gray-700 text-sm font-bold">
              Pagamento: <span className="font-normal text-gray-600">{pedido.forma_pagamento}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-green-50 rounded p-2 border border-green-100">
            <p className="text-xs font-medium text-green-700">💰 Valor:</p>
            <p className="text-sm text-green-900 font-bold">{formatarValor(pedido.valor_pedido)}</p>
          </div>
          <div className="bg-purple-50 rounded p-2 border border-purple-100">
            <p className="text-xs font-medium text-purple-700">🛵 Entregador:</p>
            <p className="text-sm text-purple-900 font-bold">{formatarValor(pedido.valor_entregador)}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded p-2 border border-blue-100 mt-2 flex justify-between items-center">
          <p className="text-xs font-medium text-blue-800 flex items-center gap-1">💵 Subtotal a Receber:</p>
          <p className="text-sm text-blue-900 font-bold">
            {formatarValor((parseFloat(String(pedido.valor_pedido).replace(',', '.')) || 0) + (parseFloat(String(pedido.valor_entregador).replace(',', '.')) || 0))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">🕐</span>
          <p className="text-gray-600 text-sm">
            {new Date(pedido.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Informações do entregador (se houver) */}
        {entregador && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🛵</span>
              <p className="font-bold text-blue-900 text-sm">Entregador:</p>
            </div>
            <p className="text-blue-800 text-sm ml-7">{entregador.nome}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-blue-600">📱</span>
              <a
                href={`tel:${entregador.telefone}`}
                className="text-blue-700 text-sm font-semibold hover:underline"
              >
                {entregador.telefone}
              </a>
            </div>
          </div>
        )}
      </div>

      {mostrarAcoes && (
        <div className="mt-4 space-y-2">
          {pedido.status === 'pendente' && onAceitar && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onRecusar}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ❌ Recusar
              </button>
              <button
                onClick={() => {
                  // Primeiro navega até o endereço do estabelecimento
                  if (pedido.estabelecimento_endereco) {
                    escolherAppNavegacao(pedido.estabelecimento_endereco);
                  } else if (pedido.estabelecimento_nome) {
                    // Se não tem endereço, tenta navegar pelo nome do estabelecimento
                    escolherAppNavegacao(pedido.estabelecimento_nome);
                  }
                  // Depois aceita o pedido
                  onAceitar();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🛵 Aceitar + Ir
              </button>
            </div>
          )}

          {pedido.status === 'aceito' && onIniciar && (
            <>
              {/* Mensagem de status de liberação */}
              {!pedido.liberado_pelo_estabelecimento && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⏳ Aguardando liberação do estabelecimento
                  </p>
                  <p className="text-yellow-600 text-xs mt-1">
                    O estabelecimento precisa liberar o pedido para você iniciar a entrega
                  </p>
                </div>
              )}
              
              <button
                onClick={() => {
                  // Chama o app de navegação com o endereço do pedido (cliente)
                  escolherAppNavegacao(pedido.endereco);
                  // Chama a função de iniciar entrega
                  if (onIniciar) onIniciar();
                }}
                disabled={!pedido.liberado_pelo_estabelecimento}
                className={`w-full font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  pedido.liberado_pelo_estabelecimento
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {pedido.liberado_pelo_estabelecimento ? (
                  <>
                    🗺️ Iniciar Entrega (Cliente)
                  </>
                ) : (
                  <>
                    ⏳ Aguardando Liberação
                  </>
                )}
              </button>
            </>
          )}

          {pedido.status === 'em_transito' && onCheguei && (
            <button
              onClick={onCheguei}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>📍</span> Cheguei no Local
            </button>
          )}

          {(pedido.status === 'em_transito' || pedido.status === 'no_local') && onFinalizar && (
            <button
              onClick={onFinalizar}
              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>✅</span> Finalizar Entrega
            </button>
          )}
        </div>
      )}
    </div>
  );
}
