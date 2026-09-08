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
  Calendar,
  Building2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { getInvoices, confirmInvoicePayment } from '@/services/eosApi';

export default function CobrosPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  // Modal de confirmación de pago
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [confirming, setConfirming] = useState(false);

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

  // Procesar confirmación de pago
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setConfirming(true);
    try {
      await confirmInvoicePayment(selectedInvoice.id, comprobanteUrl.trim() || null);
      setSelectedInvoice(null);
      setComprobanteUrl('');
      await loadInvoices(); // Recargar datos para ver el estado actualizado
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

  // Métricas rápidas
  const totalPendiente = invoices
    .filter((inv) => inv.estado_pago === 'PENDIENTE')
    .reduce((acc, curr) => acc + Number(curr.monto_a_cobrar), 0);

  const totalCobrado = invoices
    .filter((inv) => inv.estado_pago === 'PAGADO')
    .reduce((acc, curr) => acc + Number(curr.monto_a_cobrar), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-900" />
            Control de Cobros & Facturación
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de cuotas, verificación de transferencias y repartición automática 30/70
          </p>
        </div>
      </header>

      {/* METRICAS DE FACTURACIÓN */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Por Cobrar (Pendiente)</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><Clock className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-700">
              ${totalPendiente.toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-slate-500">Total en cuotas activas por recibir</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Recaudado</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-800">
              ${totalCobrado.toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-slate-500">Ingresado y distribuido a la caja y socios</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regla de Negocio</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-900"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-900">30% Empresa / 70% Ejecutor</div>
            <p className="mt-1 text-xs text-slate-500">El cálculo se ejecuta automáticamente en la BD al confirmar cada pago</p>
          </div>
        </div>
      </section>

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
                <th className="px-6 py-3 font-semibold">Monto</th>
                <th className="px-6 py-3 font-semibold">Reparto (30/70)</th>
                <th className="px-6 py-3 font-semibold">Vencimiento</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500 text-xs">
                    Cargando listado de facturación...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No hay cobros registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const monto = Number(inv.monto_a_cobrar);
                  const retencionEmpresa = monto * 0.30;
                  const ejecutorSocio = monto * 0.70;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {inv.folio_interno}
                        {inv.numero_cuota_actual > 1 && (
                          <span className="block text-[10px] text-slate-400 font-sans font-normal">
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
                        ${monto.toLocaleString('es-CL')} CLP
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-blue-900 font-medium">Empresa: ${retencionEmpresa.toLocaleString('es-CL')}</div>
                        <div className="text-slate-500">Socio: ${ejecutorSocio.toLocaleString('es-CL')}</div>
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
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
                          >
                            <FileCheck2 className="h-3.5 w-3.5" /> Confirmar Pago
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Liquidado</span>
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
                <h3 className="text-lg font-bold text-slate-900">Confirmar Recepción de Pago</h3>
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
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold text-sm text-blue-950 mb-1">
                  Monto: ${Number(selectedInvoice.monto_a_cobrar).toLocaleString('es-CL')} CLP
                </div>
                <p>Cliente: <strong>{selectedInvoice.contracts?.clients?.nombre_razon_social}</strong></p>
                <p>Servicio: {selectedInvoice.contracts?.services?.nombre_servicio}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Al hacer clic en confirmar, la base de datos ingresará automáticamente el <strong>30% a la Caja de la Empresa</strong> y asignará el <strong>70% al socio correspondiente</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Comprobante o Link de Transferencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/comprobante.pdf"
                  value={comprobanteUrl}
                  onChange={(e) => setComprobanteUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={confirming}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {confirming ? 'Procesando...' : 'Confirmar y Repartir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}