import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="space-y-4 text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <span className="text-left">Receba pedidos disponíveis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span className="text-left">Acompanhe com GPS em tempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <span className="text-left">Gerencie suas entregas</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="inline-block w-full bg-white text-green-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-50 transition-colors text-lg"
          >
            🛵 Sou Entregador
          </Link>

          <Link
            href="/estabelecimento"
            className="inline-block w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-lg"
          >
            🏪 Sou Estabelecimento
          </Link>
        </div>

        {/* Rodapé */}
        <p className="text-green-200 text-sm mt-8">
          Compartilhe sua localização para receber pedidos próximos
        </p>
      </div>
    </div>
  );
}
