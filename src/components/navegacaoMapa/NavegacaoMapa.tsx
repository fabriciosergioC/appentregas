'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Rota } from '@/components/mapaEntrega/MapaEntrega';
import L from 'leaflet';

interface UpdateMapCenterProps { 
  centro: [number, number]; 
  zoom?: number;
  bounds?: [[number, number], [number, number]];
}

export function UpdateMapCenter({ centro, zoom, bounds }: UpdateMapCenterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(centro, zoom ?? map.getZoom());
    }
  }, [centro, zoom, bounds, map]);
  
  return null;
}

interface RotaNavegacaoProps {
  rota: Rota;
}

export function RotaNavegacao({ rota }: RotaNavegacaoProps) {
  const map = useMap();

  useEffect(() => {
    if (!rota || rota.coordenadas.length < 2) return;

    const coordenadas = rota.coordenadas;
    const intervalo = Math.floor(coordenadas.length / 8);

    document.querySelectorAll('.rota-seta-nav').forEach(el => el.remove());

    for (let i = intervalo; i < coordenadas.length - intervalo; i += intervalo) {
      const ponto = coordenadas[i];
      const proximoPonto = coordenadas[Math.min(i + 1, coordenadas.length - 1)];
      
      const angulo = Math.atan2(
        proximoPonto[0] - ponto[0],
        proximoPonto[1] - ponto[1]
      ) * (180 / Math.PI);

      const setaIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="#059669" stroke-width="2" class="rota-seta-nav">
          <polygon points="12,2 22,22 12,18 2,22" transform="rotate(${angulo}, 12, 12)"/>
        </svg>`,
        className: 'rota-seta-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(ponto, { icon: setaIcon, interactive: false }).addTo(map);
    }
  }, [rota, map]);

  return null;
}
