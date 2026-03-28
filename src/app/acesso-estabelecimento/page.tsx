import Link from 'next/link';
import '../animations-global.css';

export default function AcessoEstabelecimento() {
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
            <span className="logo-emoji">🏪</span>
          </div>

          {/* Título */}
          <h1 className="page-title-white">
            App Estabelecimento
          </h1>
          <p className="page-subtitle-white">
            Gerencie seus pedidos e entregas com facilidade
          </p>

          {/* Botão de Ação */}
          <div className="space-y-3">
            <Link
              href="/login-estabelecimento"
              className="btn-animated btn-white"
            >
              <span className="btn-content">
                <span>🏪</span>
                <span>Sou Estabelecimento</span>
              </span>
            </Link>
          </div>

          {/* Rodapé */}
          <p className="page-subtitle-white" style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
            Acesse seu painel administrativo para gerenciar a loja
          </p>
        </div>
      </div>
    </div>
  );
}
