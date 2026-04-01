'use client';

import Link from 'next/link';
import '../animations-global.css';

export default function AcessoCliente() {
  return (
    <div className="bg-animated-red">
      {/* Círculos decorativos */}
      <div className="decorative-circle decorative-circle-1"></div>
      <div className="decorative-circle decorative-circle-2"></div>
      <div className="decorative-circle decorative-circle-3"></div>

      <div className="page-container-centered">
        <div className="text-center max-w-md w-full">
          {/* Ícone/Logo */}
          <div className="logo-animated logo-red">
            <span className="logo-emoji">🛍️</span>
          </div>

          {/* Título */}
          <h1 className="page-title-white">
            Portal do Cliente
          </h1>
          <p className="page-subtitle-white">
            Acompanhe seus pedidos e faça novas compras
          </p>

          {/* Único Botão de Ação */}
          <div className="space-y-3">
            <Link
              href="/login-cliente"
              className="btn-animated btn-white"
            >
              <span className="btn-content">
                <span>👤</span>
                <span>Sou Cliente</span>
              </span>
            </Link>
          </div>

          {/* Rodapé */}
          <p className="page-subtitle-white" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
            Clique no botão acima para acessar seu painel
          </p>
        </div>
      </div>
    </div>
  );
}
