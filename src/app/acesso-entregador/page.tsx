import Link from 'next/link';

export default function AcessoEntregador() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Ícone/Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-5xl">🛵</span>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-white mb-2">
          App do Entregador
        </h1>
        <p className="text-green-100 text-lg mb-8">
          Receba e acompanhe suas entregas em tempo real
        </p>

        {/* Funcionalidades */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 text-left">
          <div className="space-y-4 text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <span>Receba pedidos disponíveis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>Acompanhe com GPS em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span>Gerencie suas entregas</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="inline-block w-full bg-white text-green-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-50 transition-colors text-lg text-center"
          >
            🛵 Sou Entregador
          </Link>
        </div>

        {/* Rodapé */}
        <p className="text-green-200 text-sm mt-8 opacity-75 text-center">
          Compartilhe sua localização para receber pedidos próximos
        </p>
      </div>
    </div>
  );
}
