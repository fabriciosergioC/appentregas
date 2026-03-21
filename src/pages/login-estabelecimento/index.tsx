import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginEstabelecimento() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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

    if (!email || !senha) {
      setErro('Por favor, preencha email e senha');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Tentando login...', { email });

      // Buscar estabelecimento na tabela estabelecimentos
      const { data: estabelecimento, error: buscaErro } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();

      if (buscaErro || !estabelecimento) {
        throw new Error('Email ou senha inválidos');
      }

      // Verificar senha (comparar hash)
      const senhaDecodificada = atob(estabelecimento.senha_hash);
      
      if (senhaDecodificada !== senha) {
        throw new Error('Email ou senha inválidos');
      }

      console.log('✅ Login realizado com sucesso:', estabelecimento);

      // Salvar dados do estabelecimento no localStorage
      localStorage.setItem('estabelecimento_user', JSON.stringify({
        id: estabelecimento.id,
        email: estabelecimento.email,
        nome_estabelecimento: estabelecimento.nome_estabelecimento,
        nome_responsavel: estabelecimento.nome_responsavel,
        telefone: estabelecimento.telefone,
        cnpj: estabelecimento.cnpj,
      }));

      // Salvar nome do estabelecimento separadamente para o painel
      localStorage.setItem('nome_estabelecimento', estabelecimento.nome_estabelecimento);

      console.log('💾 Dados salvos:', { 
        nome_estabelecimento: estabelecimento.nome_estabelecimento,
        email: estabelecimento.email 
      });

      // Redirecionar para página do estabelecimento
      router.push('/estabelecimento');
    } catch (error) {
      console.error('❌ Erro no login:', error);

      let mensagemErro = 'Erro ao fazer login.';

      if (error instanceof Error) {
        if (error.message.includes('Email ou senha inválidos')) {
          mensagemErro = 'Email ou senha inválidos';
        } else {
          mensagemErro = `Erro: ${error.message}`;
        }
      }

      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Estabelecimento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-5xl">🏪</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Painel do Estabelecimento</h1>
            <p className="text-gray-500 mt-2 text-sm">Faça login para gerenciar seus pedidos</p>

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
              <label className="block text-gray-700 font-semibold text-sm" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-gray-50"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-semibold text-sm" htmlFor="senha">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50"
                  placeholder="••••••••"
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

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/cadastro-estabelecimento')}
                  className="text-green-600 hover:text-green-700 font-semibold underline"
                >
                  Cadastre-se
                </button>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                💡 Use seu email para fazer login
              </p>
            </div>

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
              🔒 Seus dados estão seguros e protegidos
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
