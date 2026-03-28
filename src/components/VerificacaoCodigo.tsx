'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VerificacaoCodigoProps {
  email: string;
  tipo?: 'cadastro' | 'login' | 'recuperacao';
  onSuccess?: (email: string) => void;
  onCancel?: () => void;
}

/**
 * Componente de Verificação de Código por Email
 * 
 * Uso:
 * <VerificacaoCodigo 
 *   email="cliente@email.com" 
 *   onSuccess={(email) => console.log('Verificado:', email)}
 * />
 */
export default function VerificacaoCodigo({
  email,
  tipo = 'cadastro',
  onSuccess,
  onCancel,
}: VerificacaoCodigoProps) {
  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // Tempo para reenviar
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer para reenvio
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Focar no primeiro input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handler para mudança de valor
  const handleChange = (index: number, value: string) => {
    // Apenas números
    if (value && !/^\d$/.test(value)) return;

    const newCodigo = [...codigo];
    newCodigo[index] = value;
    setCodigo(newCodigo);
    setError('');

    // Pular para o próximo input automaticamente
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quando preencher todos
    if (index === 5 && value && newCodigo.every((c) => c !== '')) {
      handleValidar(newCodigo.join(''));
    }
  };

  // Handler para teclas
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Backspace - voltar para o anterior
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Setas
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Colar código completo
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        const newCodigo = digits.split('');
        while (newCodigo.length < 6) newCodigo.push('');
        setCodigo(newCodigo);
        inputRefs.current[Math.min(digits.length, 5)]?.focus();
        
        if (digits.length === 6) {
          handleValidar(digits);
        }
      });
    }
  };

  // Enviar código para validação
  const handleValidar = async (codigoParaValidar: string = codigo.join('')) => {
    if (codigoParaValidar.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/verificacao-validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          codigo: codigoParaValidar,
          tipo,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setSuccess('Código verificado com sucesso!');
        setTimeout(() => {
          onSuccess?.(email);
        }, 1000);
      } else {
        setError(data.message || 'Código inválido');
        setCodigo(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleReenviar = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setCodigo(['', '', '', '', '', '']);

    try {
      const res = await fetch('/api/verificacao-enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Novo código enviado!');
        setTimeLeft(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
        
        // Limpar mensagem de sucesso após 3s
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Erro ao reenviar código');
      }
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verificação de Email
        </h2>
        <p className="text-gray-600">
          Enviamos um código de 6 dígitos para:
          <br />
          <span className="font-semibold text-gray-800">{email}</span>
        </p>
      </div>

      {/* Inputs do código */}
      <div className="flex justify-center gap-2 mb-6">
        {codigo.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
              ${success ? 'border-green-500 bg-green-50' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200`}
          />
        ))}
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm text-center">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm text-center">{success}</p>
        </div>
      )}

      {/* Botão de validar */}
      <button
        onClick={() => handleValidar()}
        disabled={loading || codigo.some((c) => c === '')}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
          disabled:bg-gray-400 disabled:cursor-not-allowed
          text-white font-semibold rounded-lg
          transition-colors duration-200 mb-4"
      >
        {loading ? 'Verificando...' : 'Verificar Código'}
      </button>

      {/* Reenviar código */}
      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleReenviar}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 font-medium 
              disabled:text-gray-400 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            📧 Reenviar código
          </button>
        ) : (
          <p className="text-gray-500 text-sm">
            Reenviar código em{' '}
            <span className="font-mono font-semibold">{timeLeft}s</span>
          </p>
        )}
      </div>

      {/* Cancelar */}
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-sm 
              disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            ← Voltar
          </button>
        </div>
      )}

      {/* Dica */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          💡 <strong>Dica:</strong> O código expira em 10 minutos.
          <br />
          Não compartilhe este código com ninguém.
        </p>
      </div>
    </div>
  );
}
