import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, cliente, status, endereco')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: fila } = await supabase
    .from('fila_pedidos')
    .select('id, cliente, status, endereco')
    .order('created_at', { ascending: false })
    .limit(3);
    
  fs.writeFileSync('debug_output.json', JSON.stringify({ pedidos, fila }, null, 2));
  console.log('Salvo em debug_output.json');
}

check();
