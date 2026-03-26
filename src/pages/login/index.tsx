import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';

export default function Login() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [statusSupabase, setStatusSupabase] = useState<'online' | 'offline'>('online');

  // Verificar se Supabase está configurado
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
      setStatusSupabase('online');
    } else {
      setStatusSupabase('offline');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    // Validações
    if (!nome || !senha) {
      setErro('Por favor, preencha nome e senha');
      setLoading(false);
      return;
    }

    // Validar senha (mínimo 4 caracteres)
    if (senha.length < 4) {
      setErro('Por favor, informe uma senha com pelo menos 4 caracteres');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Tentando login...', { nome, senha: '***' });

      const entregador = await api.loginEntregador(nome, '', senha);

      console.log('✅ Login realizado com sucesso:', entregador);

      // Salvar dados do entregador no localStorage
      const dadosEntregador = entregador.data || entregador;
      localStorage.setItem('entregador', JSON.stringify(dadosEntregador));

      console.log('💾 Entregador salvo no localStorage:', dadosEntregador);
      console.log('📷 Foto URL:', dadosEntregador.foto_url);
      console.log('🏍️ Placa:', dadosEntregador.placa_moto);

      // Redirecionar para página de pedidos
      router.push('/pedidos');
    } catch (error) {
      console.error('❌ Erro no login:', error);

      let mensagemErro = 'Erro ao fazer login.';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        mensagemErro = '❌ Não foi possível conectar ao Supabase.\n\nVerifique:\n1. Sua conexão com a internet\n2. As variáveis de ambiente estão configuradas';
      } else if (error instanceof Error) {
        mensagemErro = `Erro: ${error.message}`;
      }

      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - App do Entregador</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-5xl">🛵</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">App do Entregador</h1>
            <p className="text-gray-500 mt-2 text-sm">Faça login para começar a receber pedidos</p>

            {/* Status do Supabase */}
            <div className="mt-3">
              <div className="flex items-center justify-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  statusSupabase === 'online' ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                <span className={`text-xs font-medium ${
                  statusSupabase === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusSupabase === 'online' ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            {erro && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm">
                <span className="font-medium">⚠️ Erro:</span> {erro}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="nome">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">👤</span>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-300 placeholder:font-normal font-black"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="senha">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔒</span>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-300 placeholder:font-normal font-black"
                  placeholder="Digite sua senha"
                  minLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 text-xl"
                  title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {mostrarSenha ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Entrar
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/cadastro-entregador')}
                  className="text-green-600 hover:text-green-700 font-semibold underline"
                >
                  Cadastrar Entregador
                </button>
              </p>
            </div>
          </form>

          {/* Rodapé */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-xs">
              🔒 Ao entrar, você concorda em compartilhar sua localização
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
