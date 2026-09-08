'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Search, 
  X, 
  FileCheck2,
  Edit,
  AlertCircle,
  UploadCloud,
  ImageIcon,
  ExternalLink
} from 'lucide-react';
import { 
  getInvoices, 
  confirmInvoicePayment, 
  updateInvoiceRecord, 
  registerPartialPayment,
  uploadComprobante,
  updateComprobanteUrl
} from '@/services/eosApi';

export default function CobrosPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [receiptInvoice, setReceiptInvoice] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [fechaPagoReal, setFechaPagoReal] = useState('');
  const [valorUfDia, setValorUfDia] = useState('');
  const [montoManualCLP, setMontoManualCLP] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  
  const [esPagoParcial, setEsPagoParcial] = useState(false);
  const [montoParcialAbonado, setMontoParcialAbonado] = useState('');

  const [editData, setEditData] = useState({
    fecha_vencimiento: '',
    monto_a_cobrar: ''
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

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
      // 🛠️ CORRECCIÓN: Obtener la fecha actual en formato local 'YYYY-MM-DD' de forma exacta
      const ahora = new Date();
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const day = String(ahora.getDate()).padStart(2, '0');
      const hoyString = `${year}-${month}-${day}`;

      let nuevoEstado = editingInvoice.estado_pago;

      if (nuevoEstado !== 'PAGADO') {
        // Transformamos ambas fechas a números enteros (ej: '2026-06-05' -> 20260605) 
        // para hacer una comparación matemática infalible sin problemas de zona horaria.
        const numVencimiento = parseInt(editData.fecha_vencimiento.replace(/-/g, ''), 10);
        const numHoy = parseInt(hoyString.replace(/-/g, ''), 10);

        // Si la fecha de vencimiento es menor (anterior) a hoy, queda en ATRASADO. Si es igual o mayor, queda en PENDIENTE.
        nuevoEstado = numVencimiento < numHoy ? 'ATRASADO' : 'PENDIENTE';
      }

      await updateInvoiceRecord(editingInvoice.id, {
        fecha_vencimiento: editData.fecha_vencimiento,
        monto_a_cobrar: parseFloat(editData.monto_a_cobrar),
        estado_pago: nuevoEstado
      });

      setEditingInvoice(null);
      await loadInvoices();
    } catch (err) {
      alert('Error al actualizar la cuota.');
    } finally {
      setConfirming(false);
    }
  };

  const handleUpdateReceipt = async (e) => {
    e.preventDefault();
    if (!comprobanteFile) return alert('Debes seleccionar un archivo.');
    
    setUploadingFile(true);
    try {
      const publicUrl = await uploadComprobante(comprobanteFile);
      await updateComprobanteUrl(receiptInvoice.id, publicUrl);
      setReceiptInvoice(null);
      setComprobanteFile(null);
      await loadInvoices();
    } catch (err) {
      alert('Error al subir el comprobante.');
    } finally {
      setUploadingFile(false);
    }
  };

  const openConfirmModal = (inv) => {
    setSelectedInvoice(inv);
    setComprobanteFile(null);
    setFechaPagoReal(new Date().toISOString().split('T')[0]);
    setValorUfDia('');
    setMontoManualCLP('');
    setEsPagoParcial(false);
    setMontoParcialAbonado('');
  };

  const getMontoBaseActual = () => {
    const original = Number(selectedInvoice?.monto_a_cobrar) || 0;
    if (esPagoParcial && montoParcialAbonado) return Number(montoParcialAbonado);
    return original;
  };

  const getMontoFinalCalculado = () => {
    if (!selectedInvoice) return 0;
    const moneda = selectedInvoice.contracts?.moneda || 'CLP';
    const montoBase = getMontoBaseActual();

    if (moneda === 'UF') return montoBase * (Number(valorUfDia) || 0);
    if (moneda === 'PORCENTAJE') return Number(montoManualCLP) || 0;
    return montoBase;
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!comprobanteFile) return alert('Subir el comprobante de pago es OBLIGATORIO.');

    const montoFinalCLP = getMontoFinalCalculado();
    const montoOriginalBase = Number(selectedInvoice.monto_a_cobrar);
    const montoBaseActual = getMontoBaseActual();

    if (montoFinalCLP <= 0) return alert('El monto final en pesos (CLP) debe ser mayor a 0.');
    if (esPagoParcial && montoBaseActual >= montoOriginalBase) {
      return alert('El pago parcial debe ser MENOR al total de la deuda.');
    }

    setConfirming(true);
    try {
      const publicUrl = await uploadComprobante(comprobanteFile);

      if (esPagoParcial) {
        await registerPartialPayment({
          invoiceId: selectedInvoice.id,
          comprobanteUrl: publicUrl,
          fechaPagoReal: fechaPagoReal,
          montoFinalClp: montoFinalCLP,
          montoRestanteBase: montoOriginalBase - montoBaseActual,
          valorUfDia: selectedInvoice.contracts?.moneda === 'UF' ? parseFloat(valorUfDia) : null
        });
      } else {
        await confirmInvoicePayment({
          invoiceId: selectedInvoice.id,
          comprobanteUrl: publicUrl,
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

  const filteredInvoices = invoices.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    const folio = (inv.folio_interno || '').toLowerCase();
    const cliente = (inv.contracts?.clients?.nombre_razon_social || '').toLowerCase();
    const servicio = (inv.contracts?.services?.nombre_servicio || '').toLowerCase();
    
    const matchesSearch = folio.includes(searchLower) || cliente.includes(searchLower) || servicio.includes(searchLower);
    const dbStatus = (inv.estado_pago || '').toUpperCase();

    if (statusFilter === 'TODOS') return matchesSearch;
    return matchesSearch && dbStatus === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-amber-600" />
          Control de Cobros & Facturación
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestión de cuotas, verificación de comprobantes y repartición automática
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center bg-white rounded-2xl border border-slate-200 p-1 shadow-sm text-xs font-bold overflow-x-auto">
          {['TODOS', 'PENDIENTE', 'ATRASADO', 'PAGADO'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
                statusFilter === status 
                  ? status === 'ATRASADO' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-amber-400' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Folio / Cuota</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Monto Acordado</th>
                <th className="px-6 py-3 font-semibold">Vencimiento</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando datos...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">No hay cobros en este estado.</td></tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const moneda = inv.contracts?.moneda || 'CLP';
                  const monto = Number(inv.monto_a_cobrar);
                  let displayMonto = `$${monto.toLocaleString('es-CL')} CLP`;
                  if (moneda === 'UF') displayMonto = `${monto} UF`;
                  if (moneda === 'PORCENTAJE') displayMonto = `${monto}% del éxito`;
                  
                  const uiStatus = (inv.estado_pago || '').toUpperCase();
                  if (uiStatus === 'PAGADO' && moneda !== 'CLP') displayMonto = `$${monto.toLocaleString('es-CL')} CLP (Convertido)`;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-950">{inv.folio_interno}</td>
                      <td className="px-6 py-4 font-bold text-slate-950">
                        {inv.contracts?.clients?.nombre_razon_social || 'Desconocido'}
                        <span className="block text-xs font-normal text-slate-500">{inv.contracts?.services?.nombre_servicio}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-950">
                        <span className={`px-2 py-1 rounded-md text-xs border ${moneda === 'UF' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-transparent'}`}>
                          {displayMonto}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{inv.fecha_vencimiento}</td>
                      <td className="px-6 py-4">
                        {uiStatus === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                          </span>
                        ) : uiStatus === 'ATRASADO' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3.5 w-3.5" /> Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                            <Clock className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(uiStatus === 'PENDIENTE' || uiStatus === 'ATRASADO') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(inv)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 border border-transparent hover:border-slate-200 transition-all">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => openConfirmModal(inv)} className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-400 shadow-sm hover:bg-slate-900 transition-colors">
                              <FileCheck2 className="h-3.5 w-3.5" /> Liquidar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => openReceiptModal(inv)} className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200">
                            <ImageIcon className="h-3.5 w-3.5" /> Comprobante
                          </button>
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

      {/* MODAL 1: EDITAR CUOTA */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">Editar Cuota</h3>
              <button onClick={() => setEditingInvoice(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha de Vencimiento</label>
                <input type="date" required value={editData.fecha_vencimiento} onChange={(e) => setEditData({...editData, fecha_vencimiento: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" />
                <p className="text-[10px] text-slate-400 mt-1">Al cambiar la fecha, el estado se ajustará automáticamente a Pendiente o Atrasado.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto de esta cuota</label>
                <input type="number" step="any" required value={editData.monto_a_cobrar} onChange={(e) => setEditData({...editData, monto_a_cobrar: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm font-bold" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setEditingInvoice(null)} className="text-sm font-semibold text-slate-600 px-4">Cancelar</button>
                <button type="submit" disabled={confirming} className="bg-slate-950 text-amber-400 px-5 py-2 rounded-xl text-sm font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPROBANTE ANTIGUO */}
      {receiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Comprobante de Pago</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{receiptInvoice.folio_interno}</p>
              </div>
              <button onClick={() => setReceiptInvoice(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateReceipt} className="p-6 space-y-4">
              {receiptInvoice.comprobante_url ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-800">Ya existe un comprobante</span>
                  <a href={receiptInvoice.comprobante_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">
                    Ver Archivo <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-900">
                  Este pago antiguo no tiene comprobante adjunto.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Subir o Reemplazar Archivo (PDF / IMG)</label>
                <input 
                  type="file" 
                  ref={editFileInputRef}
                  accept="image/*,.pdf"
                  onChange={(e) => setComprobanteFile(e.target.files[0])}
                  className="hidden" 
                />
                <div 
                  onClick={() => editFileInputRef.current.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-amber-500 transition-colors"
                >
                  <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-sm font-semibold text-slate-700 block">
                    {comprobanteFile ? comprobanteFile.name : 'Haz clic para seleccionar archivo'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setReceiptInvoice(null)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cerrar</button>
                <button type="submit" disabled={uploadingFile || !comprobanteFile} className="bg-slate-950 text-amber-400 px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                  {uploadingFile ? 'Subiendo...' : 'Guardar Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAR PAGO NUEVO */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Liquidar Ingreso</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInvoice.folio_interno}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-rose-600 uppercase mb-2">Comprobante de Pago * (Obligatorio)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setComprobanteFile(e.target.files[0])}
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${comprobanteFile ? 'border-emerald-400 bg-emerald-50' : 'border-rose-300 bg-rose-50 hover:bg-rose-100'}`}
                >
                  <UploadCloud className={`h-6 w-6 mx-auto mb-1 ${comprobanteFile ? 'text-emerald-500' : 'text-rose-400'}`} />
                  <span className={`text-xs font-bold block ${comprobanteFile ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {comprobanteFile ? comprobanteFile.name : 'Haz clic para subir la transferencia'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={esPagoParcial} onChange={(e) => { setEsPagoParcial(e.target.checked); if (!e.target.checked) setMontoParcialAbonado(''); }} className="h-4 w-4 rounded text-amber-600" />
                  <span className="text-xs font-bold text-amber-950">El cliente hizo un Abono Parcial</span>
                </label>
                {esPagoParcial && (
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">¿Cuánto abonó en {selectedInvoice.contracts?.moneda}?</label>
                    <input type="number" step="any" required={esPagoParcial} value={montoParcialAbonado} onChange={(e) => setMontoParcialAbonado(e.target.value)} className="w-full rounded-xl border border-amber-300 p-2 text-sm bg-white" />
                  </div>
                )}
              </div>

              {selectedInvoice.contracts?.moneda === 'UF' && (
                <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Valor UF del día *</label><input type="number" step="any" required value={valorUfDia} onChange={(e) => setValorUfDia(e.target.value)} className="w-full rounded-xl border p-2.5 text-sm" /></div>
              )}
              {selectedInvoice.contracts?.moneda === 'PORCENTAJE' && (
                <div><label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total ganado (CLP) *</label><input type="number" step="any" required value={montoManualCLP} onChange={(e) => setMontoManualCLP(e.target.value)} className="w-full rounded-xl border p-2.5 text-sm" /></div>
              )}

              <div className="rounded-2xl bg-[#090d16] p-4 shadow-inner text-white flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-300">CLP a Repartir</span>
                <span className="text-xl font-bold text-amber-400">${getMontoFinalCalculado().toLocaleString('es-CL')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha Real de Ingreso</label>
                <input type="date" required value={fechaPagoReal} onChange={(e) => setFechaPagoReal(e.target.value)} className="w-full rounded-xl border p-2.5 text-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedInvoice(null)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={confirming || getMontoFinalCalculado() <= 0} className="bg-slate-950 text-amber-400 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                  {confirming ? 'Subiendo...' : 'Confirmar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}