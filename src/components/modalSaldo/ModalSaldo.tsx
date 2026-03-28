import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Extrato {
  id: string;
  entregador_id: string;
  pedido_id: string | null;
  tipo: 'credito' | 'debito' | 'saque';
  valor: number;
  descricao: string;
  created_at: string;
}

interface ModalSaldoProps {
  aberto: boolean;
  entregadorId: string;
  onClose: () => void;
}

export default function ModalSaldo({ aberto, entregadorId, onClose }: ModalSaldoProps) {
  const [saldo, setSaldo] = useState<number>(0);
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aberto && entregadorId) {
      carregarSaldo();
    }
  }, [aberto, entregadorId]);

  const carregarSaldo = async () => {
    setLoading(true);
    try {
      // Buscar saldo atual
      const { data: entregador, error } = await supabase
        .from('entregadores')
        .select('saldo')
        .eq('id', entregadorId)
        .single();

      if (error) {
        console.error('Erro ao buscar saldo:', error);
        return;
      }

      setSaldo(entregador?.saldo || 0);

      // Buscar extratos (últimos 50)
      const { data: extratosData } = await supabase
        .from('extratos')
        .select('*')
        .eq('entregador_id', entregadorId)
        .order('created_at', { ascending: false })
        .limit(50);

      setExtratos(extratosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return '💰';
      case 'debito':
        return '💳';
      case 'saque':
        return '🏦';
      default:
        return '📝';
    }
  };

  const getTipoClasse = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'text-green-600';
      case 'debito':
        return 'text-red-600';
      case 'saque':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">💰 Meu Saldo</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          
          {/* Saldo Atual */}
          <div className="mt-6 text-center">
            <p className="text-green-100 text-sm">Saldo Disponível</p>
            {loading ? (
              <div className="flex items-center justify-center mt-2">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <p className="text-4xl font-bold mt-2">{formatarMoeda(saldo)}</p>
            )}
          </div>
        </div>

        {/* Extrato */}
        <div className="p-6 overflow-y-auto max-h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📋 Extrato
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando extrato...</p>
            </div>
          ) : extratos.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-5xl">📭</span>
              <p className="text-gray-500 mt-4">Nenhuma transação registrada</p>
              <p className="text-gray-400 text-sm mt-2">
                Seu saldo será atualizado após cada entrega finalizada
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {extratos.map((extrato) => (
                <div
                  key={extrato.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTipoIcon(extrato.tipo)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{extrato.descricao}</p>
                      <p className="text-xs text-gray-500">{formatarData(extrato.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${getTipoClasse(extrato.tipo)}`}>
                    {extrato.tipo === 'credito' ? '+' : '-'}
                    {formatarMoeda(Math.abs(extrato.valor))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            💡 O saldo é atualizado automaticamente após cada entrega finalizada
          </p>
        </div>
      </div>
    </div>
  );
}
