import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';
import './login-animations.css';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Canal de comunicação entre abas
const CHANNEL_NAME = 'app-entrega-channel';
const TAB_ID_KEY = 'tab_id_estabelecimento';

// Gerar ID único para esta aba
const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'server';

export default function LoginEstabelecimento() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | React.ReactNode>('');
  const [statusSupabase, setStatusSupabase] = useState<'online' | 'offline'>('online');

  // Registrar esta aba e ouvir eventos de fechamento
  useEffect(() => {
    // Salvar ID desta aba no localStorage
    localStorage.setItem(TAB_ID_KEY, TAB_ID);
    
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'FECHAR_ABA') {
        // Verificar se não é a aba de destino
        const tabIdSalvo = localStorage.getItem(TAB_ID_KEY);
        if (tabIdSalvo && tabIdSalvo !== event.data.destinoTabId) {
          // Tentar fechar
          window.open('', '_self')?.close();
          // Fallback: redirecionar para home
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      }
      
      if (event.data.type === 'LOGIN_REALIZADO') {
        // Fecha esta aba se não for a página de destino
        if (window.location.pathname !== '/estabelecimento') {
          window.open('', '_self')?.close();
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

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

    // Verificar lista de bloqueio de estabelecimentos
    const listaBloqueio = localStorage.getItem('estabelecimentos_bloqueados');
    const estabelecimentosBloqueados = listaBloqueio ? JSON.parse(listaBloqueio) : [];
    const emailNormalizado = email.toLowerCase().trim();
    
    if (estabelecimentosBloqueados.includes(emailNormalizado)) {
      setErro('🚫 Acesso bloqueado.\n\nEste estabelecimento foi bloqueado pelo administrador.\n\nEntre em contato para mais informações.');
      setLoading(false);
      console.log('🚫 Tentativa de login de estabelecimento bloqueado:', email);
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

      // Aguardar próximo tick para garantir que localStorage foi salvo
      setTimeout(() => {
        console.log('🔄 Redirecionando para estabelecimento...');
        
        // Enviar mensagem para outras abas fecharem
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ 
          type: 'LOGIN_REALIZADO',
          destinoTabId: TAB_ID 
        });
        channel.close();
        
        // Salvar ID no localStorage para a próxima página
        localStorage.setItem(TAB_ID_KEY, TAB_ID);
        
        // Usar replace para não acumular histórico
        window.location.replace('/estabelecimento');
      }, 100);
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

      <div className="login-bg">
        {/* Círculos decorativos */}
        <div className="decorative-circle-login decorative-circle-login-1"></div>
        <div className="decorative-circle-login decorative-circle-login-2"></div>
        <div className="decorative-circle-login decorative-circle-login-3"></div>
        
        <div className="login-container">
          <div className="login-card">
            {/* Logo/Ícone */}
            <div className="login-logo-container">
              <div className="login-logo">
                <span className="login-logo-emoji">🏪</span>
              </div>
              <h1 className="login-title">Painel do Estabelecimento</h1>
              <p className="login-subtitle">Faça login para gerenciar seus pedidos</p>

              {/* Status do Supabase */}
              <div className="login-status">
                <div className={`status-badge ${statusSupabase === 'online' ? 'online' : 'offline'}`}>
                  <span className={`status-dot ${statusSupabase === 'online' ? 'online' : 'offline'}`}></span>
                  <span>{statusSupabase === 'online' ? '✅ Online' : '❌ Offline'}</span>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form className="login-form" onSubmit={handleLogin}>
              {erro && (
                <div className="error-alert">
                  <span className="font-medium">⚠️ Erro:</span>{' '}
                  {typeof erro === 'string' ? erro : erro}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="email">
                  Email
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="senha">
                  Senha
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="login-input"
                    placeholder="••••••••"
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

              <button
                type="submit"
                disabled={loading}
                className={`submit-button ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                <span className="submit-button-content">
                  {loading ? (
                    <>
                      <svg className="spinner h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                </span>
              </button>

              <div className="login-footer-text">
                <p className="text-gray-600 text-sm">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(TAB_ID_KEY, TAB_ID);
                      window.location.replace('/cadastro-estabelecimento');
                    }}
                    className="login-link"
                  >
                    Cadastre-se
                  </button>
                </p>
                <p className="login-hint">
                  💡 Use seu email para fazer login
                </p>
              </div>
            </form>

            {/* Rodapé */}
            <div className="login-security">
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
