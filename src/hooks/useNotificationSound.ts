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
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Ativar áudio após interação do usuário
  const ativarAudio = useCallback(() => {
    if (audioEnabled) return;
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('🔊 AudioContext ativado pelo usuário');
        setAudioEnabled(true);
      }).catch((err) => {
        console.warn('⚠️ Não foi possível ativar AudioContext:', err);
      });
    } else if (audioContextRef.current) {
      setAudioEnabled(true);
    }
  }, [audioEnabled]);

  // Inicializar AudioContext e listener de interação
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

    // Listener para ativar áudio na primeira interação
    const handleUserInteraction = () => {
      ativarAudio();
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      // Parar som ao desmontar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [ativarAudio]);

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
          console.log('🔊 AudioContext resumed automaticamente');
          // Tocar o som após retomar
          tocarOscilador(ctx);
        }).catch((err) => {
          console.warn('⚠️ Não foi possível retomar AudioContext:', err);
        });
      } else {
        // Contexto já está ativo, tocar imediatamente
        tocarOscilador(ctx);
      }
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  }, []);

  // Função interna para criar e tocar o oscilador
  const tocarOscilador = useCallback((ctx: AudioContext) => {
    try {
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

      console.log('🔔 Som tocado!');
    } catch (error) {
      console.error('❌ Erro ao criar oscilador:', error);
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
    ativarAudio,
    isPlaying,
    audioEnabled
  };
}
