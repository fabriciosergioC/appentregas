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

  // Estado para Recuperação de Senha
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState<1 | 2>(1);
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [tokenSimuladoParaTeste, setTokenSimuladoParaTeste] = useState('');
  const [loadingRecuperacao, setLoadingRecuperacao] = useState(false);
  const [erroRecuperacao, setErroRecuperacao] = useState('');
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

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

  const handleSolicitarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);
    setErroRecuperacao('');
    setSucessoRecuperacao('');

    if (!emailRecuperacao) {
      setErroRecuperacao('Por favor, digite seu email');
      setLoadingRecuperacao(false);
      return;
    }

    try {
      const { data: est, error } = await supabase
        .from('estabelecimentos')
        .select('id')
        .eq('email', emailRecuperacao.toLowerCase())
        .eq('ativo', true)
        .single();

      if (error || !est) {
        throw new Error('Email não encontrado ou conta inativa.');
      }

      const tokenGerado = Math.floor(100000 + Math.random() * 900000).toString();
      
      const expiracao = new Date();
      expiracao.setHours(expiracao.getHours() + 1);

      const { error: updateError } = await supabase
        .from('estabelecimentos')
        .update({
          token_recuperacao: tokenGerado,
          token_expiracao: expiracao.toISOString()
        })
        .eq('id', est.id);

      if (updateError) throw updateError;

      setTokenSimuladoParaTeste(tokenGerado);
      setSucessoRecuperacao('Um código de verificação foi gerado!');
      setTimeout(() => setSucessoRecuperacao(''), 3000);
      setEtapaRecuperacao(2);

    } catch (err: any) {
      console.error(err);
      setErroRecuperacao(err.message || 'Erro ao processar solicitação.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);
    setErroRecuperacao('');

    if (!tokenDigitado || !novaSenha) {
      setErroRecuperacao('Preencha o código e a nova senha.');
      setLoadingRecuperacao(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErroRecuperacao('A nova senha deve ter no mínimo 6 caracteres.');
      setLoadingRecuperacao(false);
      return;
    }

    try {
      const { data: est, error } = await supabase
        .from('estabelecimentos')
        .select('id, token_expiracao, token_recuperacao')
        .eq('email', emailRecuperacao.toLowerCase())
        .single();

      if (error || !est) throw new Error('Credenciais inválidas.');

      if (est.token_recuperacao !== tokenDigitado) {
        throw new Error('Código de verificação incorreto.');
      }

      if (est.token_expiracao && new Date(est.token_expiracao) < new Date()) {
        throw new Error('Código expirado. Solicite um novo.');
      }

      const senhaHash = btoa(novaSenha);

      const { error: updateError } = await supabase
        .from('estabelecimentos')
        .update({
          senha_hash: senhaHash,
          token_recuperacao: null,
          token_expiracao: null
        })
        .eq('id', est.id);

      if (updateError) throw updateError;

      setSucessoRecuperacao('Senha alterada com sucesso!');
      
      setTimeout(() => {
        setMostrarRecuperacao(false);
        setEtapaRecuperacao(1);
        setTokenDigitado('');
        setNovaSenha('');
        setSucessoRecuperacao('');
        setEmail(emailRecuperacao);
        setTokenSimuladoParaTeste('');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErroRecuperacao(err.message || 'Erro ao alterar a senha.');
    } finally {
      setLoadingRecuperacao(false);
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
                <div className="text-right mt-2">
                  <button type="button" onClick={() => setMostrarRecuperacao(true)} className="recuperacao-senha-link">
                    Esqueceu sua senha?
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

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      {mostrarRecuperacao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => {
                setMostrarRecuperacao(false);
                setEtapaRecuperacao(1);
                setTokenSimuladoParaTeste('');
                setErroRecuperacao('');
                setSucessoRecuperacao('');
              }}
              className="modal-close"
            >
              ✕
            </button>

            <h2 className="modal-title">Recuperação de Senha</h2>
            <p className="modal-subtitle">
              {etapaRecuperacao === 1
                ? 'Informe seu email cadastrado para receber o código de acesso.'
                : 'Insira o código gerado e a sua nova senha segura.'}
            </p>

            {erroRecuperacao && (
              <div className="error-alert">
                <span className="font-medium">⚠️</span> {erroRecuperacao}
              </div>
            )}

            {sucessoRecuperacao && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded shadow-sm text-sm">
                <span className="font-medium">✅</span> {sucessoRecuperacao}
              </div>
            )}

            {etapaRecuperacao === 1 ? (
              <form onSubmit={handleSolicitarToken} className="space-y-4">
                <div>
                  <label className="input-label block mb-1">Email</label>
                  <input
                    type="email"
                    value={emailRecuperacao}
                    onChange={(e) => setEmailRecuperacao(e.target.value)}
                    className="modal-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingRecuperacao}
                  className="modal-button"
                >
                  {loadingRecuperacao ? 'Aguarde...' : 'Enviar Código'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                {tokenSimuladoParaTeste && (
                  <div className="modal-info">
                    <span className="modal-info-icon">📲</span>
                    <div className="modal-info-text">
                      <p className="modal-info-title">MODO DE TESTE ATIVO</p>
                      <p className="modal-info-value">{tokenSimuladoParaTeste}</p>
                      <p className="text-xs text-green-700 mt-1">Copie o código acima</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="input-label block mb-1">Código numérico (6 dígitos)</label>
                  <input
                    type="text"
                    value={tokenDigitado}
                    onChange={(e) => setTokenDigitado(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    className="modal-input text-center text-xl font-bold tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                
                <div style={{ position: 'relative' }}>
                  <label className="input-label block mb-1">Nova Senha</label>
                  <input
                    type={mostrarNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="modal-input"
                    placeholder="Mínimo 6 caracteres"
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="toggle-senha"
                    style={{ position: 'absolute', right: '1rem', top: '2.5rem' }}
                  >
                    {mostrarNovaSenha ? '👁️' : '🙈'}
                  </button>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setEtapaRecuperacao(1);
                      setTokenSimuladoParaTeste('');
                    }}
                    className="modal-button modal-button-secondary"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingRecuperacao}
                    className="modal-button"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}
                  >
                    {loadingRecuperacao ? 'Salvando...' : 'Redefinir Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
