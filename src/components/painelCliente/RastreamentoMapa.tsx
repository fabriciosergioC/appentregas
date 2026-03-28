'use client';

import { useEffect, useState } from 'react';
import { api, Pedido, Entregador } from '@/services/api';
import dynamic from 'next/dynamic';

// Importação dinâmica do react-leaflet para evitar SSR
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then((mod) => mod.useMap), { ssr: false });

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícone personalizado para o mapa
const createIcon = (emoji: string) => {
  return L.divIcon({
    html: `<div style="font-size: 24px; text-align: center;">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const entregadorIcon = createIcon('🛵');
const clienteIcon = createIcon('🏠');
const estabelecimentoIcon = createIcon('🏪');

// Componente para atualizar o centro do mapa
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && typeof window !== 'undefined') {
      map.flyTo([lat, lng], 15, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

interface RastreamentoMapaProps {
  pedido: Pedido | null;
  entregador: Entregador | null;
}

export default function RastreamentoMapa({ pedido, entregador }: RastreamentoMapaProps) {
  const [clienteCoords, setClienteCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Geocodificar endereço do cliente
  useEffect(() => {
    if (!pedido?.endereco || typeof window === 'undefined') return;

    const geocodificarEndereco = async () => {
      try {
        // Usando Nominatim OpenStreetMap para geocodificação
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pedido.endereco)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setClienteCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      } catch (error) {
        console.error('Erro ao geocodificar endereço:', error);
      }
    };

    geocodificarEndereco();
  }, [pedido?.endereco]);

  // Coordenadas do entregador
  const entregadorCoords = entregador?.localizacao_lat && entregador?.localizacao_lng
    ? { lat: entregador.localizacao_lat, lng: entregador.localizacao_lng }
    : null;

  // Centro do mapa: prioriza entregador, senão cliente
  const centroMapa = entregadorCoords || clienteCoords || { lat: -23.5505, lng: -46.6333 };

  if (!pedido || !isClient) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-green-200 h-80">
      <MapContainer
        center={[centroMapa.lat, centroMapa.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Marcador do Estabelecimento */}
        {pedido.estabelecimento_endereco && (
          <Marker position={[centroMapa.lat, centroMapa.lng]} icon={estabelecimentoIcon}>
            <Popup>🏪 {pedido.estabelecimento_nome || 'Estabelecimento'}</Popup>
          </Marker>
        )}

        {/* Marcador do Cliente */}
        {clienteCoords && (
          <Marker position={[clienteCoords.lat, clienteCoords.lng]} icon={clienteIcon}>
            <Popup>🏠 {pedido.cliente}<br />📍 {pedido.endereco}</Popup>
          </Marker>
        )}

        {/* Marcador do Entregador */}
        {entregadorCoords && (
          <>
            <Marker position={[entregadorCoords.lat, entregadorCoords.lng]} icon={entregadorIcon}>
              <Popup>
                🛵 Entregador: {entregador.nome}<br />
                📱 {entregador.telefone}
              </Popup>
            </Marker>
            <MapUpdater lat={entregadorCoords.lat} lng={entregadorCoords.lng} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
