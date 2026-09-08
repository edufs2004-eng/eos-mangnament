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

// Crear un nuevo cliente (Maneja RUT opcional correctamente)
export async function createClientRecord(clientData) {
  try {
    const payload = { ...clientData };
    // Si el RUT está vacío, lo pasamos como null para evitar errores de restricción única
    if (payload.rut_identificacion === '') {
      payload.rut_identificacion = null;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al crear cliente:', err);
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
// Actualizar un cliente existente
export async function updateClientRecord(id, clientData) {
  try {
    const payload = { ...clientData };
    if (payload.rut_identificacion === '') {
      payload.rut_identificacion = null;
    }

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    throw err;
  }
}
// Obtener todos los cobros con información de cliente, servicio y moneda
export async function getInvoices() {
  try {
    const { data, error } = await supabase
      .from('invoices_receipts')
      .select(`
        *,
        contracts (
          id,
          monto_total_acordado,
          moneda,
          clients ( nombre_razon_social, tipo_cliente ),
          services ( nombre_servicio, departamento, pct_caja_empresa, pct_ejecutor_legal, pct_ejecutor_tech )
        )
      `)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      console.error('Error al obtener cobros:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de conexión en getInvoices:', err);
    return [];
  }
}

// Confirmar pago (Soporta UF, Porcentajes y Fechas Retroactivas)
export async function confirmInvoicePayment({ invoiceId, comprobanteUrl, fechaPagoReal, montoFinalClp, valorUfDia }) {
  try {
    const payload = {
      estado_pago: 'PAGADO',
      fecha_pago_real: fechaPagoReal, // Fecha seleccionada por el usuario
      comprobante_url: comprobanteUrl || null
    };

    // Si hubo conversión (UF o Porcentaje), actualizamos el monto_a_cobrar a pesos chilenos reales
    // para que el Trigger SQL calcule el 30/70 sobre dinero real.
    if (montoFinalClp !== null) {
      payload.monto_a_cobrar = montoFinalClp;
    }
    if (valorUfDia) {
      payload.valor_uf_dia = valorUfDia;
    }

    const { data, error } = await supabase
      .from('invoices_receipts')
      .update(payload)
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