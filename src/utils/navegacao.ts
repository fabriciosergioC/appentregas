/**
 * Utilitários para abrir apps de navegação (Google Maps e Waze)
 */

/**
 * Detecta se está em dispositivo iOS
 */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detecta se está em dispositivo Android
 */
function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Detecta se está em dispositivo móvel
 */
function isMobile(): boolean {
  return isIOS() || isAndroid();
}

/**
 * Abre o Google Maps ou Waze com a rota para o endereço especificado
 * @param endereco - Endereço completo para navegação
 * @param app - App de navegação preferido ('google' | 'waze')
 */
export function abrirNavegacao(endereco: string, app: 'google' | 'waze') {
  // Codificar o endereço para URL
  const enderecoCodificado = encodeURIComponent(endereco);

  if (!isMobile()) {
    // Em desktop, sempre usa Google Maps web
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;
    window.open(googleMapsUrl, '_blank');
    return;
  }

  // Em mobile, usa URLs universais que funcionam melhor
  if (app === 'google') {
    if (isIOS()) {
      // iOS: Usa URL scheme do Google Maps
      const iosUrl = `comgooglemaps://?daddr=${enderecoCodificado}&directionsmode=driving`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${enderecoCodificado}`;
      
      // Tenta abrir o app, se não conseguir abre a web
      const opened = tentarAbrirApp(iosUrl);
      if (!opened) {
        setTimeout(() => window.open(webUrl, '_blank'), 500);
      }
    } else {
      // Android: Usa intent ou URL web
      const androidUrl = `https://www.google.com/maps/dir/?api=1&destination=${enderecoCodificado}`;
      window.location.href = androidUrl;
    }
  } else if (app === 'waze') {
    if (isIOS()) {
      // iOS: Usa URL scheme do Waze
      const iosUrl = `waze://?q=${enderecoCodificado}&navigate=yes`;
      const webUrl = `https://waze.com/ul?q=${enderecoCodificado}&navigate=yes`;
      
      // Tenta abrir o app, se não conseguir abre a web
      const opened = tentarAbrirApp(iosUrl);
      if (!opened) {
        setTimeout(() => window.open(webUrl, '_blank'), 500);
      }
    } else {
      // Android: Usa intent do Waze
      const androidUrl = `https://waze.com/ul?q=${enderecoCodificado}&navigate=yes`;
      window.location.href = androidUrl;
    }
  }
}

/**
 * Tenta abrir um URL scheme de app
 * @param url - URL scheme do app (ex: waze://, comgooglemaps://)
 * @returns true se conseguiu abrir, false caso contrário
 */
function tentarAbrirApp(url: string): boolean {
  try {
    // Cria um iframe invisível para tentar abrir o app
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    // Remove o iframe após tentar
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
    
    return true;
  } catch (e) {
    console.error('Erro ao tentar abrir app:', e);
    return false;
  }
}

/**
 * Mostra um modal/prompt para o usuário escolher entre Google Maps ou Waze
 * @param endereco - Endereço para navegação
 */
export function escolherAppNavegacao(endereco: string) {
  const escolha = confirm(
    'Escolha o app de navegação:\n\n✅ OK - Google Maps\n❌ Cancelar - Waze'
  );

  abrirNavegacao(endereco, escolha ? 'google' : 'waze');
}
