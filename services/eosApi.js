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
export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices_receipts')
    .select(`
      *,
      contracts (
        *,
        clients (*),
        services (*)
      ),
      ledger_split (*)
    `)
    .order('fecha_vencimiento', { ascending: true });
  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
  return data;
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
// Función auxiliar para limpiar payload de cliente
const sanitizeClientData = (data) => {
  const payload = { ...data };
  
  // Si el RUT viene vacío o con espacios, forzar NULL explícito
  if (!payload.rut_identificacion || payload.rut_identificacion.trim() === '') {
    payload.rut_identificacion = null;
  } else {
    payload.rut_identificacion = payload.rut_identificacion.trim();
  }

  if (payload.email && payload.email.trim() === '') payload.email = null;
  if (payload.telefono && payload.telefono.trim() === '') payload.telefono = null;

  return payload;
};

// Crear cliente
export async function createClientRecord(clientData) {
  try {
    const payload = sanitizeClientData(clientData);
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

// Actualizar cliente
export async function updateClientRecord(id, clientData) {
  try {
    const payload = sanitizeClientData(clientData);
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
// Crear un contrato y generar sus cuotas/boletas automáticamente
export async function createContractAndInvoices({
  client_id,
  service_id,
  monto_total_acordado,
  moneda = 'CLP',
  tipo_pago = 'UNICO',
  numero_cuotas = 1,
  fecha_inicio = new Date().toISOString().split('T')[0],
  marcar_primer_pago_pagado = false,
  fecha_pago_real = null,
  valor_uf_dia = null
}) {
  try {
    // 1. Insertar el contrato
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert([{
        client_id,
        service_id,
        monto_total_acordado: parseFloat(monto_total_acordado),
        moneda,
        tipo_pago,
        numero_cuotas: parseInt(numero_cuotas),
        fecha_inicio
      }])
      .select()
      .single();

    if (contractError) throw contractError;

    // 2. Generar las cuotas/boletas automáticamente
    const numCuotas = tipo_pago === 'UNICO' ? 1 : parseInt(numero_cuotas);
    const montoCuotaBase = parseFloat(monto_total_acordado) / numCuotas;
    const timestampFolio = Date.now().toString().slice(-4);

    const invoicesToInsert = [];

    for (let i = 1; i <= numCuotas; i++) {
      const fechaVenc = new Date(fecha_inicio);
      fechaVenc.setMonth(fechaVenc.getMonth() + (i - 1));

      const esPrimeraPagada = i === 1 && marcar_primer_pago_pagado;
      
      // Si es en UF y se marcó pagada, calculamos los CLP reales para la repartición 30/70
      let montoCuotaFinal = montoCuotaBase;
      if (esPrimeraPagada && moneda === 'UF' && valor_uf_dia) {
        montoCuotaFinal = montoCuotaBase * parseFloat(valor_uf_dia);
      }

      invoicesToInsert.push({
        contract_id: contract.id,
        folio_interno: `EOS-${new Date().getFullYear()}-${timestampFolio}-C${i}`,
        numero_cuota_actual: i,
        monto_a_cobrar: montoCuotaFinal,
        fecha_vencimiento: fechaVenc.toISOString().split('T')[0],
        estado_pago: esPrimeraPagada ? 'PAGADO' : 'PENDIENTE',
        fecha_pago_real: esPrimeraPagada ? (fecha_pago_real || new Date().toISOString()) : null,
        valor_uf_dia: esPrimeraPagada && moneda === 'UF' ? parseFloat(valor_uf_dia) : null
      });
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices_receipts')
      .insert(invoicesToInsert)
      .select();

    if (invoicesError) throw invoicesError;

    return { contract, invoices };
  } catch (err) {
    console.error('Error al crear contrato y cuotas:', err);
    throw err;
  }
}
// Actualizar datos de una cuota (Ej: Cambiar fecha de vencimiento manual)
export async function updateInvoiceRecord(invoiceId, updates) {
  try {
    const { data, error } = await supabase
      .from('invoices_receipts')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al actualizar la boleta:', err);
    throw err;
  }
}

// Procesar un Pago Parcial (Liquida una parte y crea una nueva deuda por el saldo)
export async function registerPartialPayment({ invoiceId, montoFinalClp, montoRestanteBase, comprobanteUrl, fechaPagoReal, valorUfDia }) {
  try {
    // 1. Obtener la boleta original
    const { data: originalInvoice, error: fetchError } = await supabase
      .from('invoices_receipts')
      .select('*')
      .eq('id', invoiceId)
      .single();
      
    if (fetchError) throw fetchError;

    // 2. Liquidar la boleta actual con el monto parcial que SÍ pagaron
    const { error: updateError } = await supabase
      .from('invoices_receipts')
      .update({
        estado_pago: 'PAGADO',
        fecha_pago_real: fechaPagoReal,
        comprobante_url: comprobanteUrl || null,
        monto_a_cobrar: montoFinalClp, 
        valor_uf_dia: valorUfDia || null
      })
      .eq('id', invoiceId);
      
    if (updateError) throw updateError;

    // 3. Crear automáticamente una nueva boleta PENDIENTE por el saldo que falta
    const { error: insertError } = await supabase
      .from('invoices_receipts')
      .insert([{
        contract_id: originalInvoice.contract_id,
        folio_interno: originalInvoice.folio_interno + '-SALDO',
        numero_cuota_actual: originalInvoice.numero_cuota_actual,
        monto_a_cobrar: montoRestanteBase, // El remanente en moneda original (CLP o UF)
        fecha_vencimiento: originalInvoice.fecha_vencimiento, 
        estado_pago: 'PENDIENTE'
      }]);
      
    if (insertError) throw insertError;

    return true;
  } catch (err) {
    console.error('Error al procesar pago parcial:', err);
    throw err;
  }
}
// Subir archivo (Imagen o PDF) a Supabase Storage
export async function uploadComprobante(file) {
  try {
    const fileExt = file.name.split('.').pop();
    // Generar un nombre único para no sobreescribir archivos con el mismo nombre
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `recibos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtener la URL pública para guardarla en la base de datos
    const { data } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Error al subir comprobante:', err);
    throw err;
  }
}

// Actualizar solo el comprobante de un pago antiguo
export async function updateComprobanteUrl(invoiceId, url) {
  try {
    const { data, error } = await supabase
      .from('invoices_receipts')
      .update({ comprobante_url: url })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al actualizar url del comprobante:', err);
    throw err;
  }
}
// Funciones para Gestión de Personal y Nómina
export async function getPayrollStaff() {
  const { data, error } = await supabase
    .from('payroll_staff')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching payroll staff:', error);
    return [];
  }
  return data;
}

export async function createPayrollStaff(staffData) {
  const { data, error } = await supabase
    .from('payroll_staff')
    .insert([staffData])
    .select();
  if (error) throw error;
  return data;
}

export async function deletePayrollStaff(id) {
  const { error } = await supabase
    .from('payroll_staff')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}