import { useState, useCallback, useEffect, useRef } from 'react';
import { getSocket, eventosCliente, conectarSocket } from '@/services/socket';
import { api } from '@/services/api';

export interface Localizacao {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export function useGPS(entregadorId?: string) {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Salvar entregadorId no localStorage quando disponível
  useEffect(() => {
    if (entregadorId) {
      const entregador = localStorage.getItem('entregador');
      if (entregador) {
        const dados = JSON.parse(entregador);
        if (dados.id !== entregadorId) {
          dados.id = entregadorId;
          localStorage.setItem('entregador', JSON.stringify(dados));
        }
      }
    }
  }, [entregadorId]);

  // Listener para localização simulada (testes em desktop)
  useEffect(() => {
    const handleSimulacao = (event: Event) => {
      const customEvent = event as CustomEvent<Localizacao>;
      console.log('🎭 Recebida localização simulada:', customEvent.detail);
      setLocalizacao(customEvent.detail);
    };

    window.addEventListener('localizacao-simulada', handleSimulacao as EventListener);
    return () => {
      window.removeEventListener('localizacao-simulada', handleSimulacao as EventListener);
    };
  }, []);

  const enviarLocalizacao = useCallback((lat: number, lng: number) => {
    const socket = getSocket();
    if (socket && entregadorId) {
      socket.emit(eventosCliente.ENVIAR_LOCALIZACAO, {
        entregadorId,
        lat,
        lng,
        timestamp: Date.now(),
      });
    }

    // Também atualiza via API (backup)
    if (entregadorId) {
      api.atualizarLocalizacao(entregadorId, lat, lng).catch(console.error);
    }
  }, [entregadorId]);

  const solicitarPermissaoLocalizacao = async (): Promise<boolean> => {
    // Verifica se a API de permissões está disponível
    if ('permissions' in navigator) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (navigator.permissions as any).query({ name: 'geolocation' });
        
        if (result.state === 'denied') {
          return false;
        }
        
        if (result.state === 'prompt') {
          // Permissão ainda não foi solicitada, vamos solicitar
          return true;
        }
        
        return result.state === 'granted';
      } catch (error) {
        console.warn('API de permissões não disponível:', error);
        return true; // Assume que pode tentar
      }
    }
    return true; // Se não tem API de permissões, tenta mesmo assim
  };

  const iniciarGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setErro('❌ Geolocalização não é suportada neste navegador');
      return false;
    }

    // Verificar permissão primeiro
    const temPermissao = await solicitarPermissaoLocalizacao();
    if (!temPermissao) {
      setErro('❌ Permissão de localização negada. Vá nas configurações do navegador e permita o acesso à localização.');
      return false;
    }

    // Conectar socket se não estiver conectado
    const socket = getSocket();
    if (!socket) {
      console.log('🔌 Conectando socket antes de iniciar GPS...');
      conectarSocket();
    }

    setAtivo(true);
    setErro(null);
    setLocalizacao(null);

    console.log('📡 Iniciando GPS com alta precisão...');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log('✅ Localização recebida:', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });

        const data: Localizacao = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setLocalizacao(data);
        
        if (entregadorId) {
          enviarLocalizacao(data.lat, data.lng);
        }
      },
      (err) => {
        console.error('❌ Erro GPS:', err);
        
        // Não para o GPS em caso de erro, permite usar localização simulada
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErro('❌ Permissão de localização negada.\n\nPara corrigir:\n1. Toque na barra de endereço\n2. Clique em "Configurações" ou "🔒"\n3. Em "Localização", selecione "Permitir"\n4. Recarregue a página');
            setAtivo(false);
            break;
          case err.POSITION_UNAVAILABLE:
            setErro('⚠️ Localização indisponível.\n\nVerifique:\n• GPS está ativado nas configurações\n• Você está em área aberta\n• Use "Simular Localização" para testes');
            break;
          case err.TIMEOUT:
            setErro('⏱️ Timeout ao obter localização.\n\nTente:\n• Aguardar alguns segundos\n• Ir para área aberta\n• Use "Simular Localização" para testes');
            break;
          default:
            setErro('⚠️ Erro ao obter localização: ' + err.message);
        }
      },
      {
        enableHighAccuracy: true,  // Usa GPS de alta precisão
        timeout: 10000,            // Timeout de 10 segundos
        maximumAge: 5000,          // Aceita localização de até 5 segundos atrás
      }
    );

    watchIdRef.current = watchId;
    return true;
  }, [entregadorId, enviarLocalizacao]);

  const pararGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAtivo(false);
    setErro(null);
  }, []);

  return {
    localizacao,
    erro,
    ativo,
    iniciarGPS,
    pararGPS,
    enviarLocalizacao,
  };
}
