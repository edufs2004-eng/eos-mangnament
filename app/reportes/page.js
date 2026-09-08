'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Printer, 
  TrendingUp, 
  ArrowDownRight, 
  FileText,
  PieChart,
  Receipt
} from 'lucide-react';
import { getInvoices, getExpenses } from '@/services/eosApi';

export default function ReportesPage() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha
  const fechaActual = new Date();
  const [selectedYear, setSelectedYear] = useState(fechaActual.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(fechaActual.getMonth() + 1);

  const loadData = async () => {
    setLoading(true);
    const [invData, expData] = await Promise.all([getInvoices(), getExpenses()]);
    setInvoices(invData);
    setExpenses(expData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // =================================================================
  // CÁLCULOS DEL MES SELECCIONADO
  // =================================================================
  const mesString = String(selectedMonth).padStart(2, '0');
  
  const facturasMes = invoices.filter(inv => 
    inv.estado_pago === 'PAGADO' && inv.fecha_pago_real?.startsWith(`${selectedYear}-${mesString}`)
  );
  
  const gastosMes = expenses.filter(exp => 
    exp.fecha_gasto?.startsWith(`${selectedYear}-${mesString}`) && !exp.es_deuda_socio
  );

  let ingresosBrutosMes = 0;
  let cajaEmpresaMes = 0;
  let liquidacionLegalMes = 0;
  let liquidacionTechMes = 0;

  facturasMes.forEach(inv => {
    const monto = Number(inv.monto_a_cobrar);
    const pctCaja = Number(inv.contracts?.services?.pct_caja_empresa ?? 30) / 100;
    const pctLegal = Number(inv.contracts?.services?.pct_ejecutor_legal ?? 70) / 100;
    const pctTech = Number(inv.contracts?.services?.pct_ejecutor_tech ?? 0) / 100;

    ingresosBrutosMes += monto;
    cajaEmpresaMes += (monto * pctCaja);
    liquidacionLegalMes += (monto * pctLegal);
    liquidacionTechMes += (monto * pctTech);
  });

  const totalGastosMes = gastosMes.reduce((acc, g) => acc + Number(g.monto), 0);
  const balanceNetoMes = cajaEmpresaMes - totalGastosMes;

  // =================================================================
  // CÁLCULOS DEL AÑO SELECCIONADO (ANUAL)
  // =================================================================
  const facturasAno = invoices.filter(inv => 
    inv.estado_pago === 'PAGADO' && inv.fecha_pago_real?.startsWith(`${selectedYear}`)
  );
  
  const gastosAno = expenses.filter(exp => 
    exp.fecha_gasto?.startsWith(`${selectedYear}`) && !exp.es_deuda_socio
  );

  let ingresosBrutosAno = 0;
  let cajaEmpresaAno = 0;
  let liquidacionLegalAno = 0;
  let liquidacionTechAno = 0;

  facturasAno.forEach(inv => {
    const monto = Number(inv.monto_a_cobrar);
    const pctCaja = Number(inv.contracts?.services?.pct_caja_empresa ?? 30) / 100;
    const pctLegal = Number(inv.contracts?.services?.pct_ejecutor_legal ?? 70) / 100;
    const pctTech = Number(inv.contracts?.services?.pct_ejecutor_tech ?? 0) / 100;

    ingresosBrutosAno += monto;
    cajaEmpresaAno += (monto * pctCaja);
    liquidacionLegalAno += (monto * pctLegal);
    liquidacionTechAno += (monto * pctTech);
  });

  const totalGastosAno = gastosAno.reduce((acc, g) => acc + Number(g.monto), 0);
  const balanceNetoAno = cajaEmpresaAno - totalGastosAno;

  // =================================================================
  // GENERADORES DE PDF (Empresa y Clientes)
  // =================================================================
  const generarPlantillaHTML = (titulo, periodo, ingresos, caja, legal, tech, gastos, balanceNeto, desgloseGastos) => `
    <html>
      <head>
        <title>${titulo} - Servicios EOS</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 40px; }
          .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #1e3a8a; font-size: 28px; letter-spacing: 1px; }
          .header p { margin: 5px 0 0; color: #64748b; font-weight: bold; font-size: 14px; text-transform: uppercase; }
          .section-title { background-color: #f1f5f9; padding: 10px 15px; border-left: 4px solid #3b82f6; font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          th, td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background-color: #f8fafc; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .amount { text-align: right; font-family: monospace; font-size: 15px; font-weight: bold; }
          .expense-row td { color: #991b1b; }
          .summary-box { border: 2px solid #1e3a8a; border-radius: 8px; padding: 20px; margin-top: 40px; text-align: center; background-color: #f8fafc; }
          .summary-box h2 { margin: 0 0 10px; color: #1e3a8a; font-size: 20px; }
          .summary-box .neto { font-size: 32px; font-weight: bold; color: ${balanceNeto >= 0 ? '#047857' : '#be123c'}; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SERVICIOS EOS</h1>
            <p>${titulo} | ${periodo}</p>
          </div>
          <div class="section-title">1. Resumen de Ingresos Brutos</div>
          <table><tr><td>Total Facturado y Cobrado a Clientes</td><td class="amount">$${ingresos.toLocaleString('es-CL')} CLP</td></tr></table>
          <div class="section-title">2. Distribución de Utilidades</div>
          <table>
            <tr><th>Concepto / Departamento</th><th style="text-align: right;">Monto Asignado</th></tr>
            <tr><td>Fondo Caja Empresa (Retención Dinámica)</td><td class="amount" style="color: #1e3a8a;">$${caja.toLocaleString('es-CL')} CLP</td></tr>
            <tr><td>Liquidación a Pagar - División Legal</td><td class="amount" style="color: #b45309;">$${legal.toLocaleString('es-CL')} CLP</td></tr>
            <tr><td>Liquidación a Pagar - División Tech</td><td class="amount" style="color: #0f766e;">$${tech.toLocaleString('es-CL')} CLP</td></tr>
            <tr style="background-color: #f8fafc;"><td style="text-align: right; font-weight: bold; font-size: 12px;">Total Repartido:</td><td class="amount">$${(caja + legal + tech).toLocaleString('es-CL')} CLP</td></tr>
          </table>
          <div class="section-title">3. Detalle de Gastos Operacionales</div>
          <table>
            <tr><th>Descripción del Gasto</th><th style="text-align: right;">Monto</th></tr>
            ${desgloseGastos.length > 0 ? desgloseGastos.map(g => `<tr><td>${g.descripcion}</td><td class="amount" style="color: #991b1b;">-$${Number(g.monto).toLocaleString('es-CL')} CLP</td></tr>`).join('') : '<tr><td colspan="2" style="text-align: center; color: #94a3b8; font-style: italic;">No se registraron gastos operativos.</td></tr>'}
            <tr class="expense-row" style="border-top: 2px solid #fecaca; background-color: #fef2f2;"><td style="font-weight: bold;">TOTAL EGRESOS:</td><td class="amount">-$${gastos.toLocaleString('es-CL')} CLP</td></tr>
          </table>
          <div class="summary-box">
            <h2>BALANCE NETO EMPRESA (CAJA - GASTOS)</h2>
            <div class="neto">$${balanceNeto.toLocaleString('es-CL')} CLP</div>
            <p style="font-size: 13px; color: #64748b; margin-top: 10px;">Dinero líquido real que queda en la cuenta corporativa de Servicios EOS tras pagar honorarios y cubrir egresos.</p>
          </div>
          <div class="footer">Documento de uso interno y confidencial generado automáticamente por el Sistema Operativo EOS.<br>Fecha de emisión: ${new Date().toLocaleString('es-CL')}</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
    </html>
  `;

  const imprimirReporteMensual = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodo = `${meses[selectedMonth - 1]} ${selectedYear}`;
    const html = generarPlantillaHTML('CIERRE CONTABLE MENSUAL', periodo, ingresosBrutosMes, cajaEmpresaMes, liquidacionLegalMes, liquidacionTechMes, totalGastosMes, balanceNetoMes, gastosMes);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const imprimirReporteAnual = () => {
    const html = generarPlantillaHTML('BALANCE FINANCIERO ANUAL', `Año Fiscal ${selectedYear}`, ingresosBrutosAno, cajaEmpresaAno, liquidacionLegalAno, liquidacionTechAno, totalGastosAno, balanceNetoAno, gastosAno);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Generador del Voucher Simple para el Cliente
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
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .voucher-box { max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; }
            .subtitle { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .content p { margin: 10px 0; font-size: 14px; line-height: 1.5; }
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
              <div class="monto-box">$${monto} CLP</div>
              <p style="text-align: center; color: #059669; font-weight: bold; font-size: 12px;">✔ PAGO RECIBIDO Y CONFIRMADO</p>
            </div>
            <div class="footer">Servicios EOS - Blindaje Legal & Inteligencia Tecnológica<br>Documento emitido electrónicamente.</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-900" />
            Cierres y Reportes Financieros
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generación de balances corporativos y cálculo exacto de utilidades
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

      {/* ACCIONES DE EXPORTACIÓN */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between hover:border-blue-300 transition-all">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Cierre Contable Mensual
            </h3>
            <p className="text-xs text-slate-500 mt-1">Detalle del mes para pago exacto de honorarios.</p>
          </div>
          <button 
            onClick={imprimirReporteMensual}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> Exportar PDF
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm flex items-center justify-between hover:border-amber-500 transition-all">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-400" /> Balance Anual {selectedYear}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Consolidado general de los 12 meses fiscales.</p>
          </div>
          <button 
            onClick={imprimirReporteAnual}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </section>

      {/* VISTA PREVIA RÁPIDA DEL MES */}
      <h2 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2 mt-2">
        <TrendingUp className="h-4 w-4 text-slate-500" /> Vista Previa de Caja (Mes Seleccionado)
      </h2>
      
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Ingresos Brutos</p>
          <div className="text-3xl font-extrabold text-slate-900">
            ${ingresosBrutosMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Retención Caja Empresa</p>
          <div className="text-3xl font-extrabold text-blue-900">
            ${cajaEmpresaMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gastos Operacionales</p>
          <div className="text-3xl font-extrabold text-rose-700">
            ${totalGastosMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className={`rounded-xl p-6 shadow-sm border ${balanceNetoMes >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${balanceNetoMes >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            Balance Neto
          </p>
          <div className={`text-3xl font-extrabold ${balanceNetoMes >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
            ${balanceNetoMes.toLocaleString('es-CL')}
          </div>
        </div>
      </section>

      {/* TABLA DE HISTORIAL DE PAGOS DEL MES (RESTAURADA) */}
      <h2 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-slate-500" /> Historial de Ingresos del Mes
      </h2>

      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Fecha Pago</th>
                <th className="px-6 py-3 font-semibold">Folio</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Servicio</th>
                <th className="px-6 py-3 font-semibold">Monto Ingresado</th>
                <th className="px-6 py-3 font-semibold text-right">Comprobante Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">Calculando cierre mensual...</td>
                </tr>
              ) : facturasMes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">No hay ingresos registrados en este mes.</td>
                </tr>
              ) : (
                facturasMes.map((inv) => (
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
                        <Printer className="h-3.5 w-3.5" /> Voucher PDF
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