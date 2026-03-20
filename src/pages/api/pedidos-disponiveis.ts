import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  // Criar cliente Supabase com service_role key (bypass RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔑 API Pedidos Disponíveis:', {
    url: supabaseUrl ? '✅' : '❌',
    key: supabaseServiceKey ? '✅' : '❌'
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente faltando!');
    return res.status(500).json({ 
      error: 'Variáveis de ambiente faltando',
      url: !!supabaseUrl,
      key: !!supabaseServiceKey
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (method === 'GET') {
    try {
      console.log('📋 Buscando pedidos pendentes...');
      
      // Buscar pedidos disponíveis (pendentes)
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        return res.status(500).json({ error: error.message, details: error });
      }

      console.log('✅ Pedidos encontrados:', data?.length || 0);
      return res.status(200).json(data || []);
    } catch (error: any) {
      console.error('❌ Erro na API:', error);
      return res.status(500).json({ error: error.message, stack: error.stack });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
