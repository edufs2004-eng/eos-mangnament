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
// Obtener lista de egresos y deudas asociadas
export async function getExpenses() {
  try {
    const { data, error } = await supabase
      .from('company_expenses')
      .select(`
        *,
        users:socio_deudor_id ( id, nombre, email, rol )
      `)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error al obtener gastos:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de conexión en getExpenses:', err);
    return [];
  }
}

// Obtener lista de socios/equipo para asignar deudas
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de conexión en getUsers:', err);
    return [];
  }
}

// Registrar un nuevo gasto o retiro de socio
export async function createExpenseRecord(expenseData) {
  try {
    const { data, error } = await supabase
      .from('company_expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al registrar gasto:', err);
    throw err;
  }
}
// Obtener el catálogo completo de servicios
export async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener servicios:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de conexión en getServices:', err);
    return [];
  }
}

// Crear un nuevo servicio en el catálogo
export async function createServiceRecord(serviceData) {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al crear servicio:', err);
    throw err;
  }
}