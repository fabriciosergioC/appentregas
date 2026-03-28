'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Localizacao } from '@/hooks/useGPS';

// Fix para ícone do Leaflet no Next.js
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone personalizado para o entregador (moto)
const entregadorIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/713/713359.png',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

export interface Rota {
  coordenadas: [number, number][];
  distancia: number;
  duracao: number;
}

interface MapaEntregaProps {
  localizacaoEntregador?: Localizacao;
  destino?: { lat: number; lng: number; endereco: string };
  zoom?: number;
  mostrarRota?: boolean;
}

// Componente para desenhar setas na rota
function RotaComSetas({ rota }: { rota: Rota }) {
  const map = useMap();
  const [setas, setSetas] = useState<L.Marker[]>([]);

  useEffect(() => {
    if (!rota || rota.coordenadas.length < 2) return;

    // Limpar setas anteriores
    setas.forEach(seta => map.removeLayer(seta));

    // Calcular ângulo e posicionar setas ao longo da rota
    const coordenadas = rota.coordenadas;
    const intervalo = Math.floor(coordenadas.length / 5); // 5 setas ao longo da rota

    const novasSetas: L.Marker[] = [];
    
    for (let i = intervalo; i < coordenadas.length - intervalo; i += intervalo) {
      const ponto = coordenadas[i];
      const proximoPonto = coordenadas[Math.min(i + 1, coordenadas.length - 1)];
      
      // Calcular ângulo entre dois pontos
      const angulo = Math.atan2(
        proximoPonto[0] - ponto[0],
        proximoPonto[1] - ponto[1]
      ) * (180 / Math.PI);

      // Criar seta com rotação
      const setaIconRotacionado = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#10b981" stroke="#059669" stroke-width="2">
          <polygon points="12,2 22,22 12,18 2,22" transform="rotate(${angulo}, 12, 12)"/>
        </svg>`,
        className: 'rota-seta-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(ponto, { icon: setaIconRotacionado }).addTo(map);
      novasSetas.push(marker);
    }

    setSetas(novasSetas);

    return () => {
      novasSetas.forEach(seta => map.removeLayer(seta));
    };
  }, [rota, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Componente para atualizar o centro do mapa
function UpdateMapCenter({ centro, zoom }: { centro: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(centro, zoom ?? map.getZoom());
  }, [centro, zoom, map]);
  return null;
}

// Função para buscar rota da API OSRM
async function buscarRota(origem: [number, number], destino: [number, number]): Promise<Rota | null> {
  try {
    // OSRM usa longitude, latitude (invertido do Leaflet)
    const url = `https://router.project-osrm.org/route/v1/driving/${origem[1]},${origem[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Decodificar geometria GeoJSON para array de coordenadas
      const coordenadas = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      
      return {
        coordenadas,
        distancia: route.distance, // em metros
        duracao: route.duration, // em segundos
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar rota:', error);
    return null;
  }
}

export default function MapaEntrega({
  localizacaoEntregador,
  destino,
  zoom = 15,
  mostrarRota = true,
}: MapaEntregaProps) {
  const [mounted, setMounted] = useState(false);
  const [rota, setRota] = useState<Rota | null>(null);
  const ultimaLocalizacaoRef = useRef<Localizacao | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Buscar rota quando a localização ou destino mudar
  useEffect(() => {
    if (!mostrarRota || !destino) {
      setRota(null);
      return;
    }

    // Se não tem localização do entregador, não busca rota
    if (!localizacaoEntregador) {
      console.log('⏳ Aguardando localização do entregador...');
      return;
    }

    // Evitar buscar rota se a localização não mudou significativamente
    const diff = ultimaLocalizacaoRef.current
      ? Math.abs(ultimaLocalizacaoRef.current.lat - localizacaoEntregador.lat) + 
        Math.abs(ultimaLocalizacaoRef.current.lng - localizacaoEntregador.lng)
      : 1;

    if (diff < 0.00005) return; // Ignora mudanças muito pequenas

    ultimaLocalizacaoRef.current = localizacaoEntregador;

    const origem: [number, number] = [localizacaoEntregador.lat, localizacaoEntregador.lng];
    const destinoCoord: [number, number] = [destino.lat, destino.lng];

    console.log('🗺️ Buscando rota de', origem, 'para', destinoCoord);
    buscarRota(origem, destinoCoord).then((rotaEncontrada) => {
      if (rotaEncontrada) {
        setRota(rotaEncontrada);
        console.log('✅ Rota calculada:', {
          pontos: rotaEncontrada.coordenadas.length,
          distancia: `${(rotaEncontrada.distancia / 1000).toFixed(2)} km`,
          duracao: `${Math.round(rotaEncontrada.duracao / 60)} min`,
        });
      } else {
        console.log('⚠️ Não foi possível calcular a rota');
      }
    });
  }, [localizacaoEntregador, destino, mostrarRota]);

  // Centro do mapa: prioriza localização do entregador, senão usa destino
  const centro: [number, number] = localizacaoEntregador
    ? [localizacaoEntregador.lat, localizacaoEntregador.lng]
    : destino
    ? [destino.lat, destino.lng]
    : [-19.9167, -43.9345];

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .rota-seta-marker {
          filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.3));
          transition: transform 0.3s ease;
        }
        .leaflet-interactive {
          transition: all 0.3s ease;
        }
      `}</style>
      <MapContainer
        center={centro}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <UpdateMapCenter centro={centro} zoom={zoom} />

        {/* Linha da rota com efeito destacado (estilo Uber) */}
        {mostrarRota && rota && rota.coordenadas.length > 0 && (
          <>
            {/* Camada externa (contorno branco mais grosso) */}
            <Polyline
              positions={rota.coordenadas}
              pathOptions={{
                color: '#ffffff',
                weight: 12,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Camada intermediária (contorno cinza) */}
            <Polyline
              positions={rota.coordenadas}
              pathOptions={{
                color: '#6b7280',
                weight: 10,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Camada principal (verde destacado) */}
            <Polyline
              positions={rota.coordenadas}
              pathOptions={{
                color: '#10b981',
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Camada interna (verde mais claro - efeito 3D) */}
            <Polyline
              positions={rota.coordenadas}
              pathOptions={{
                color: '#34d399',
                weight: 3,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Setas de direção ao longo da rota */}
            <RotaComSetas rota={rota} />
          </>
        )}

        {/* Controles de zoom */}
        <ZoomControl position="bottomright" />

        {/* Marcador do entregador */}
        {localizacaoEntregador && (
          <Marker
            position={[localizacaoEntregador.lat, localizacaoEntregador.lng]}
            icon={entregadorIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold">🛵 Você está aqui</p>
                <p className="text-sm text-gray-600">
                  Precisão: {Math.round(localizacaoEntregador.accuracy || 0)}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador do destino */}
        {destino && (
          <Marker position={[destino.lat, destino.lng]} icon={markerIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-bold">📦 Destino</p>
                <p className="text-sm text-gray-600">{destino.endereco}</p>
                {rota && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>📏 Distância: {(rota.distancia / 1000).toFixed(1)} km</p>
                    <p>⏱️ Tempo estimado: {Math.round(rota.duracao / 60)} min</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  );
}
