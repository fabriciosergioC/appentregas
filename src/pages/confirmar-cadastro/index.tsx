'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ConfirmarCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  // Pegar email e token dos parâmetros e confirmar automaticamente
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    const tokenParam = searchParams?.get('token');
    
    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
      confirmarCadastro(tokenParam, emailParam);
    } else {
      setErro('Link inválido. Redirecionando...');
      setTimeout(() => router.push('/cadastro-estabelecimento'), 3000);
    }
  }, [searchParams, router]);

  const confirmarCadastro = async (tokenParam: string, emailParam: string) => {
    setLoading(true);
    
    try {
      // Buscar estabelecimento pelo email
      const { data: estabelecimento, error: buscaErro } = await supabase
        .from('estabelecimentos')
        .select('id, ativo')
        .eq('email', emailParam.toLowerCase())
        .single();

      if (buscaErro || !estabelecimento) {
        setErro('❌ Cadastro não encontrado. Faça um novo cadastro.');
        setLoading(false);
        return;
      }

      if (estabelecimento.ativo) {
        setSucesso('✅ Cadastro já está confirmado! Redirecionando para login...');
        setTimeout(() => router.push('/login-estabelecimento'), 3000);
        return;
      }

      // Ativar estabelecimento
      const { error: updateErro } = await supabase
        .from('estabelecimentos')
        .update({ ativo: true })
        .eq('id', estabelecimento.id);

      if (updateErro) {
        setErro('❌ Erro ao confirmar cadastro. Tente novamente.');
        setLoading(false);
        return;
      }

      // Marcar magic link como usado (se existir)
      try {
        await supabase
          .from('magic_links')
          .update({ usado: true, usado_em: new Date().toISOString() })
          .eq('token', tokenParam)
          .eq('email', emailParam);
      } catch (err) {
        // Ignora se tabela não existir
      }

      setSucesso('✅ Cadastro confirmado com sucesso! Redirecionando para login...');
      setTimeout(() => router.push('/login-estabelecimento'), 3000);

    } catch (error) {
      console.error('Erro ao confirmar cadastro:', error);
      setErro('Erro ao confirmar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirmar Cadastro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {loading ? (
                <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : sucesso ? (
                <span className="text-5xl">✅</span>
              ) : (
                <span className="text-5xl">❌</span>
              )}
            </div>
            
            {loading ? (
              <>
                <h1 className="text-3xl font-bold text-gray-800">Confirmando Cadastro</h1>
                <p className="text-gray-500 mt-2 text-sm">Aguarde um momento...</p>
              </>
            ) : sucesso ? (
              <>
                <h1 className="text-3xl font-bold text-gray-800">Cadastro Confirmado!</h1>
                <p className="text-gray-500 mt-2 text-sm">Seu cadastro foi confirmado com sucesso.</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-800">Ops! Algo deu errado</h1>
                <p className="text-gray-500 mt-2 text-sm">Não foi possível confirmar seu cadastro.</p>
              </>
            )}
          </div>

          {/* Mensagens */}
          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm mb-4">
              <span className="font-medium">⚠️ Erro:</span> {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg text-sm mb-4">
              <span className="font-medium">✅ Sucesso:</span> {sucesso}
            </div>
          )}

          {/* Botão Voltar */}
          {!loading && (
            <button
              onClick={() => router.push('/login-estabelecimento')}
              className="w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
            >
              <span>←</span>
              Ir para Login
            </button>
          )}

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
