'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Download, 
  Printer, 
  TrendingUp, 
  ArrowDownRight, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { getInvoices, getExpenses } from '@/services/eosApi';

export default function ReportesPage() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha (Por defecto mes y año actual)
  const fechaActual = new Date();
  const [selectedYear, setSelectedYear] = useState(fechaActual.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(fechaActual.getMonth() + 1);

  const loadData = async () => {
    setLoading(true);
    const [invData, expData] = await Promise.all([
      getInvoices(),
      getExpenses()
    ]);
    setInvoices(invData);
    setExpenses(expData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar ingresos pagados en el mes y año seleccionado
  const ingresosDelMes = invoices.filter(inv => {
    if (inv.estado_pago !== 'PAGADO' || !inv.fecha_pago_real) return false;
    // Extraer año y mes de la fecha de pago real
    const [year, month] = inv.fecha_pago_real.split('T')[0].split('-');
    return Number(year) === selectedYear && Number(month) === selectedMonth;
  });

  // Filtrar gastos del mes seleccionado
  const gastosDelMes = expenses.filter(exp => {
    if (!exp.fecha_gasto) return false;
    const [year, month] = exp.fecha_gasto.split('-');
    return Number(year) === selectedYear && Number(month) === selectedMonth;
  });

  // Cálculos Financieros del Mes
  const totalIngresos = ingresosDelMes.reduce((acc, inv) => acc + Number(inv.monto_a_cobrar), 0);
  const cajaEmpresa30 = totalIngresos * 0.30;
  const totalRepartidoSocios70 = totalIngresos * 0.70;
  
  const totalGastosOperacionales = gastosDelMes
    .filter(g => !g.es_deuda_socio)
    .reduce((acc, g) => acc + Number(g.monto), 0);

  const balanceNetoEmpresa = cajaEmpresa30 - totalGastosOperacionales;

  // Función para imprimir Vouchers
  const generarVoucherPDF = (inv) => {
    const monto = Number(inv.monto_a_cobrar).toLocaleString('es-CL');
    const fecha = inv.fecha_pago_real.split('T')[0];
    const cliente = inv.contracts?.clients?.nombre_razon_social || 'Cliente EOS';
    const servicio = inv.contracts?.services?.nombre_servicio || 'Servicio Profesional';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Pago - ${inv.folio_interno}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .voucher-box { max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .content p { margin: 10px 0; font-size: 14px; line-height: 1.5; }
            .content strong { color: #0f172a; }
            .monto-box { background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 22px; font-weight: bold; color: #0f172a; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <div class="logo">SERVICIOS EOS</div>
              <div class="subtitle">Comprobante de Ingreso</div>
            </div>
            <div class="content">
              <p><strong>Folio de Transacción:</strong> ${inv.folio_interno}</p>
              <p><strong>Fecha de Recepción:</strong> ${fecha}</p>
              <p><strong>Recibí de:</strong> ${cliente}</p>
              <p><strong>Por concepto de:</strong> ${servicio}</p>
              <div class="monto-box">
                $${monto} CLP
              </div>
              <p style="text-align: center; color: #059669; font-weight: bold; font-size: 12px;">
                ✔ PAGO RECIBIDO Y CONFIRMADO
              </p>
            </div>
            <div class="footer">
              Servicios EOS - Blindaje Legal & Inteligencia Tecnológica<br>
              Documento emitido electrónicamente.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* HEADER Y FILTROS */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-900" />
            Cierres y Reportes Financieros
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas mensuales, balance de caja y generación de comprobantes
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <CalendarIcon className="h-5 w-5 text-slate-400 ml-2" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-slate-800 outline-none p-1 cursor-pointer"
          >
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((mes, index) => (
              <option key={index + 1} value={index + 1}>{mes}</option>
            ))}
          </select>
          <span className="text-slate-300">|</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-slate-800 outline-none p-1 cursor-pointer pr-2"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      {/* MÉTRICAS DE CIERRE */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Ingresos Totales (Mes)</p>
          <div className="text-3xl font-extrabold text-slate-900">
            ${totalIngresos.toLocaleString('es-CL')}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Dinero bruto recibido
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Aporte Caja Empresa (30%)</p>
          <div className="text-3xl font-extrabold text-blue-900">
            ${cajaEmpresa30.toLocaleString('es-CL')}
          </div>
          <p className="text-xs text-slate-500 mt-2">Retención oficial EOS</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gastos Operacionales</p>
          <div className="text-3xl font-extrabold text-rose-700">
            ${totalGastosOperacionales.toLocaleString('es-CL')}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" /> Egresos del mes
          </p>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${balanceNetoEmpresa >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${balanceNetoEmpresa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Balance Neto Empresa
          </p>
          <div className={`text-3xl font-extrabold ${balanceNetoEmpresa >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            ${balanceNetoEmpresa.toLocaleString('es-CL')}
          </div>
          <p className={`text-xs mt-2 font-medium ${balanceNetoEmpresa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Caja Empresa (30%) - Gastos
          </p>
        </div>
      </section>

      {/* TABLA DE VOUCHERS */}
      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pagos Recibidos en el Mes</h2>
            <p className="text-xs text-slate-500">Haz clic en el botón de impresora para generar el voucher del cliente.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Fecha Pago</th>
                <th className="px-6 py-3 font-semibold">Folio</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Servicio</th>
                <th className="px-6 py-3 font-semibold">Monto Ingresado</th>
                <th className="px-6 py-3 font-semibold text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">Calculando cierre mensual...</td>
                </tr>
              ) : ingresosDelMes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">No hay ingresos registrados en este mes.</td>
                </tr>
              ) : (
                ingresosDelMes.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {inv.fecha_pago_real.split('T')[0]}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{inv.folio_interno}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {inv.contracts?.clients?.nombre_razon_social || 'Cliente'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {inv.contracts?.services?.nombre_servicio || 'Servicio'}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">
                      ${Number(inv.monto_a_cobrar).toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => generarVoucherPDF(inv)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                      >
                        <Printer className="h-3.5 w-3.5" /> Voucher
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}