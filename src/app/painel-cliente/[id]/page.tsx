'use client';

import { useParams } from 'next/navigation';
import PedidoTracker from '@/components/painelCliente/PedidoTracker';

export default function RastrearPedidoPage() {
  const params = useParams();
  const pedidoId = params.id as string;

  return <PedidoTracker pedidoId={pedidoId} />;
}
