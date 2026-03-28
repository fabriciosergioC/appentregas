import Link from 'next/link';
import '../animations-global.css';

export default function AcessoEntregador() {
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
            <span className="logo-emoji">🛵</span>
          </div>

          {/* Título */}
          <h1 className="page-title-white">
            App do Entregador
          </h1>
          <p className="page-subtitle-white">
            Receba e acompanhe suas entregas em tempo real
          </p>

          {/* Funcionalidades */}
          <div className="content-card">
            <div className="space-y-4">
              <div className="content-list-item">
                <span className="content-list-icon">📦</span>
                <span>Receba pedidos disponíveis</span>
              </div>
              <div className="content-list-item">
                <span className="content-list-icon">🗺️</span>
                <span>Acompanhe com GPS em tempo real</span>
              </div>
              <div className="content-list-item">
                <span className="content-list-icon">✅</span>
                <span>Gerencie suas entregas</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="btn-animated btn-white"
            >
              <span className="btn-content">
                <span>🛵</span>
                <span>Sou Entregador</span>
              </span>
            </Link>
          </div>

          {/* Rodapé */}
          <p className="page-subtitle-white" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
            Compartilhe sua localização para receber pedidos próximos
          </p>
        </div>
      </div>
    </div>
  );
}
