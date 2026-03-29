import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';
import '../login-estabelecimento/login-animations.css';

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

    // Verificar lista de bloqueio
    const listaBloqueio = localStorage.getItem('entregadores_bloqueados');
    const entregadoresBloqueados = listaBloqueio ? JSON.parse(listaBloqueio) : [];
    
    if (entregadoresBloqueados.includes(nome.toLowerCase().trim())) {
      setErro('🚫 Acesso bloqueado.\n\nEste usuário foi bloqueado pelo administrador.\n\nEntre em contato para mais informações.');
      setLoading(false);
      console.log('🚫 Tentativa de login de usuário bloqueado:', nome);
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

      // Limpar pedidos recusados ao logar novamente
      localStorage.removeItem('pedidos_recusados');

      // Redirecionar para página de pedidos, fechando janela atual se foi aberta por script
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          router.push('/pedidos');
        }
      }, 100);
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
                <span className="login-logo-emoji">🛵</span>
              </div>
              <h1 className="login-title">App do Entregador</h1>
              <p className="login-subtitle">Faça login para começar a receber pedidos</p>

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
                  <span className="font-medium">⚠️ Erro:</span> {erro}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="nome">
                  Nome Completo
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="login-input"
                    placeholder="Digite seu nome completo"
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
                    placeholder="Digite sua senha"
                    minLength={4}
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
                      window.location.replace('/cadastro-entregador');
                    }}
                    className="login-link"
                  >
                    Cadastrar Entregador
                  </button>
                </p>
              </div>
            </form>

            {/* Rodapé */}
            <div className="login-security">
              <p className="security-text">
                🔒 Ao entrar, você concorda em compartilhar sua localização
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
