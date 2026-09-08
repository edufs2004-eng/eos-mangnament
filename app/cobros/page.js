'use client';

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Search, 
  Check, 
  X, 
  FileCheck2,
  Calculator,
  Edit,
  AlertCircle
} from 'lucide-react';
import { 
  getInvoices, 
  confirmInvoicePayment, 
  updateInvoiceRecord, 
  registerPartialPayment 
} from '@/services/eosApi';

export default function CobrosPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  // Modales
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [confirming, setConfirming] = useState(false);
  
  // Campos del Formulario de Pago
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [fechaPagoReal, setFechaPagoReal] = useState('');
  const [valorUfDia, setValorUfDia] = useState('');
  const [montoManualCLP, setMontoManualCLP] = useState('');
  
  // Pago Parcial
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [montoParcialAbonado, setMontoParcialAbonado] = useState('');

  // Campos Formulario Edición
  const [editData, setEditData] = useState({
    fecha_vencimiento: '',
    monto_a_cobrar: ''
  });

  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // ==========================================
  // LÓGICA DE EDICIÓN
  // ==========================================
  const openEditModal = (inv) => {
    setEditingInvoice(inv);
    setEditData({
      fecha_vencimiento: inv.fecha_vencimiento,
      monto_a_cobrar: inv.monto_a_cobrar
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setConfirming(true);
    try {
      await updateInvoiceRecord(editingInvoice.id, {
        fecha_vencimiento: editData.fecha_vencimiento,
        monto_a_cobrar: parseFloat(editData.monto_a_cobrar)
      });
      setEditingInvoice(null);
      await loadInvoices();
    } catch (err) {
      alert('Error al actualizar la cuota.');
    } finally {
      setConfirming(false);
    }
  };

  // ==========================================
  // LÓGICA DE LIQUIDACIÓN Y PAGO PARCIAL
  // ==========================================
  const openConfirmModal = (inv) => {
    setSelectedInvoice(inv);
    setComprobanteUrl('');
    setFechaPagoReal(new Date().toISOString().split('T')[0]);
    setValorUfDia('');
    setMontoManualCLP('');
    setEsPagoParcial(false);
    setMontoParcialAbonado('');
  };

  const getMontoBaseActual = () => {
    const original = Number(selectedInvoice?.monto_a_cobrar) || 0;
    if (esPagoParcial && montoParcialAbonado) {
      return Number(montoParcialAbonado); // Si abonó 4 UF, usamos 4.
    }
    return original; // Si paga completo, usamos las 10 UF completas.
  };

  const getMontoFinalCalculado = () => {
    if (!selectedInvoice) return 0;
    const moneda = selectedInvoice.contracts?.moneda || 'CLP';
    const montoBase = getMontoBaseActual();

    if (moneda === 'UF') return montoBase * (Number(valorUfDia) || 0);
    if (moneda === 'PORCENTAJE') return Number(montoManualCLP) || 0;
    
    return montoBase; // CLP
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const montoFinalCLP = getMontoFinalCalculado();
    const montoOriginalBase = Number(selectedInvoice.monto_a_cobrar);
    const montoBaseActual = getMontoBaseActual();

    if (montoFinalCLP <= 0) {
      alert('El monto final en pesos (CLP) debe ser mayor a 0.');
      return;
    }

    if (esPagoParcial && montoBaseActual >= montoOriginalBase) {
      alert('El pago parcial debe ser MENOR al total de la deuda. Si el cliente pagó todo, desmarca "Pago Parcial".');
      return;
    }

    setConfirming(true);
    try {
      if (esPagoParcial) {
        // Enviar al sistema la liquidación de la parte que se pagó y crear el saldo restante
        await registerPartialPayment({
          invoiceId: selectedInvoice.id,
          comprobanteUrl: comprobanteUrl.trim() || null,
          fechaPagoReal: fechaPagoReal,
          montoFinalClp: montoFinalCLP,
          montoRestanteBase: montoOriginalBase - montoBaseActual, // Lo que quedó debiendo
          valorUfDia: selectedInvoice.contracts?.moneda === 'UF' ? parseFloat(valorUfDia) : null
        });
      } else {
        // Pago Normal Completo
        await confirmInvoicePayment({
          invoiceId: selectedInvoice.id,
          comprobanteUrl: comprobanteUrl.trim() || null,
          fechaPagoReal: fechaPagoReal,
          montoFinalClp: montoFinalCLP,
          valorUfDia: selectedInvoice.contracts?.moneda === 'UF' ? parseFloat(valorUfDia) : null
        });
      }

      setSelectedInvoice(null);
      await loadInvoices(); 
    } catch (err) {
      alert('Ocurrió un error al confirmar el pago.');
    } finally {
      setConfirming(false);
    }
  };

  // Filtrado
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.folio_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.contracts?.clients?.nombre_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.contracts?.services?.nombre_servicio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'TODOS') return matchesSearch;
    return matchesSearch && inv.estado_pago === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <header className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-blue-900" />
          Control de Cobros & Facturación
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestión de cuotas, pagos parciales, morosidades y repartición automática
        </p>
      </header>

      {/* BÚSQUEDA Y FILTROS ACTUALIZADOS */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm text-xs font-semibold overflow-x-auto">
          {['TODOS', 'PENDIENTE', 'ATRASADO', 'PAGADO'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === status 
                  ? status === 'ATRASADO' ? 'bg-rose-700 text-white' : 'bg-blue-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Folio / Cuota</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Servicio</th>
                <th className="px-6 py-3 font-semibold">Monto Acordado</th>
                <th className="px-6 py-3 font-semibold">Vencimiento</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando datos...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-xs">No hay cobros en este estado.</td></tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const moneda = inv.contracts?.moneda || 'CLP';
                  const monto = Number(inv.monto_a_cobrar);
                  let displayMonto = `$${monto.toLocaleString('es-CL')} CLP`;
                  if (moneda === 'UF') displayMonto = `${monto} UF`;
                  if (moneda === 'PORCENTAJE') displayMonto = `${monto}% del éxito`;
                  if (inv.estado_pago === 'PAGADO' && moneda !== 'CLP') {
                    displayMonto = `$${monto.toLocaleString('es-CL')} CLP (Convertido)`;
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {inv.folio_interno}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {inv.contracts?.clients?.nombre_razon_social || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {inv.contracts?.services?.nombre_servicio}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className={`px-2 py-1 rounded-md text-xs border ${moneda === 'UF' ? 'bg-indigo-50 text-indigo-700' : 'bg-transparent'}`}>
                          {displayMonto}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {inv.fecha_vencimiento}
                      </td>
                      <td className="px-6 py-4">
                        {inv.estado_pago === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                          </span>
                        ) : inv.estado_pago === 'ATRASADO' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3.5 w-3.5" /> Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(inv.estado_pago === 'PENDIENTE' || inv.estado_pago === 'ATRASADO') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(inv)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 border border-transparent hover:border-slate-200 transition-all">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => openConfirmModal(inv)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">
                              <FileCheck2 className="h-3.5 w-3.5" /> Liquidar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">
                            {inv.fecha_pago_real?.split('T')[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL 1: EDITAR CUOTA (FECHA Y MONTO) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Editar Cuota</h3>
              <button onClick={() => setEditingInvoice(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={editData.fecha_vencimiento}
                  onChange={(e) => setEditData({...editData, fecha_vencimiento: e.target.value})}
                  className="w-full rounded-lg border p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto de esta cuota</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editData.monto_a_cobrar}
                  onChange={(e) => setEditData({...editData, monto_a_cobrar: e.target.value})}
                  className="w-full rounded-lg border p-2.5 text-sm font-bold"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setEditingInvoice(null)} className="text-sm font-semibold text-slate-600 px-4">Cancelar</button>
                <button type="submit" disabled={confirming} className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-semibold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR PAGO Y PAGO PARCIAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Liquidar Ingreso</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInvoice.folio_interno}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <p>Cliente: <strong>{selectedInvoice.contracts?.clients?.nombre_razon_social}</strong></p>
                <p>Deuda Original: <strong>{selectedInvoice.monto_a_cobrar} {selectedInvoice.contracts?.moneda}</strong></p>
              </div>

              {/* OPCIÓN PAGO PARCIAL */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPagoParcial}
                    onChange={(e) => {
                      setEsPagoParcial(e.target.checked);
                      if (!e.target.checked) setMontoParcialAbonado('');
                    }}
                    className="h-4 w-4 rounded text-blue-900 focus:ring-blue-800"
                  />
                  <span className="text-sm font-bold text-blue-950">El cliente hizo un Abono / Pago Parcial</span>
                </label>

                {esPagoParcial && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">
                      ¿Cuánto abonó realmente en {selectedInvoice.contracts?.moneda}?
                    </label>
                    <input
                      type="number"
                      step="any"
                      required={esPagoParcial}
                      placeholder={`Ej: 4 si abonó 4 UF`}
                      value={montoParcialAbonado}
                      onChange={(e) => setMontoParcialAbonado(e.target.value)}
                      className="w-full rounded border border-blue-300 p-2 text-sm bg-white"
                    />
                    <p className="text-[10px] text-blue-700 mt-1">El sistema generará una nueva boleta por el saldo restante automáticamente.</p>
                  </div>
                )}
              </div>

              {/* LÓGICAS CONDICIONALES DE UF Y PORCENTAJE */}
              {selectedInvoice.contracts?.moneda === 'UF' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Valor UF del día *</label>
                  <input type="number" step="any" required placeholder="37500" value={valorUfDia} onChange={(e) => setValorUfDia(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
                </div>
              )}

              {selectedInvoice.contracts?.moneda === 'PORCENTAJE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total ganado en Pesos (CLP) *</label>
                  <input type="number" step="any" required placeholder="500000" value={montoManualCLP} onChange={(e) => setMontoManualCLP(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
                </div>
              )}

              <div className="rounded-xl bg-slate-900 p-4 shadow-inner text-white flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-300">CLP a Repartir (Caja y Socios)</span>
                <span className="text-xl font-bold">${getMontoFinalCalculado().toLocaleString('es-CL')}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha de Ingreso</label>
                  <input type="date" required value={fechaPagoReal} onChange={(e) => setFechaPagoReal(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Link de Comprobante</label>
                  <input type="text" placeholder="URL opcional..." value={comprobanteUrl} onChange={(e) => setComprobanteUrl(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedInvoice(null)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={confirming || getMontoFinalCalculado() <= 0} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4" /> {confirming ? 'Procesando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}