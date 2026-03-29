import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';
import '../login-estabelecimento/login-animations.css';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CadastroEntregador() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [placa, setPlaca] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
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

  // Formatar placa da moto (padrão Mercosul)
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.toUpperCase();
    
    // Remover caracteres inválidos
    valor = valor.replace(/[^A-Z0-9]/g, '');
    
    // Limitar a 7 caracteres
    if (valor.length > 7) valor = valor.slice(0, 7);
    
    // Formatar no padrão ABC1D23 ou ABC-1234
    if (valor.length > 3) {
      valor = `${valor.slice(0, 3)}${valor.length > 4 ? '-' : ''}${valor.slice(3)}`;
    }
    
    setPlaca(valor);
  };

  // Manipular upload de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    
    if (arquivo) {
      // Validar tipo do arquivo
      if (!arquivo.type.startsWith('image/')) {
        setErro('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (arquivo.size > 5 * 1024 * 1024) {
        setErro('A foto deve ter no máximo 5MB');
        return;
      }
      
      setFotoPerfil(arquivo);
      setErro('');
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(arquivo);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    console.log('🔍 Verificando foto antes de validar:');
    console.log('  - fotoPerfil:', fotoPerfil ? `SIM (${fotoPerfil.name}, ${fotoPerfil.size} bytes)` : 'NÃO');
    console.log('  - fotoPreview:', fotoPreview ? `SIM (${fotoPreview.length} bytes)` : 'NÃO');

    // Validações
    if (!nome || !telefone || !senha) {
      setErro('Por favor, preencha todos os campos obrigatórios');
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

    // Validar senha
    if (senha.length < 4) {
      setErro('A senha deve ter pelo menos 4 caracteres');
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Criando conta de entregador...', { nome, telefone, placa });

      // Verificar se já existe entregador com este telefone
      const { data: existente } = await supabase
        .from('entregadores')
        .select('id')
        .eq('telefone', telefone)
        .maybeSingle();

      if (existente) {
        throw new Error('Este telefone já está cadastrado');
      }

      // Hash da senha
      const senhaHash = btoa(senha);

      // Processar foto (se houver)
      let fotoUrl = null;
      if (fotoPerfil) {
        console.log('📷 Processando foto:', fotoPerfil.name, fotoPerfil.size, 'bytes');
        
        // Converter para base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fotoPerfil);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        fotoUrl = base64;
        console.log('✅ Foto base64 gerada, tamanho:', fotoUrl.length, 'bytes');
      }

      console.log('📝 Inserindo entregador:', {
        nome,
        telefone,
        placa_moto: placa || null,
        tem_foto: !!fotoUrl,
        foto_length: fotoUrl?.length || 0,
      });

      // Criar entregador
      const insertData = {
        nome,
        telefone,
        senha_hash: senhaHash,
        disponivel: true,
        placa_moto: placa || null,
        foto_url: fotoUrl,
      };

      console.log('📦 Dados do insert:', insertData);

      const { data: entregador, error: insertError } = await supabase
        .from('entregadores')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro no insert:', insertError);
        console.error('📋 Detalhes:', insertError.details);
        console.error('📝 Hint:', insertError.hint);
        throw new Error('Erro ao criar conta: ' + insertError.message);
      }

      console.log('✅ Entregador criado:', entregador);
      console.log('📷 Foto salva:', entregador.foto_url ? `SIM (${entregador.foto_url.length} bytes)` : 'NÃO');

      setSucesso('✅ Cadastro realizado com sucesso! Redirecionando para login...');

      // Redirecionar para login após 2 segundos, fechando janela atual se foi aberta por script
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          router.push('/login');
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Erro no cadastro:', error);

      let mensagemErro = 'Erro ao criar conta.';

      if (error instanceof Error) {
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
        <title>Cadastro - Entregador</title>
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
              <h1 className="login-title">Cadastro de Entregador</h1>
              <p className="login-subtitle">Cadastre-se para começar a receber pedidos</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleCadastro} className="login-form">
              {erro && (
                <div className="alert-success" style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeftColor: '#ef4444', color: '#b91c1c' }}>
                  <span className="font-medium">⚠️ Erro:</span> {erro}
                </div>
              )}

              {sucesso && (
                <div className="alert-success">
                  <span className="font-medium">✅ Sucesso:</span> {sucesso}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" htmlFor="nome">
                  Nome Completo *
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
                    className="login-input"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
                <p className="login-hint" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                  📞 Seu telefone será exibido no painel de pedidos
                </p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="senha">
                  Senha *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="login-input"
                    placeholder="Mínimo 4 caracteres"
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

              <div className="input-group">
                <label className="input-label" htmlFor="confirmarSenha">
                  Confirmar Senha *
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmarSenha"
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="login-input"
                    placeholder="Repita a senha"
                    minLength={4}
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

              {/* Upload de Foto */}
              <div className="input-group">
                <label className="input-label" htmlFor="foto">
                  Foto de Perfil (opcional)
                </label>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="upload-preview"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoPerfil(null);
                          setFotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
                        title="Remover foto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                      <span className="text-4xl text-gray-400">👤</span>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="upload-area">
                      <span className="text-2xl">📷</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG (máx. 5MB)
                      </p>
                    </div>
                    <input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Placa da Moto */}
              <div className="input-group">
                <label className="input-label" htmlFor="placa">
                  Placa da Moto (opcional)
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🏍️</span>
                  <input
                    id="placa"
                    type="text"
                    value={placa}
                    onChange={handlePlacaChange}
                    className="login-input uppercase"
                    placeholder="ABC1D23"
                    maxLength={8}
                  />
                </div>
                <p className="login-hint" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                  🔤 Formato Mercosul (3 letras e 4 números)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !!sucesso}
                className={`submit-button ${
                  loading || sucesso
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
                      Cadastrando...
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

              <div className="login-footer-text">
                <p className="text-gray-600 text-sm">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      // Fechar janela atual se foi aberta por script
                      if (window.opener) {
                        window.close();
                      }
                      router.push('/login');
                    }}
                    className="login-link"
                  >
                    Fazer Login
                  </button>
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
