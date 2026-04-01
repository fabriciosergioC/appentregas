import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';
import './login-animations.css';

// Canal de comunicação entre abas
const CHANNEL_NAME = 'app-entrega-channel';
const TAB_ID_KEY = 'tab_id_cliente';

// Gerar ID único para esta aba
const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(7) : 'server';

export default function LoginCliente() {
  const router = useRouter();
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | React.ReactNode>('');
  const [statusSupabase, setStatusSupabase] = useState<'online' | 'offline'>('online');

  // Estado para Recuperação de Senha
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [telefoneRecuperacao, setTelefoneRecuperacao] = useState('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState<1 | 2 | 3>(1);
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [tokenSimuladoParaTeste, setTokenSimuladoParaTeste] = useState('');
  const [nomeParcialCliente, setNomeParcialCliente] = useState('');
  const [loadingRecuperacao, setLoadingRecuperacao] = useState(false);
  const [erroRecuperacao, setErroRecuperacao] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);

  // Registrar esta aba
  useEffect(() => {
    localStorage.setItem(TAB_ID_KEY, TAB_ID);
    
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'LOGIN_REALIZADO_CLIENTE') {
        const tabIdSalvo = localStorage.getItem(TAB_ID_KEY);
        if (tabIdSalvo && tabIdSalvo !== event.data.destinoTabId) {
          window.location.replace('/painel-cliente');
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Verificar Supabase e sessão existente
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    setStatusSupabase(url ? 'online' : 'offline');

    const clienteLogado = localStorage.getItem('cliente_user');
    if (clienteLogado) {
      router.push('/painel-cliente');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (!telefone || !senha) {
      setErro('Por favor, preencha telefone e senha');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Tentando login cliente...', { telefone });

      const res = await api.loginCliente(telefone.replace(/\D/g, ''), senha);

      if (res.error || !res.data) {
        throw new Error((res.error as any)?.message || 'Telefone ou senha inválidos');
      }

      const cliente = res.data;

      console.log('✅ Login cliente realizado:', cliente);

      // Salvar dados no localStorage
      localStorage.setItem('cliente_user', JSON.stringify({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco_padrao: cliente.endereco_padrao
      }));

      // Notificar outras abas
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ 
        type: 'LOGIN_REALIZADO_CLIENTE',
        destinoTabId: TAB_ID 
      });
      channel.close();

      setTimeout(() => {
        router.push('/painel-cliente');
      }, 100);

    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setErro(error.message || 'Erro ao fazer login. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de Recuperação
  const handleSolicitarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);
    setErroRecuperacao('');

    try {
      const telFormatado = telefoneRecuperacao.replace(/\D/g, '');
      const res = await api.solicitarRecuperacaoSenhaCliente(telFormatado);

      if (res.error) throw res.error;

      setTokenSimuladoParaTeste(res.data?.token || '');
      setNomeParcialCliente(res.data?.nomeParcial || '');
      setEtapaRecuperacao(2);
    } catch (err: any) {
      setErroRecuperacao(err.message || 'Erro ao processar solicitação.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleValidarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);
    setErroRecuperacao('');

    try {
      const telFormatado = telefoneRecuperacao.replace(/\D/g, '');
      const res = await api.validarTokenRecuperacaoCliente(telFormatado, tokenDigitado);

      if (res.error) throw res.error;

      setEtapaRecuperacao(3);
    } catch (err: any) {
      setErroRecuperacao(err.message || 'Código inválido ou expirado.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);

    if (novaSenha !== confirmarNovaSenha) {
      setErroRecuperacao('As senhas não coincidem.');
      setLoadingRecuperacao(false);
      return;
    }

    try {
      const telFormatado = telefoneRecuperacao.replace(/\D/g, '');
      const res = await api.redefinirSenhaCliente(telFormatado, tokenDigitado, novaSenha);

      if (res.error) throw res.error;

      alert('✅ Senha alterada com sucesso!');
      setMostrarRecuperacao(false);
      setTelefone(telefoneRecuperacao);
    } catch (err: any) {
      setErroRecuperacao(err.message || 'Erro ao alterar a senha.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Portal do Cliente</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#dc2626" />
      </Head>

      <div className="login-bg">
        <div className="decorative-circle-login decorative-circle-login-1"></div>
        <div className="decorative-circle-login decorative-circle-login-2"></div>
        <div className="decorative-circle-login decorative-circle-login-3"></div>
        
        <div className="login-container">
          <div className="login-card">
            <div className="login-logo-container">
              <div className="login-logo">
                <span className="login-logo-emoji">🛍️</span>
              </div>
              <h1 className="login-title">Portal do Cliente</h1>
              <p className="login-subtitle">Acompanhe seus pedidos e promoções</p>

              <div className="login-status">
                <div className={`status-badge ${statusSupabase === 'online' ? 'online' : 'offline'}`}>
                  <span className={`status-dot ${statusSupabase === 'online' ? 'online' : 'offline'}`}></span>
                  <span>{statusSupabase === 'online' ? '✅ Sistema Online' : '❌ Sistema Offline'}</span>
                </div>
              </div>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              {erro && (
                <div className="error-alert">
                  <span className="font-medium">⚠️ Erro:</span> {erro}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="telefone">Telefone</label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="login-input"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="senha">Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="login-input"
                    placeholder="Sua senha secreta"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="toggle-senha"
                  >
                    {mostrarSenha ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="text-right mt-1">
                <button type="button" onClick={() => setMostrarRecuperacao(true)} className="recuperacao-senha-link">
                  Esqueceu sua senha?
                </button>
              </div>

              <button type="submit" disabled={loading} className="submit-button">
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
                    Entrar no Painel
                  </>
                )}
              </button>

              <div className="login-footer-text">
                <p className="text-gray-600 text-sm">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/cadastro-cliente')}
                    className="login-link"
                  >
                    Cadastre-se Grátis
                  </button>
                </p>
              </div>
            </form>

            <div className="login-security">
              <p className="security-text">🔒 Conexão segura e criptografada</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE RECUPERAÇÃO */}
      {mostrarRecuperacao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => {
                setMostrarRecuperacao(false);
                setEtapaRecuperacao(1);
              }}
              className="modal-close"
            >✕</button>

            <h2 className="modal-title">🔑 Recuperar Acesso</h2>
            <p className="modal-subtitle">
              {etapaRecuperacao === 1 && 'Informe seu telefone cadastrado.'}
              {etapaRecuperacao === 2 && 'Insira o código de 6 dígitos que você recebeu.'}
              {etapaRecuperacao === 3 && 'Defina sua nova senha de acesso.'}
            </p>

            {erroRecuperacao && (
              <div className="error-alert">⚠️ {erroRecuperacao}</div>
            )}

            {etapaRecuperacao === 1 && (
              <form onSubmit={handleSolicitarToken} className="space-y-4">
                <input
                  type="tel"
                  value={telefoneRecuperacao}
                  onChange={(e) => setTelefoneRecuperacao(e.target.value)}
                  className="modal-input"
                  placeholder="Telefone (00) 00000-0000"
                  required
                />
                <button type="submit" disabled={loadingRecuperacao} className="modal-button">
                  {loadingRecuperacao ? 'Enviando...' : 'Receber Código'}
                </button>
              </form>
            )}

            {etapaRecuperacao === 2 && (
              <form onSubmit={handleValidarToken} className="space-y-4">
                {nomeParcialCliente && (
                  <div className="modal-info">
                    <span>👤</span>
                    <div>
                      <p className="text-xs font-semibold">Cliente encontrado:</p>
                      <p className="font-bold">{nomeParcialCliente}</p>
                    </div>
                  </div>
                )}
                {tokenSimuladoParaTeste && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4 text-center">
                    CÓDIGO DE TESTE: <strong>{tokenSimuladoParaTeste}</strong>
                  </div>
                )}
                <input
                  type="text"
                  value={tokenDigitado}
                  onChange={(e) => setTokenDigitado(e.target.value)}
                  className="modal-input text-center text-xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <div className="modal-footer">
                  <button type="button" onClick={() => setEtapaRecuperacao(1)} className="modal-button modal-button-secondary">Voltar</button>
                  <button type="submit" disabled={loadingRecuperacao} className="modal-button">Validar Código</button>
                </div>
              </form>
            )}

            {etapaRecuperacao === 3 && (
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="modal-input"
                  placeholder="Nova senha"
                  required
                />
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                  className="modal-input"
                  placeholder="Confirmar nova senha"
                  required
                />
                <button type="submit" disabled={loadingRecuperacao} className="modal-button">Salvar Nova Senha</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
