import { supabase } from '@/lib/supabase';

// Balance General (30% Empresa / 70% Socios / Gastos)
export async function getCompanyBalance() {
  const { data, error } = await supabase
    .from('vw_empresa_balance')
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
}

// Facturación y Boletas
export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices_receipts')
    .select(`
      *,
      contracts (
        clients ( nombre_razon_social ),
        services ( nombre_servicio, departamento )
      )
    `)
    .order('fecha_vencimiento', { ascending: true });

  if (error) throw error;
  return data;
}