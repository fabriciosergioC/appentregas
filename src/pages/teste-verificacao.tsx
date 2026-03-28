'use client';

import { useState } from 'react';

export default function TesteVerificacao() {
  const [email, setEmail] = useState('');
  const [mostrarVerificacao, setMostrarVerificacao] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [codigoDev, setCodigoDev] = useState('');

  // Passo 1: Solicitar código
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setCodigoDev('');

    try {
      const res = await fetch('/api/verificacao-enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo: 'cadastro' }),
      });

      const data = await res.json();

      if (data.success) {
        setMensagem('Código enviado!');
        setCodigoDev(data.codigo || '');
        setMostrarVerificacao(true);
      } else {
        setErro(data.error || 'Erro ao enviar código');
      }
    } catch (err: any) {
      setErro('Erro de conexão: ' + err.message);
    }
  };

  // Passo 2: Validar código
  const handleValidar = async (codigo: string) => {
    setErro('');
    setMensagem('');

    try {
      const res = await fetch('/api/verificacao-validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, tipo: 'cadastro' }),
      });

      const data = await res.json();

      if (data.valid) {
        setMensagem('✅ ' + data.message);
      } else {
        setErro('❌ ' + data.message);
      }
    } catch (err: any) {
      setErro('Erro de conexão: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          🧪 Teste de Verificação
        </h1>

        {!mostrarVerificacao ? (
          <form onSubmit={handleSolicitarCodigo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="teste@email.com"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              📧 Enviar Código
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Código enviado para: <strong>{email}</strong>
              </p>
              
              {codigoDev && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    🔧 <strong>Dev Mode:</strong> {codigoDev}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Digite o código
              </label>
              <input
                type="text"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="123456"
                onBlur={(e) => {
                  const codigo = e.target.value.replace(/\D/g, '');
                  if (codigo.length === 6) {
                    handleValidar(codigo);
                  }
                }}
              />
            </div>

            <button
              onClick={() => setMostrarVerificacao(false)}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        )}

        {mensagem && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{mensagem}</p>
          </div>
        )}

        {erro && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Em desenvolvimento, o código aparece acima.
            <br />
            Em produção, ele é enviado por email.
          </p>
        </div>
      </div>
    </div>
  );
}
