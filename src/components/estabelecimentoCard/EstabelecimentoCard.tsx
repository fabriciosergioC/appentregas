'use client';

import { useState } from 'react';

interface Estabelecimento {
  id: string;
  nome_estabelecimento: string;
  nome_responsavel: string;
  email: string;
  telefone: string;
  cnpj?: string;
}

interface EstabelecimentoCardProps {
  estabelecimento: Estabelecimento;
}

export default function EstabelecimentoCard({ estabelecimento }: EstabelecimentoCardProps) {
  const [mostrarContato, setMostrarContato] = useState(false);

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
      <button
        onClick={() => setMostrarContato(!mostrarContato)}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>📞</span>
        {mostrarContato ? 'Ocultar Contatos' : 'Ver Contatos'}
      </button>

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

      {/* Rodapé */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          ID: {estabelecimento.id.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}
