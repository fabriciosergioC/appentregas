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
  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [email, setEmail] = useState('');
  const [tempoRestante, setTempoRestante] = useState(300); // 5 minutos

  // Pegar email dos parâmetros
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setErro('Email não informado. Redirecionando...');
      setTimeout(() => router.push('/cadastro-estabelecimento'), 3000);
    }
  }, [searchParams, router]);

  // Timer de expiração
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatar tempo restante
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${minutos}:${secs.toString().padStart(2, '0')}`;
  };

  // Lidar com mudança de código
  const handleCodigoChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const novoCodigo = [...codigo];
    novoCodigo[index] = value;
    setCodigo(novoCodigo);

    // Pular para próximo campo automaticamente
    if (value && index < 5) {
      const nextInput = document.getElementById(`codigo-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Lidar com backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      const prevInput = document.getElementById(`codigo-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Colar código
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (/^\d+$/.test(pastedData)) {
      const novoCodigo = [...codigo];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        novoCodigo[i] = pastedData[i];
      }
      setCodigo(novoCodigo);
      
      // Focar no último campo preenchido
      const lastIndex = Math.min(pastedData.length, 5);
      const lastInput = document.getElementById(`codigo-${lastIndex}`);
      lastInput?.focus();
    }
  };

  // Verificar código
  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    const codigoCompleto = codigo.join('');

    if (codigoCompleto.length !== 6) {
      setErro('Por favor, digite o código completo de 6 dígitos');
      setLoading(false);
      return;
    }

    try {
      // Buscar código salvo no localStorage
      const codigoSalvo = localStorage.getItem('codigo_verificacao_' + email.toLowerCase());
      
      if (!codigoSalvo) {
        throw new Error('Código não encontrado. Faça o cadastro novamente.');
      }

      if (codigoSalvo !== codigoCompleto) {
        throw new Error('Código inválido. Verifique e tente novamente.');
      }

      // Código correto - ativar estabelecimento
      const { error: updateError } = await supabase
        .from('estabelecimentos')
        .update({ ativo: true })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Erro ao ativar estabelecimento:', updateError);
        throw new Error('Erro ao confirmar cadastro. Tente novamente.');
      }

      // Limpar código do localStorage
      localStorage.removeItem('codigo_verificacao_' + email.toLowerCase());
      localStorage.removeItem('email_verificacao');

      setSucesso('✅ Email confirmado com sucesso! Redirecionando...');

      // Aguardar 2 segundos e redirecionar para login
      setTimeout(() => {
        router.push('/login-estabelecimento');
      }, 2000);

    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleReenviar = async () => {
    if (tempoRestante > 0) return;

    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      // Gerar novo código
      const novoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salvar novo código no localStorage
      localStorage.setItem('codigo_verificacao_' + email.toLowerCase(), novoCodigo);
      
      // Mostrar código no console
      console.log('📧 NOVO CÓDIGO DE VERIFICAÇÃO:', novoCodigo);
      
      setSucesso('✅ Novo código gerado! Verifique o console (F12)');
      setTempoRestante(300); // Resetar timer

    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      setErro('Erro ao reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirmar Cadastro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-5xl">📧</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Confirmar Cadastro</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Digite o código enviado para seu email
            </p>
            {email && (
              <p className="text-green-600 font-medium mt-1">
                {email}
              </p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              tempoRestante > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="text-2xl">⏱️</span>
              <span className="font-bold">{formatarTempo(tempoRestante)}</span>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleVerificar} className="space-y-6">
            {erro && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm">
                <span className="font-medium">⚠️ Erro:</span> {erro}
              </div>
            )}

            {sucesso && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg text-sm">
                <span className="font-medium">✅ Sucesso:</span> {sucesso}
              </div>
            )}

            {/* Campos do Código */}
            <div className="flex justify-center gap-2">
              {codigo.map((digito, index) => (
                <input
                  key={index}
                  id={`codigo-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digito}
                  onChange={(e) => handleCodigoChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none bg-white"
                  disabled={loading || !!sucesso}
                />
              ))}
            </div>

            {/* Botão Verificar */}
            <button
              type="submit"
              disabled={loading || codigo.join('').length !== 6 || !!sucesso}
              className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || codigo.join('').length !== 6 || !!sucesso
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
                  Verificando...
                </>
              ) : sucesso ? (
                <>
                  <span>✅</span>
                  Confirmado!
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Verificar Código
                </>
              )}
            </button>

            {/* Reenviar Código */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Não recebeu o código?</p>
              <button
                type="button"
                onClick={handleReenviar}
                disabled={loading || tempoRestante > 0 || !!sucesso}
                className={`text-sm font-semibold underline ${
                  tempoRestante > 0 || !!sucesso
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                {tempoRestante > 0 
                  ? `Reenviar em ${formatarTempo(tempoRestante)}`
                  : '📤 Reenviar Código'
                }
              </button>
            </div>

            {/* Voltar */}
            <button
              type="button"
              onClick={() => router.push('/cadastro-estabelecimento')}
              className="w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
            >
              ← Voltar
            </button>
          </form>

          {/* Instruções */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>💡 Dica:</strong> O código de verificação foi enviado para seu email. 
              Verifique também a caixa de spam. O código expira em 5 minutos.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
