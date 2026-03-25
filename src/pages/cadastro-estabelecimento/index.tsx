import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';

// Cliente Supabase
const supabaseUrl = 'https://lhvfjaimrsrbvketayck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodmZqYWltcnNyYnZrZXRheWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzE2NjIsImV4cCI6MjA4OTMwNzY2Mn0.Y394p7pCANhbBeJNHmkUDBsbDZFOWSohF0Z9_7Xf11I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CadastroEstabelecimento() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [cnpjFormatado, setCnpjFormatado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Formatar telefone enquanto digita
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length >= 10) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    } else if (valor.length > 6) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 6)}-${valor.slice(6)}`;
    } else if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    } else if (valor.length > 0) {
      valor = `(${valor}`;
    }

    setTelefoneFormatado(valor);
    setTelefone(valor.replace(/\D/g, ''));
  };

  // Formatar CNPJ enquanto digita
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 14) valor = valor.slice(0, 14);

    if (valor.length > 12) {
      valor = `${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8, 12)}-${valor.slice(12)}`;
    } else if (valor.length > 8) {
      valor = `${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8)}`;
    } else if (valor.length > 5) {
      valor = `${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5)}`;
    } else if (valor.length > 2) {
      valor = `${valor.slice(0, 2)}.${valor.slice(2)}`;
    }

    setCnpjFormatado(valor);
    setCnpj(valor.replace(/\D/g, ''));
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    // Validações
    if (!nome || !email || !senha || !nomeEstabelecimento || !telefone) {
      setErro('Por favor, preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    // Validar email
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      setErro('Por favor, informe um email válido');
      setLoading(false);
      return;
    }

    // Validar telefone (10 ou 11 dígitos)
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
      setErro('Por favor, informe um telefone válido (com DDD)');
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Criando conta...', { email, nomeEstabelecimento });

      // Verificar se já existe cadastro
      const { data: existente, error: buscaErro } = await supabase
        .from('estabelecimentos')
        .select('id, ativo')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (buscaErro) {
        console.error('Erro ao buscar estabelecimento:', buscaErro);
      }

      if (existente) {
        if (!existente.ativo) {
          throw new Error('Este email já está cadastrado mas não foi confirmado.');
        }
        throw new Error('Este email já está cadastrado e confirmado.');
      }

      // Hash da senha
      const senhaHash = btoa(senha);

      console.log('📡 Tentando insert no Supabase...', {
        url: supabaseUrl,
        temChave: !!supabaseAnonKey
      });

      // Inserir na tabela estabelecimentos
      const { data: estabelecimento, error: insertError } = await supabase
        .from('estabelecimentos')
        .insert([
          {
            email: email.toLowerCase(),
            senha_hash: senhaHash,
            nome_estabelecimento: nomeEstabelecimento,
            nome_responsavel: nome,
            telefone: telefone,
            cnpj: cnpj || null,
            ativo: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro detalhado:', insertError);
        if (insertError.code === '23505') {
          throw new Error('Este email já está cadastrado');
        }
        throw new Error(`Erro ao criar conta: ${insertError.message}`);
      }

      console.log('✅ Estabelecimento criado com sucesso:', estabelecimento);

      setSucesso('✅ Cadastro realizado com sucesso! Redirecionando para login...');

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login-estabelecimento');
      }, 2000);

    } catch (error) {
      console.error('❌ Erro no cadastro:', error);

      let mensagemErro = 'Erro ao criar conta.';

      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          mensagemErro = 'Este email já está cadastrado';
        } else if (error.message.includes('Invalid email')) {
          mensagemErro = 'Email inválido';
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
        <title>Cadastro - Estabelecimento</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-5xl">🏪</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Cadastrar Estabelecimento</h1>
            <p className="text-gray-500 mt-2 text-sm">Crie sua conta para gerenciar pedidos</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleCadastro} className="space-y-4">
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

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="nomeEstabelecimento">
                Nome do Estabelecimento *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🏪</span>
                <input
                  id="nomeEstabelecimento"
                  type="text"
                  value={nomeEstabelecimento}
                  onChange={(e) => setNomeEstabelecimento(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Ex: Pizzaria do João"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="nome">
                Seu Nome *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">👤</span>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="email">
                Email *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="telefone">
                Telefone / WhatsApp (com DDD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📱</span>
                <input
                  id="telefone"
                  type="tel"
                  value={telefoneFormatado}
                  onChange={handleTelefoneChange}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="cnpj">
                CNPJ (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🏢</span>
                <input
                  id="cnpj"
                  type="text"
                  value={cnpjFormatado}
                  onChange={handleCnpjChange}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="00.000.000/0000-00"
                  maxLength={19}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="senha">
                Senha *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔒</span>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="confirmarSenha">
                Confirmar Senha *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔒</span>
                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-500 font-medium"
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!sucesso}
              className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${
                loading || sucesso
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
                  Criando conta...
                </>
              ) : sucesso ? (
                <>
                  <span>✅</span>
                  Cadastro Realizado!
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Cadastrar
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login-estabelecimento')}
                  className="text-green-600 hover:text-green-700 font-semibold underline"
                >
                  Fazer Login
                </button>
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
