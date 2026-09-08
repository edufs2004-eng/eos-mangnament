'use client';

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Check, 
  X, 
  FileCheck2,
  DollarSign,
  Calendar,
  Calculator
} from 'lucide-react';
import { getInvoices, confirmInvoicePayment } from '@/services/eosApi';

export default function CobrosPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  // Modal de confirmación de pago
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [confirming, setConfirming] = useState(false);
  
  // Campos del Formulario de Pago
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [fechaPagoReal, setFechaPagoReal] = useState('');
  const [valorUfDia, setValorUfDia] = useState('');
  const [montoManualCLP, setMontoManualCLP] = useState('');

  // Cargar lista de cobros
  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openConfirmModal = (inv) => {
    setSelectedInvoice(inv);
    setComprobanteUrl('');
    setFechaPagoReal(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
    setValorUfDia('');
    setMontoManualCLP('');
  };

  // Cálculo en vivo del monto final en CLP según la moneda
  const getMontoFinalCalculado = () => {
    if (!selectedInvoice) return 0;
    const moneda = selectedInvoice.contracts?.moneda || 'CLP';
    const montoBase = Number(selectedInvoice.monto_a_cobrar);

    if (moneda === 'UF') {
      return montoBase * (Number(valorUfDia) || 0);
    }
    if (moneda === 'PORCENTAJE') {
      return Number(montoManualCLP) || 0;
    }
    return montoBase; // CLP normal
  };

  // Procesar confirmación de pago
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const montoFinal = getMontoFinalCalculado();
    if (montoFinal <= 0) {
      alert('El monto final en pesos (CLP) debe ser mayor a 0 para repartir las comisiones.');
      return;
    }

    setConfirming(true);
    try {
      await confirmInvoicePayment({
        invoiceId: selectedInvoice.id,
        comprobanteUrl: comprobanteUrl.trim(),
        fechaPagoReal: fechaPagoReal,
        montoFinalClp: montoFinal,
        valorUfDia: selectedInvoice.contracts?.moneda === 'UF' ? parseFloat(valorUfDia) : null
      });

      setSelectedInvoice(null);
      await loadInvoices(); // Recargar datos
    } catch (err) {
      alert('Ocurrió un error al confirmar el pago.');
    } finally {
      setConfirming(false);
    }
  };

  // Filtrado de boletas
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
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-900" />
            Control de Cobros & Facturación
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de cuotas en UF/Pesos/%, cobros retroactivos y repartición automática
          </p>
        </div>
      </header>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm text-xs font-semibold">
          {['TODOS', 'PENDIENTE', 'PAGADO'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status 
                  ? 'bg-blue-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE BOLETAS / CUOTAS */}
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
                <th className="px-6 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-xs">
                    Cargando listado de facturación...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No hay cobros registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const moneda = inv.contracts?.moneda || 'CLP';
                  const monto = Number(inv.monto_a_cobrar);
                  
                  let displayMonto = `$${monto.toLocaleString('es-CL')} CLP`;
                  if (moneda === 'UF') displayMonto = `${monto} UF`;
                  if (moneda === 'PORCENTAJE') displayMonto = `${monto}% del total`;
                  
                  // Si ya está pagado en UF o %, el monto_a_cobrar ya se convirtió a CLP reales.
                  if (inv.estado_pago === 'PAGADO' && moneda !== 'CLP') {
                    displayMonto = `$${monto.toLocaleString('es-CL')} CLP (Convertido)`;
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {inv.folio_interno}
                        {inv.numero_cuota_actual > 1 && (
                          <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                            Cuota N° {inv.numero_cuota_actual}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {inv.contracts?.clients?.nombre_razon_social || 'Cliente General'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5">
                          {inv.contracts?.services?.nombre_servicio || 'Servicio'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className={`px-2 py-1 rounded-md text-xs border ${
                          moneda === 'UF' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          moneda === 'PORCENTAJE' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                          'bg-transparent border-transparent'
                        }`}>
                          {displayMonto}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {inv.fecha_vencimiento}
                      </td>
                      <td className="px-6 py-4">
                        {inv.estado_pago === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.estado_pago === 'PENDIENTE' ? (
                          <button
                            onClick={() => openConfirmModal(inv)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
                          >
                            <FileCheck2 className="h-3.5 w-3.5" /> Liquidar
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">
                            {inv.fecha_pago_real ? inv.fecha_pago_real.split('T')[0] : 'Liquidado'}
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

      {/* MODAL PARA CONFIRMAR PAGO */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Liquidar Cobro</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInvoice.folio_interno}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                <p>Cliente: <strong>{selectedInvoice.contracts?.clients?.nombre_razon_social}</strong></p>
                <p>Servicio: {selectedInvoice.contracts?.services?.nombre_servicio}</p>
              </div>

              {/* LÓGICA CONDICIONAL DE MONEDA */}
              {selectedInvoice.contracts?.moneda === 'UF' && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
                  <div className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> Cobro estipulado: {selectedInvoice.monto_a_cobrar} UF
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 uppercase mb-1">
                      Valor de la UF del día de pago *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 37500"
                      value={valorUfDia}
                      onChange={(e) => setValorUfDia(e.target.value)}
                      className="w-full rounded-lg border border-indigo-300 p-2 text-sm text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              {selectedInvoice.contracts?.moneda === 'PORCENTAJE' && (
                <div className="p-4 rounded-xl bg-fuchsia-50 border border-fuchsia-200 space-y-3">
                  <div className="text-sm font-bold text-fuchsia-900 flex items-center gap-2">
                    <Calculator className="h-4 w-4" /> Cobro estipulado: {selectedInvoice.monto_a_cobrar}% del éxito
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-fuchsia-900 uppercase mb-1">
                      Monto final ganado en Pesos (CLP) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 500000"
                      value={montoManualCLP}
                      onChange={(e) => setMontoManualCLP(e.target.value)}
                      className="w-full rounded-lg border border-fuchsia-300 p-2 text-sm text-slate-900 outline-none focus:border-fuchsia-600"
                    />
                  </div>
                </div>
              )}

              {/* MONTO FINAL EN PESOS PARA REPARTIR */}
              <div className="rounded-xl bg-blue-900 p-4 shadow-inner text-white flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-blue-200">Monto final a repartir (CLP)</span>
                <span className="text-xl font-bold">
                  ${getMontoFinalCalculado().toLocaleString('es-CL')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Real de Pago</label>
                  <input
                    type="date"
                    required
                    value={fechaPagoReal}
                    onChange={(e) => setFechaPagoReal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Comprobante (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Enlace o folio"
                    value={comprobanteUrl}
                    onChange={(e) => setComprobanteUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirming || getMontoFinalCalculado() <= 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {confirming ? 'Procesando...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}