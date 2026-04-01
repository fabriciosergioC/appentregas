import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api } from '@/services/api';
import '@/app/globals.css';
import '../login-cliente/login-animations.css';

export default function CadastroCliente() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const telFormatado = telefone.replace(/\D/g, '');
      const res = await api.cadastrarCliente(nome, telFormatado, senha, email);

      if (res.error) throw res.error;

      alert('✅ Cadastro realizado com sucesso! Faça login para continuar.');
      router.push('/login-cliente');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setErro(err.message || 'Erro ao realizar cadastro. Telefone já pode estar em uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cadastro - Portal do Cliente</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#dc2626" />
      </Head>

      <div className="login-bg">
        <div className="decorative-circle-login decorative-circle-login-1"></div>
        <div className="decorative-circle-login decorative-circle-login-2"></div>
        
        <div className="login-container">
          <div className="login-card">
            <div className="login-logo-container">
              <div className="login-logo">
                <span className="login-logo-emoji">👋</span>
              </div>
              <h1 className="login-title">Crie sua Conta</h1>
              <p className="login-subtitle">Rápido, fácil e grátis!</p>
            </div>

            <form className="login-form" onSubmit={handleCadastro}>
              {erro && (
                <div className="error-alert">
                  <span className="font-medium">⚠️</span> {erro}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Nome Completo</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="login-input"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Telefone (WhatsApp)</label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input
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
                <label className="input-label">Email (Opcional)</label>
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="login-input"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Confirmar Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon">🛡️</span>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="login-input"
                    placeholder="Repita sua senha"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Cadastrando...' : '🚀 Criar Minha Conta'}
              </button>

              <div className="login-footer-text">
                <p className="text-gray-600 text-sm">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login-cliente')}
                    className="login-link"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
