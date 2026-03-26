import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminBloqueio() {
  const router = useRouter();
  const [entregadoresBloqueados, setEntregadoresBloqueados] = useState<string[]>([]);
  const [novoEntregador, setNovoEntregador] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Senha administrativa (pode ser alterada aqui)
  const SENHA_ADMIN = 'admin123';

  useEffect(() => {
    // Carregar lista de bloqueio
    const lista = localStorage.getItem('entregadores_bloqueados');
    if (lista) {
      setEntregadoresBloqueados(JSON.parse(lista));
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
    if (!novoEntregador.trim()) {
      setErro('Digite o nome do entregador');
      return;
    }

    const nomeNormalizado = novoEntregador.toLowerCase().trim();
    
    if (entregadoresBloqueados.includes(nomeNormalizado)) {
      setErro('Este entregador já está bloqueado');
      return;
    }

    const novaLista = [...entregadoresBloqueados, nomeNormalizado];
    setEntregadoresBloqueados(novaLista);
    localStorage.setItem('entregadores_bloqueados', JSON.stringify(novaLista));
    
    setNovoEntregador('');
    setSucesso(`✅ ${novoEntregador} foi bloqueado com sucesso!`);
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleDesbloquear = (nome: string) => {
    const novaLista = entregadoresBloqueados.filter(e => e !== nome);
    setEntregadoresBloqueados(novaLista);
    localStorage.setItem('entregadores_bloqueados', JSON.stringify(novaLista));
    
    setSucesso(`✅ ${nome} foi desbloqueado com sucesso!`);
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleLimparLista = () => {
    if (confirm('Tem certeza que deseja limpar toda a lista de bloqueio?')) {
      setEntregadoresBloqueados([]);
      localStorage.removeItem('entregadores_bloqueados');
      setSucesso('✅ Lista de bloqueio limpa!');
      setTimeout(() => setSucesso(''), 3000);
    }
  };

  if (!autenticado) {
    return (
      <>
        <Head>
          <title>Admin - Bloqueio de Entregadores</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-orange-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-5xl">🔒</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Área Administrativa</h1>
              <p className="text-gray-500 mt-2 text-sm">Bloqueio de Entregadores</p>
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {erro && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm">
                  ⚠️ {erro}
                </div>
              )}

              <button
                onClick={handleAutenticar}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
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
        <header className="bg-red-600 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">🔒 Bloqueio de Entregadores</h1>
              <p className="text-xs text-red-200">Painel Administrativo</p>
            </div>
            <button
              onClick={() => router.push('/estabelecimento')}
              className="bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">🚫 Bloquear Novo Entregador</h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={novoEntregador}
                onChange={(e) => setNovoEntregador(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBloquear()}
                placeholder="Nome do entregador"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={handleBloquear}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Bloquear
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ℹ️ O entregador bloqueado não conseguirá mais fazer login no sistema.
            </p>
          </div>

          {/* Lista de bloqueados */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                📋 Entregadores Bloqueados ({entregadoresBloqueados.length})
              </h2>
              {entregadoresBloqueados.length > 0 && (
                <button
                  onClick={handleLimparLista}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  🗑️ Limpar Lista
                </button>
              )}
            </div>

            {entregadoresBloqueados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-6xl">✅</span>
                <p className="mt-2">Nenhum entregador bloqueado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entregadoresBloqueados.map((entregador) => (
                  <div
                    key={entregador}
                    className="flex justify-between items-center bg-red-50 border border-red-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚫</span>
                      <span className="font-medium text-gray-800 capitalize">{entregador}</span>
                    </div>
                    <button
                      onClick={() => handleDesbloquear(entregador)}
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
