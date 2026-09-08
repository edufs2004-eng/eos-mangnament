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
// Obtener todos los clientes
export async function getClients() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contracts (
          id,
          monto_total_acordado,
          estado
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de conexión en getClients:', err);
    return [];
  }
}

// Crear un nuevo cliente
export async function createClientRecord(clientData) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al crear cliente:', err);
    throw err;
  }
}

// Confirmar pago de una boleta/cuota (Dispara el trigger 30/70 en Supabase)
export async function confirmInvoicePayment(invoiceId, comprobanteUrl = null) {
  try {
    const { data, error } = await supabase
      .from('invoices_receipts')
      .update({
        estado_pago: 'PAGADO',
        fecha_pago_real: new Date().toISOString(),
        comprobante_url: comprobanteUrl
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al confirmar pago:', err);
    throw err;
  }
}