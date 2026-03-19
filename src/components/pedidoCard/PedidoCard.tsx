'use client';

import { Pedido } from '@/services/api';
import { escolherAppNavegacao } from '@/utils/navegacao';

interface PedidoCardProps {
  pedido: Pedido;
  onAceitar?: () => void;
  onIniciar?: () => void;
  onFinalizar?: () => void;
  mostrarAcoes?: boolean;
}

export default function PedidoCard({
  pedido,
  onAceitar,
  onIniciar,
  onFinalizar,
  mostrarAcoes = false,
}: PedidoCardProps) {
  const statusColors = {
    pendente: 'bg-yellow-100 text-yellow-800',
    aceito: 'bg-blue-100 text-blue-800',
    em_transito: 'bg-purple-100 text-purple-800',
    entregue: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    pendente: '⏳ Pendente',
    aceito: '✅ Aceito',
    em_transito: '🚗 Em trânsito',
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

        <div className="flex items-center gap-2">
          <span className="text-gray-500">🕐</span>
          <p className="text-gray-600 text-sm">
            {new Date(pedido.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {mostrarAcoes && (
        <div className="mt-4 space-y-2">
          {pedido.status === 'pendente' && onAceitar && (
            <button
              onClick={onAceitar}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Aceitar Pedido
            </button>
          )}

          {pedido.status === 'aceito' && onIniciar && (
            <button
              onClick={() => {
                // Chama o app de navegação com o endereço do pedido
                escolherAppNavegacao(pedido.endereco);
                // Chama a função de iniciar entrega
                onIniciar();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              🗺️ Iniciar Entrega
            </button>
          )}

          {pedido.status === 'em_transito' && onFinalizar && (
            <button
              onClick={onFinalizar}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Finalizar Entrega
            </button>
          )}
        </div>
      )}
    </div>
  );
}
