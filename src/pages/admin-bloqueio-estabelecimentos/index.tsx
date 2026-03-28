import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminBloqueioEstabelecimentos() {
  const router = useRouter();
  const [estabelecimentosBloqueados, setEstabelecimentosBloqueados] = useState<string[]>([]);
  const [novoEstabelecimento, setNovoEstabelecimento] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Senha administrativa (pode ser alterada aqui)
  const SENHA_ADMIN = 'admin123';

  useEffect(() => {
    // Carregar lista de bloqueio
    const lista = localStorage.getItem('estabelecimentos_bloqueados');
    if (lista) {
      setEstabelecimentosBloqueados(JSON.parse(lista));
    }
  }, []);

  const handleAutenticar = () => {
    if (senhaAdmin === SENHA_ADMIN) {
      setAutenticado(true);
      setErro('');
    } else {
      setErro('Senha incorreta');
    }
  };

  const handleBloquear = () => {
    if (!novoEstabelecimento.trim()) {
      setErro('Digite o email do estabelecimento');
      return;
    }

    const emailNormalizado = novoEstabelecimento.toLowerCase().trim();
    
    if (estabelecimentosBloqueados.includes(emailNormalizado)) {
      setErro('Este estabelecimento já está bloqueado');
      return;
    }

    const novaLista = [...estabelecimentosBloqueados, emailNormalizado];
    setEstabelecimentosBloqueados(novaLista);
    localStorage.setItem('estabelecimentos_bloqueados', JSON.stringify(novaLista));
    
    setNovoEstabelecimento('');
    setSucesso(`✅ ${novoEstabelecimento} foi bloqueado com sucesso!`);
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleDesbloquear = (email: string) => {
    const novaLista = estabelecimentosBloqueados.filter(e => e !== email);
    setEstabelecimentosBloqueados(novaLista);
    localStorage.setItem('estabelecimentos_bloqueados', JSON.stringify(novaLista));
    
    setSucesso(`✅ ${email} foi desbloqueado com sucesso!`);
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleLimparLista = () => {
    if (confirm('Tem certeza que deseja limpar toda a lista de bloqueio?')) {
      setEstabelecimentosBloqueados([]);
      localStorage.removeItem('estabelecimentos_bloqueados');
      setSucesso('✅ Lista de bloqueio limpa!');
      setTimeout(() => setSucesso(''), 3000);
    }
  };

  if (!autenticado) {
    return (
      <>
        <Head>
          <title>Admin - Bloqueio de Estabelecimentos</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-5xl">🔒</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Área Administrativa</h1>
              <p className="text-gray-500 mt-2 text-sm">Bloqueio de Estabelecimentos</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Administrativa
                </label>
                <input
                  type="password"
                  value={senhaAdmin}
                  onChange={(e) => setSenhaAdmin(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAutenticar()}
                  placeholder="Digite a senha"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {erro && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm">
                  ⚠️ {erro}
                </div>
              )}

              <button
                onClick={handleAutenticar}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                🔐 Acessar Sistema
              </button>

              <button
                onClick={() => router.push('/estabelecimento')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-xl transition-colors"
              >
                ← Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Gerenciar Bloqueios</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🏪 Bloqueio de Estabelecimentos</h1>
              <p className="text-xs text-blue-200">Painel Administrativo</p>
            </div>
            <button
              onClick={() => router.push('/estabelecimento')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              ← Voltar
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4">
          {sucesso && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg text-sm mb-4">
              {sucesso}
            </div>
          )}

          {/* Adicionar novo bloqueio */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🚫 Bloquear Novo Estabelecimento</h2>
            
            <div className="flex gap-2">
              <input
                type="email"
                value={novoEstabelecimento}
                onChange={(e) => setNovoEstabelecimento(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBloquear()}
                placeholder="Email do estabelecimento"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleBloquear}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Bloquear
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ℹ️ O estabelecimento bloqueado não conseguirá mais fazer login no sistema.
            </p>
          </div>

          {/* Lista de bloqueados */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                📋 Estabelecimentos Bloqueados ({estabelecimentosBloqueados.length})
              </h2>
              {estabelecimentosBloqueados.length > 0 && (
                <button
                  onClick={handleLimparLista}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  🗑️ Limpar Lista
                </button>
              )}
            </div>

            {estabelecimentosBloqueados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-6xl">✅</span>
                <p className="mt-2">Nenhum estabelecimento bloqueado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {estabelecimentosBloqueados.map((estabelecimento) => (
                  <div
                    key={estabelecimento}
                    className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚫</span>
                      <span className="font-medium text-gray-800">{estabelecimento}</span>
                    </div>
                    <button
                      onClick={() => handleDesbloquear(estabelecimento)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      ✅ Desbloquear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
