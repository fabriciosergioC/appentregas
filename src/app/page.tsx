import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Ícone/Logo */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-5xl">🏪</span>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-white mb-2">
          App Estabelecimento
        </h1>
        <p className="text-blue-100 text-lg mb-8">
          Gerencie seus pedidos e entregas com facilidade
        </p>

        {/* Botão de Ação */}
        <div className="space-y-3">
          <Link
            href="/login-estabelecimento"
            className="inline-block w-full bg-white text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-blue-50 transition-colors text-lg text-center"
          >
            🏪 Sou Estabelecimento
          </Link>
        </div>

        {/* Rodapé */}
        <p className="text-blue-200 text-sm mt-8 opacity-75 text-center">
          Acesse seu painel administrativo para gerenciar a loja
        </p>
      </div>
    </div>
  );
}
