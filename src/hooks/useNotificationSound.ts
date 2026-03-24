/**
 * Hook para tocar som de notificação quando chegar novo pedido
 * Usa Web Audio API para gerar som sem depender de arquivos externos
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Inicializar AudioContext ao montar o componente
  useEffect(() => {
    if (typeof window === 'undefined' || isInitializedRef.current) return;

    isInitializedRef.current = true;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
        console.log('✅ AudioContext inicializado');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar AudioContext:', error);
    }

    return () => {
      // Parar som ao desmontar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const tocarUmSom = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.warn('❌ AudioContext não suportado');
          return;
        }
        audioContextRef.current = new AudioContext();
        console.log('✅ AudioContext criado no momento do som');
      }

      const ctx = audioContextRef.current;

      // Sempre retomar o contexto se estiver suspended
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('🔊 AudioContext resumed');
        }).catch((err) => {
          console.warn('⚠️ Não foi possível retomar AudioContext:', err);
        });
      }

      if (ctx.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        console.log('🔄 AudioContext recriado (estava closed)');
        return;
      }

      // Criar oscilador para som de "ding"
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';

      // Frequência: começa em 520Hz e sobe para 780Hz (som de alerta)
      oscillator.frequency.setValueAtTime(520, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.3);

      // Volume: sobe rápido e decai
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  }, []);

  // Iniciar som repetitivo
  const iniciarSomRepetitivo = useCallback(() => {
    if (isPlayingRef.current) {
      console.log('⚠️ Som já está tocando');
      return;
    }

    console.log('🔔 Iniciando som repetitivo...');
    isPlayingRef.current = true;
    setIsPlaying(true);

    // Garantir que o AudioContext está ativo
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('🔊 AudioContext resumed ao iniciar som');
      }).catch((err) => {
        console.warn('⚠️ Não foi possível retomar AudioContext:', err);
      });
    }

    // Tocar primeiro som imediatamente
    tocarUmSom();

    // Repetir a cada 2 segundos
    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) {
        clearInterval(intervalRef.current!);
        return;
      }
      tocarUmSom();
    }, 2000);
  }, [tocarUmSom]);

  // Parar som
  const pararSom = useCallback(() => {
    console.log('⏹️ Parando som repetitivo');
    isPlayingRef.current = false;
    setIsPlaying(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const testarSom = useCallback(() => {
    console.log('🧪 Testando som...');
    // Garantir que o AudioContext está ativo antes de testar
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('🔊 AudioContext resumed para teste');
        tocarUmSom();
      }).catch((err) => {
        console.warn('⚠️ Não foi possível retomar AudioContext:', err);
        tocarUmSom();
      });
    } else {
      tocarUmSom();
    }
  }, [tocarUmSom]);

  return {
    iniciarSomRepetitivo,
    pararSom,
    testarSom,
    isPlaying
  };
}
