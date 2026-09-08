import { supabase } from '@/lib/supabase';

// Balance General (30% Empresa / 70% Socios / Gastos)
export async function getCompanyBalance() {
  try {
    const { data, error } = await supabase
      .from('vw_empresa_balance')
      .select('*');
    
    if (error) {
      console.error('Error Supabase Balance:', error);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error de red/conexión en Balance:', err);
    return null;
  }
}

// Facturación y Boletas
export async function getInvoices() {
  try {
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

    if (error) {
      console.error('Error Supabase Invoices:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de red/conexión en Invoices:', err);
    return [];
  }
}