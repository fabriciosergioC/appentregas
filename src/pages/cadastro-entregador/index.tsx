import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';

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

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login');
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

      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo/Ícone */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-5xl">🛵</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Cadastro de Entregador</h1>
            <p className="text-gray-500 mt-2 text-sm">Cadastre-se para começar a receber pedidos</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleCadastro} className="space-y-5">
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
              <label className="block text-gray-800 font-bold text-sm" htmlFor="nome">
                Nome Completo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">👤</span>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-700 font-medium"
                  placeholder="Digite seu nome completo"
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
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-700 font-medium"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 ml-1">
                📞 Seu telefone será exibido no painel de pedidos
              </p>
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
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-700 font-medium"
                  placeholder="Mínimo 4 caracteres"
                  minLength={4}
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
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-700 font-medium"
                  placeholder="Repita a senha"
                  minLength={4}
                  required
                />
              </div>
            </div>

            {/* Upload de Foto */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm" htmlFor="foto">
                Foto de Perfil (opcional)
              </label>
              <div className="flex items-center gap-4">
                {fotoPreview ? (
                  <div className="relative">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-green-500 shadow-lg"
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
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-green-500 transition-colors">
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
            <div className="space-y-1">
              <label className="block text-gray-800 font-bold text-sm" htmlFor="placa">
                Placa da Moto (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🏍️</span>
                <input
                  id="placa"
                  type="text"
                  value={placa}
                  onChange={handlePlacaChange}
                  className="w-full border-2 border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-700 font-medium uppercase"
                  placeholder="ABC1D23"
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 ml-1">
                🔤 Formato Mercosul (3 letras e 4 números)
              </p>
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
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-green-600 hover:text-green-700 font-semibold underline"
                >
                  Fazer Login
                </button>
              </p>
            </div>
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
