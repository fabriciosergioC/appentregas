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
  
  // Recuperação de senha
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [telefoneRecuperacao, setTelefoneRecuperacao] = useState('');
  const [tokenRecuperacao, setTokenRecuperacao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState<1 | 2 | 3>(1);
  const [tokenEnviado, setTokenEnviado] = useState('');
  const [nomeParcialEntregador, setNomeParcialEntregador] = useState('');
  const [loadingRecuperacao, setLoadingRecuperacao] = useState(false);

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

  // ============ FUNÇÕES DE RECUPERAÇÃO DE SENHA ============

  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);

    try {
      const resultado = await api.solicitarRecuperacaoSenha(telefoneRecuperacao);

      if (resultado.error) {
        throw new Error('Erro ao solicitar recuperação');
      }

      // Em produção, o token seria enviado por SMS/WhatsApp
      // Aqui mostramos diretamente para teste
      const token = resultado.data?.token || '';
      const nomeParcial = resultado.data?.nomeParcial || '';
      
      setTokenEnviado(token);
      setEtapaRecuperacao(2);

      // Mensagem com confirmação do nome
      const mensagem = nomeParcial
        ? `✅ Código gerado para: ${nomeParcial}\n\nEm produção, este código seria enviado por SMS/WhatsApp.\n\nPara teste, o código é: ${token}`
        : `✅ Código de recuperação gerado!\n\nPara teste, o código é: ${token}`;
      
      alert(mensagem);
      
      // Salvar nome parcial para exibição no modal
      setNomeParcialEntregador(nomeParcial);
    } catch (error) {
      console.error('Erro na recuperação:', error);
      alert('Erro ao solicitar recuperação. Verifique o telefone e tente novamente.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleValidarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);

    try {
      const resultado = await api.validarTokenRecuperacao(telefoneRecuperacao, tokenRecuperacao);

      if (resultado.error) {
        throw new Error('Token inválido ou expirado');
      }

      setEtapaRecuperacao(3);
    } catch (error) {
      console.error('Erro na validação:', error);
      alert('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRecuperacao(true);

    if (novaSenha.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres');
      setLoadingRecuperacao(false);
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      alert('As senhas não coincidem');
      setLoadingRecuperacao(false);
      return;
    }

    try {
      const resultado = await api.redefinirSenha(telefoneRecuperacao, tokenRecuperacao, novaSenha);

      if (resultado.error) {
        throw new Error('Erro ao redefinir senha');
      }

      alert('✅ Senha redefinida com sucesso!\n\nAgora você pode fazer login com sua nova senha.');
      setMostrarRecuperacao(false);
      setEtapaRecuperacao(1);
      setTelefoneRecuperacao('');
      setTokenRecuperacao('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      alert('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoadingRecuperacao(false);
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

              {/* Link de Recuperação de Senha */}
              <div className="text-right mb-4">
                <button
                  type="button"
                  onClick={() => setMostrarRecuperacao(true)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium underline"
                >
                  🔑 Esqueci minha senha
                </button>
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

      {/* Modal de Recuperação de Senha */}
      {mostrarRecuperacao && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setMostrarRecuperacao(false);
                setEtapaRecuperacao(1);
                setTelefoneRecuperacao('');
                setTokenRecuperacao('');
                setNovaSenha('');
                setConfirmarNovaSenha('');
                setNomeParcialEntregador('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔑 Recuperação de Senha</h2>
            <p className="text-gray-600 text-sm mb-6">
              {etapaRecuperacao === 1 && 'Digite seu telefone para receber o código de recuperação'}
              {etapaRecuperacao === 2 && 'Digite o código recebido para continuar'}
              {etapaRecuperacao === 3 && 'Crie uma nova senha para sua conta'}
            </p>

            {/* Etapa 1: Solicitar código */}
            {etapaRecuperacao === 1 && (
              <form onSubmit={handleSolicitarRecuperacao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📱 Telefone
                  </label>
                  <input
                    type="tel"
                    value={telefoneRecuperacao}
                    onChange={(e) => setTelefoneRecuperacao(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRecuperacao || !telefoneRecuperacao}
                  className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-all ${
                    loadingRecuperacao || !telefoneRecuperacao
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  }`}
                >
                  {loadingRecuperacao ? '⏳ Enviando...' : '📱 Enviar Código'}
                </button>
              </form>
            )}

            {/* Etapa 2: Validar código */}
            {etapaRecuperacao === 2 && (
              <form onSubmit={handleValidarToken} className="space-y-4">
                {/* Confirmação do Nome */}
                {nomeParcialEntregador && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">Entregador encontrado:</p>
                        <p className="text-lg font-bold text-green-900">{nomeParcialEntregador}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Código de Recuperação
                  </label>
                  <input
                    type="text"
                    value={tokenRecuperacao}
                    onChange={(e) => setTokenRecuperacao(e.target.value)}
                    placeholder="Digite o código recebido"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                  {tokenEnviado && (
                    <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
                      💡 Código para teste: <strong>{tokenEnviado}</strong>
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEtapaRecuperacao(1)}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
                  >
                    ⬅️ Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loadingRecuperacao || !tokenRecuperacao}
                    className={`flex-1 py-3 rounded-xl font-bold text-white text-lg transition-all ${
                      loadingRecuperacao || !tokenRecuperacao
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
                    }`}
                  >
                    {loadingRecuperacao ? '⏳ Validando...' : '✅ Validar'}
                  </button>
                </div>
              </form>
            )}

            {/* Etapa 3: Redefinir senha */}
            {etapaRecuperacao === 3 && (
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔒 Nova Senha
                  </label>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    minLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔒 Confirmar Senha
                  </label>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    minLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRecuperacao || !novaSenha || !confirmarNovaSenha}
                  className={`w-full py-3 rounded-xl font-bold text-white text-lg transition-all ${
                    loadingRecuperacao || !novaSenha || !confirmarNovaSenha
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
                  }`}
                >
                  {loadingRecuperacao ? '⏳ Salvando...' : '💾 Salvar Nova Senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
