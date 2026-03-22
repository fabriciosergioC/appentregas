'use client';

import Link from 'next/link';

export default function AcessoCliente() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Ícone/Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-5xl">🛍️</span>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Portal do Cliente
        </h1>
        <p className="text-green-100 text-lg mb-8">
          Acompanhe seus pedidos e faça novas compras
        </p>

        {/* Único Botão de Ação */}
        <div className="space-y-3">
          <Link
            href="/painel-cliente"
            className="inline-block w-full bg-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-purple-700 transition-colors text-lg"
          >
            👤 Sou Cliente
          </Link>
        </div>

        {/* Rodapé */}
        <p className="text-green-200 text-sm mt-8 opacity-75">
          Clique no botão acima para acessar seu painel
        </p>
      </div>
    </div>
  );
}
