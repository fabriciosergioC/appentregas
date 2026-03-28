import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  saldo: number;
  disponivel: boolean;
}

interface ModalPagamentoEntregadorProps {
  aberto: boolean;
  onClose: () => void;
  onPagamentoRealizado: () => void;
}

export default function ModalPagamentoEntregador({
  aberto,
  onClose,
  onPagamentoRealizado,
}: ModalPagamentoEntregadorProps) {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [entregadorSelecionado, setEntregadorSelecionado] = useState<string>('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [chavesPixEntregador, setChavesPixEntregador] = useState<any[]>([]);
  const [carregandoChavesPix, setCarregandoChavesPix] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);

  useEffect(() => {
    if (aberto) {
      carregarEntregadores();
    }
  }, [aberto]);

  // Carregar chaves PIX quando entregador for selecionado e forma for PIX
  useEffect(() => {
    if (aberto && entregadorSelecionado && formaPagamento === 'pix') {
      carregarChavesPixEntregador();
    }
  }, [entregadorSelecionado, formaPagamento, aberto]);

  const carregarChavesPixEntregador = async () => {
    setCarregandoChavesPix(true);
    try {
      const { data, error } = await supabase
        .from('chaves_pix_entregadores')
        .select('*')
        .eq('entregador_id', entregadorSelecionado)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setChavesPixEntregador(data || []);
    } catch (err) {
      console.error('Erro ao carregar chaves PIX:', err);
    } finally {
      setCarregandoChavesPix(false);
    }
  };

  const carregarEntregadores = async () => {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('id, nome, telefone, saldo, disponivel')
        .order('nome', { ascending: true });

      if (error) throw error;
      setEntregadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      setErro('Erro ao carregar entregadores');
    }
  };

  const entregadorSelecionadoData = entregadores.find((e) => e.id === entregadorSelecionado);

  const handlePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    if (!entregadorSelecionado) {
      setErro('Selecione um entregador');
      setLoading(false);
      return;
    }

    // Validar comprovante PIX se for o caso
    if (formaPagamento === 'pix' && !comprovanteFile) {
      setErro('Para pagamento via PIX, é necessário anexar o comprovante!');
      setLoading(false);
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido');
      setLoading(false);
      return;
    }

    if (entregadorSelecionadoData && valorNumerico > entregadorSelecionadoData.saldo) {
      setErro(`Saldo insuficiente. Saldo atual: R$ ${entregadorSelecionadoData.saldo.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      // Buscar dados do estabelecimento logado
      const estabelecimentoUser = localStorage.getItem('estabelecimento_user');
      let estabelecimentoId = '';

      if (estabelecimentoUser) {
        const dados = JSON.parse(estabelecimentoUser);
        estabelecimentoId = dados.id;
      }

      if (!estabelecimentoId) {
        setErro('Estabelecimento não identificado');
        setLoading(false);
        return;
      }

      let comprovanteUrl = null;

      // Upload do comprovante se for PIX
      if (formaPagamento === 'pix' && comprovanteFile) {
        setEnviandoComprovante(true);
        try {
          const fileName = `comprovantes-pagamento/${estabelecimentoId}/${Date.now()}_${comprovanteFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('comprovantes-pix')
            .upload(fileName, comprovanteFile);

          if (uploadError) throw uploadError;

          const { data: urlData } = await supabase.storage
            .from('comprovantes-pix')
            .getPublicUrl(fileName);

          comprovanteUrl = urlData?.publicUrl || null;
        } catch (uploadErr) {
          console.error('Erro no upload do comprovante:', uploadErr);
          setErro('Erro ao fazer upload do comprovante. Tente novamente.');
          setEnviandoComprovante(false);
          setLoading(false);
          return;
        } finally {
          setEnviandoComprovante(false);
        }
      }

      // Registrar pagamento
      const pagamentoData = {
        entregador_id: entregadorSelecionado,
        estabelecimento_id: estabelecimentoId,
        valor: valorNumerico,
        forma_pagamento: formaPagamento,
        descricao: descricao || null,
        status: 'realizado',
        criado_por: estabelecimentoId,
      };

      // Adicionar comprovante se existir
      if (comprovanteUrl) {
        pagamentoData.comprovante_pix = comprovanteUrl;
      }

      const { error } = await supabase.from('pagamentos_entregadores').insert([pagamentoData]);

      if (error) throw error;

      setSucesso('Pagamento registrado com sucesso! Saldo abatido.');
      onPagamentoRealizado();

      // Limpar formulário e fechar após 2 segundos
      setTimeout(() => {
        setEntregadorSelecionado('');
        setValor('');
        setDescricao('');
        setFormaPagamento('pix');
        setComprovanteFile(null);
        setComprovantePreview(null);
        setChavesPixEntregador([]);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      setErro(error.message || 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">💰 Pagar Entregador</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-1">
            Registrar pagamento e abater do saldo
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handlePagamento} className="p-6 space-y-4">
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

          {/* Selecionar Entregador */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Entregador *
            </label>
            <select
              value={entregadorSelecionado}
              onChange={(e) => setEntregadorSelecionado(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
              required
            >
              <option value="">Selecione um entregador</option>
              {entregadores.map((entregador) => (
                <option key={entregador.id} value={entregador.id}>
                  {entregador.nome} - Saldo: {formatarMoeda(entregador.saldo)}
                </option>
              ))}
            </select>
          </div>

          {/* Saldo do Entregador Selecionado */}
          {entregadorSelecionadoData && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700 font-medium">Saldo Atual:</span>
                <span className="text-xl font-bold text-purple-900">
                  {formatarMoeda(entregadorSelecionadoData.saldo)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-purple-600">Telefone:</span>
                <span className="text-sm text-purple-800">{entregadorSelecionadoData.telefone}</span>
              </div>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Valor do Pagamento *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
            {valor && (
              <p className="text-xs text-gray-500 mt-1">
                Saldo após pagamento:{' '}
                <span className="font-medium">
                  {entregadorSelecionadoData
                    ? formatarMoeda(entregadorSelecionadoData.saldo - parseFloat(valor || '0'))
                    : 'R$ 0,00'}
                </span>
              </p>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormaPagamento('pix')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'pix'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💠 PIX
              </button>
              <button
                type="button"
                onClick={() => setFormaPagamento('dinheiro')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'dinheiro'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💵 Dinheiro
              </button>
              <button
                type="button"
                onClick={() => setFormaPagamento('transferencia')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formaPagamento === 'transferencia'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏦 Transferência
              </button>
            </div>
          </div>

          {/* Chaves PIX do Entregador */}
          {formaPagamento === 'pix' && entregadorSelecionado && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-3 text-sm flex items-center gap-2">
                💠 Chaves PIX do Entregador
              </h4>

              {carregandoChavesPix ? (
                <div className="text-center py-4">
                  <p className="text-purple-600 text-sm">⏳ Carregando chaves PIX...</p>
                </div>
              ) : chavesPixEntregador.length === 0 ? (
                <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm">⚠️ Entregador não cadastrou chaves PIX</p>
                  <p className="text-yellow-600 text-xs mt-1">Combine os dados do PIX diretamente com o entregador.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chavesPixEntregador.map((chave) => (
                    <div key={chave.id} className="bg-white border border-purple-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold uppercase">
                              {chave.tipo}
                            </span>
                            <span className="font-bold text-gray-800 text-sm">{chave.chave}</span>
                          </div>
                          <p className="text-xs text-gray-600">👤 <span className="font-medium">{chave.titular}</span></p>
                          <p className="text-xs text-gray-500">🏦 <span className="font-medium">{chave.banco}</span></p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(chave.chave);
                              alert('✅ Chave PIX copiada!');
                            } catch (err) {
                              console.error('Erro ao copiar:', err);
                            }
                          }}
                          className="text-purple-600 hover:text-purple-700 text-xs font-bold flex-shrink-0"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comprovante PIX */}
          {formaPagamento === 'pix' && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <h4 className="font-bold text-purple-800 mb-3 text-sm flex items-center gap-2">
                📎 Comprovante de Pagamento (Obrigatório)
              </h4>

              <label className="block w-full">
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition-colors bg-white">
                  {comprovantePreview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={comprovantePreview}
                        alt="Comprovante"
                        className="max-h-48 rounded-lg shadow-md mb-3"
                      />
                      <span className="text-sm text-green-600 font-bold">✅ Imagem carregada</span>
                      <span className="text-xs text-gray-500 mt-1">Clique para trocar</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📷</span>
                      <p className="text-gray-700 font-bold mb-1">Clique para anexar o comprovante</p>
                      <p className="text-xs text-gray-500">PNG, JPG (máx. 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('O arquivo deve ter no máximo 5MB!');
                          return;
                        }
                        setComprovanteFile(file);
                        // Criar preview
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setComprovantePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </label>

              {comprovanteFile && (
                <div className="mt-3 flex items-center justify-between bg-white border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">
                        {comprovanteFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(comprovanteFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setComprovanteFile(null);
                      setComprovantePreview(null);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    🗑️ Remover
                  </button>
                </div>
              )}

              <p className="text-xs text-purple-600 mt-3">
                ⚠️ <strong>Atenção:</strong> O comprovante é obrigatório para pagamento via PIX.
              </p>
            </div>
          )}

          {/* Descrição (Opcional) */}
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pagamento referente à semana 01-07/03"
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !!sucesso}
            className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transition-all ${
              loading || sucesso
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : sucesso ? (
              '✅ Pagamento Registrado!'
            ) : (
              '💰 Confirmar Pagamento'
            )}
          </button>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Atenção:</strong> O valor será abatido automaticamente do saldo do entregador.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
