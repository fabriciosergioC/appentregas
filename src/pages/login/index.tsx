import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';

export default function Login() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
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

  // Formatar telefone enquanto digita
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 10) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
    } else if (valor.length > 6) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}-${valor.slice(6)}`;
    } else if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    } else if (valor.length > 0) {
      valor = `(${valor}`;
    }

    setTelefoneFormatado(valor);
    setTelefone(valor.replace(/\D/g, ''));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (telefone.replace(/\D/g, '').length < 10) {
      setErro('Por favor, informe um telefone válido');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Tentando login...', { nome, telefone });

      const entregador = await api.loginEntregador(nome, telefone);

      console.log('✅ Login realizado com sucesso:', entregador);

      // Salvar dados do entregador no localStorage
      const dadosEntregador = entregador.data || entregador;
      localStorage.setItem('entregador', JSON.stringify(dadosEntregador));

      console.log('💾 Entregador salvo no localStorage:', dadosEntregador);

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
              <label className="block text-gray-700 font-semibold text-sm" htmlFor="nome">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-gray-50"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-semibold text-sm" htmlFor="telefone">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📱</span>
                <input
                  id="telefone"
                  type="tel"
                  value={telefoneFormatado}
                  onChange={handleTelefoneChange}
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-gray-50"
                  placeholder="(00) 00000-0000"
                  required
                />
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

            <button
              type="button"
              onClick={() => router.push('/')}
              className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white`}
            >
              ← Voltar
            </button>
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
