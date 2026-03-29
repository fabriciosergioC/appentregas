import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';
import './cadastro-estabelecimento.css';

// Cliente Supabase
const supabaseUrl = 'https://lhvfjaimrsrbvketayck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodmZqYWltcnNyYnZrZXRheWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzE2NjIsImV4cCI6MjA4OTMwNzY2Mn0.Y394p7pCANhbBeJNHmkUDBsbDZFOWSohF0Z9_7Xf11I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Canal de comunicação entre abas
const CHANNEL_NAME = 'app-entrega-channel';
const TAB_ID_KEY = 'tab_id_estabelecimento';

// Gerar ID único para esta aba
const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'server';

export default function CadastroEstabelecimento() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [cnpjFormatado, setCnpjFormatado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Registrar esta aba e ouvir eventos de fechamento
  useEffect(() => {
    localStorage.setItem(TAB_ID_KEY, TAB_ID);

    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data.type === 'LOGIN_REALIZADO' || event.data.type === 'FECHAR_ABA') {
        if (window.location.pathname !== '/login-estabelecimento' &&
            window.location.pathname !== '/estabelecimento') {
          window.open('', '_self')?.close();
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

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

    if (!nome || !email || !senha || !nomeEstabelecimento || !telefone) {
      setErro('Por favor, preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      setErro('Por favor, informe um email válido');
      setLoading(false);
      return;
    }

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

      const senhaHash = btoa(senha);

      console.log('📡 Tentando insert no Supabase...', {
        url: supabaseUrl,
        temChave: !!supabaseAnonKey
      });

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

      setTimeout(() => {
        localStorage.setItem(TAB_ID_KEY, TAB_ID);
        window.location.replace('/login-estabelecimento');
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

      <div className="cadastro-estabelecimento-bg">
        <div className="cadastro-circle cadastro-circle-1"></div>
        <div className="cadastro-circle cadastro-circle-2"></div>
        <div className="cadastro-circle cadastro-circle-3"></div>

        <div className="cadastro-container">
          <div className="cadastro-card">
            <div className="cadastro-logo-container">
              <div className="cadastro-logo">
                <span className="cadastro-logo-emoji">🏪</span>
              </div>
              <h1 className="cadastro-title">Cadastrar Estabelecimento</h1>
              <p className="cadastro-subtitle">Crie sua conta para gerenciar pedidos</p>
            </div>

            <form onSubmit={handleCadastro} className="cadastro-form">
              {erro && (
                <div className="cadastro-alert cadastro-alert-error">
                  <span className="font-medium">⚠️ Erro:</span> {erro}
                </div>
              )}

              {sucesso && (
                <div className="cadastro-alert cadastro-alert-success">
                  <span className="font-medium">✅ Sucesso:</span> {sucesso}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="nomeEstabelecimento">
                  Nome do Estabelecimento *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🏪</span>
                  <input
                    id="nomeEstabelecimento"
                    type="text"
                    value={nomeEstabelecimento}
                    onChange={(e) => setNomeEstabelecimento(e.target.value)}
                    className="cadastro-input"
                    placeholder="Ex: Pizzaria do João"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="nome">
                  Seu Nome *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="cadastro-input"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="email">
                  Email *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="cadastro-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="telefone">
                  Telefone / WhatsApp (com DDD) *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefoneFormatado}
                    onChange={handleTelefoneChange}
                    className="cadastro-input"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="cnpj">
                  CNPJ (opcional)
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🏢</span>
                  <input
                    id="cnpj"
                    type="text"
                    value={cnpjFormatado}
                    onChange={handleCnpjChange}
                    className="cadastro-input"
                    placeholder="00.000.000/0000-00"
                    maxLength={19}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="senha">
                  Senha *
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="cadastro-input"
                    placeholder="Mínimo 6 caracteres"
                    style={{ paddingRight: '2.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="toggle-senha"
                    title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                  >
                    {mostrarSenha ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirmarSenha">
                  Confirmar Senha *
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmarSenha"
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="cadastro-input"
                    placeholder="Repita a senha"
                    style={{ paddingRight: '2.75rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="toggle-senha"
                    title={mostrarConfirmarSenha ? "Ocultar senha" : "Ver senha"}
                  >
                    {mostrarConfirmarSenha ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!sucesso}
                className={`cadastro-button ${loading || sucesso ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="cadastro-button-content">
                  {loading ? (
                    <>
                      <svg className="spinner h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                </span>
              </button>

              <div className="cadastro-footer-text">
                <p className="text-gray-600 text-sm">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(TAB_ID_KEY, TAB_ID);
                      window.location.replace('/login-estabelecimento');
                    }}
                    className="cadastro-link"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>


            </form>

            <div className="cadastro-security">
              <p className="security-text">
                🔒 Seus dados estão seguros e protegidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
