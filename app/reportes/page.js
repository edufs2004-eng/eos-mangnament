'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  FileText,
  PieChart,
  Receipt,
  Download
} from 'lucide-react';
import { getInvoices, getExpenses } from '@/services/eosApi';

export default function ReportesPage() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const mesString = String(selectedMonth).padStart(2, '0');
  
  const facturasMes = invoices.filter(inv => 
    inv.estado_pago === 'PAGADO' && inv.fecha_pago_real?.startsWith(`${selectedYear}-${mesString}`)
  );
  
  const gastosMes = expenses.filter(exp => 
    exp.fecha_gasto?.startsWith(`${selectedYear}-${mesString}`)
  );

  // CÁLCULOS MENSUALES GLOBALES Y POR DIVISIÓN
  let ingresosBrutosMes = 0;
  let cajaEmpresaMes = 0;
  let liquidacionLegalBrutaMes = 0;
  let liquidacionTechBrutaMes = 0;

  facturasMes.forEach(inv => {
    const monto = Number(inv.monto_a_cobrar);
    const pctCaja = Number(inv.contracts?.pct_caja_empresa ?? inv.contracts?.services?.pct_caja_empresa ?? 30) / 100;
    const pctLegal = Number(inv.contracts?.pct_ejecutor_legal ?? inv.contracts?.services?.pct_ejecutor_legal ?? 70) / 100;
    const pctTech = Number(inv.contracts?.pct_ejecutor_tech ?? inv.contracts?.services?.pct_ejecutor_tech ?? 0) / 100;

    ingresosBrutosMes += monto;
    cajaEmpresaMes += (monto * pctCaja);
    liquidacionLegalBrutaMes += (monto * pctLegal);
    liquidacionTechBrutaMes += (monto * pctTech);
  });

  // GASTOS Y RETIROS SEGMENTADOS
  const gastosOperacionalesMes = gastosMes.filter(g => !g.es_deuda_socio);
  const totalGastosOpMes = gastosOperacionalesMes.reduce((acc, g) => acc + Number(g.monto), 0);
  const balanceNetoEmpresaMes = cajaEmpresaMes - totalGastosOpMes;

  const gastosLegalMes = gastosMes.filter(g => g.departamento === 'LEGAL');
  const gastosTechMes = gastosMes.filter(g => g.departamento === 'TECH');

  const totalGastosLegal = gastosLegalMes.reduce((acc, g) => acc + Number(g.monto), 0);
  const totalGastosTech = gastosTechMes.reduce((acc, g) => acc + Number(g.monto), 0);

  const liquidoLegalMes = liquidacionLegalBrutaMes - totalGastosLegal;
  const liquidoTechMes = liquidacionTechBrutaMes - totalGastosTech;

  // CÁLCULOS ANUALES GLOBALES Y POR DIVISIÓN
  const facturasAno = invoices.filter(inv => 
    inv.estado_pago === 'PAGADO' && inv.fecha_pago_real?.startsWith(`${selectedYear}`)
  );
  
  const gastosAno = expenses.filter(exp => 
    exp.fecha_gasto?.startsWith(`${selectedYear}`)
  );

  let ingresosBrutosAno = 0;
  let cajaEmpresaAno = 0;
  let liquidacionLegalBrutaAno = 0;
  let liquidacionTechBrutaAno = 0;

  facturasAno.forEach(inv => {
    const monto = Number(inv.monto_a_cobrar);
    const pctCaja = Number(inv.contracts?.pct_caja_empresa ?? inv.contracts?.services?.pct_caja_empresa ?? 30) / 100;
    const pctLegal = Number(inv.contracts?.pct_ejecutor_legal ?? inv.contracts?.services?.pct_ejecutor_legal ?? 70) / 100;
    const pctTech = Number(inv.contracts?.pct_ejecutor_tech ?? inv.contracts?.services?.pct_ejecutor_tech ?? 0) / 100;

    ingresosBrutosAno += monto;
    cajaEmpresaAno += (monto * pctCaja);
    liquidacionLegalBrutaAno += (monto * pctLegal);
    liquidacionTechBrutaAno += (monto * pctTech);
  });

  const gastosOperacionalesAno = gastosAno.filter(g => !g.es_deuda_socio);
  const totalGastosOpAno = gastosOperacionalesAno.reduce((acc, g) => acc + Number(g.monto), 0);
  const balanceNetoEmpresaAno = cajaEmpresaAno - totalGastosOpAno;

  const gastosLegalAno = gastosAno.filter(g => g.departamento === 'LEGAL');
  const gastosTechAno = gastosAno.filter(g => g.departamento === 'TECH');

  const totalGastosLegalAno = gastosLegalAno.reduce((acc, g) => acc + Number(g.monto), 0);
  const totalGastosTechAno = gastosTechAno.reduce((acc, g) => acc + Number(g.monto), 0);

  const liquidoLegalAno = liquidacionLegalBrutaAno - totalGastosLegalAno;
  const liquidoTechAno = liquidacionTechBrutaAno - totalGastosTechAno;

  const descargarPDF = async (htmlContent, nombreArchivo) => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const options = {
      margin:       10,
      filename:     `${nombreArchivo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(options).save();
  };

  const generarCierreEmpresaHTML = (titulo, periodo, ingresos, caja, liqLegal, liqTech, gastOp, gastLegal, gastTech, netLegal, netTech, netEmpresa, listaGastos) => `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #000; line-height: 1.5; background: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 16px; letter-spacing: 2px;">SERVICIOS EOS</div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">${titulo}</h2>
          <p style="margin: 3px 0 0; font-size: 11px; color: #666;">${periodo}</p>
        </div>
      </div>

      <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 20px;">1. Resumen Financiero Corporativo Global</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Ingresos Brutos Totales</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; font-weight: bold;">$${ingresos.toLocaleString('es-CL')} CLP</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Retención Caja Empresa</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace;">$${caja.toLocaleString('es-CL')} CLP</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #991b1b;">(-) Gastos Operacionales Totales</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #991b1b;">-$${gastOp.toLocaleString('es-CL')} CLP</td></tr>
        <tr style="background-color: #f9f9f9; font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Balance Neto Empresa</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #047857;">$${netEmpresa.toLocaleString('es-CL')} CLP</td></tr>
      </table>

      <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 20px;">2. Desglose y Liquidez para Retiros de Socios</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
        <tr style="background-color: #f9f9f9;"><th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">División / Socio</th><th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Monto</th></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">Asignación Bruta - División Legal</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace;">$${liqLegal.toLocaleString('es-CL')} CLP</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #991b1b;">(-) Gastos / Retiros División Legal</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #991b1b;">-$${gastLegal.toLocaleString('es-CL')} CLP</td></tr>
        <tr style="background-color: #ecfdf5; font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Líquido a Retirar - Socio Legal</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #047857;">$${netLegal.toLocaleString('es-CL')} CLP</td></tr>

        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; border-top: 2px solid #ddd;">Asignación Bruta - División Tech</td><td style="padding: 8px; border-bottom: 1px solid #ddd; border-top: 2px solid #ddd; text-align: right; font-family: monospace;">$${liqTech.toLocaleString('es-CL')} CLP</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #991b1b;">(-) Gastos / Retiros División Tech</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #991b1b;">-$${gastTech.toLocaleString('es-CL')} CLP</td></tr>
        <tr style="background-color: #ecfdf5; font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Líquido a Retirar - Socio Tech</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #047857;">$${netTech.toLocaleString('es-CL')} CLP</td></tr>
      </table>

      <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 20px;">3. Detalle de Egresos Operacionales y Socios</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
        <tr style="background-color: #f9f9f9;"><th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Descripción</th><th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Área / Tipo</th><th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Monto</th></tr>
        ${listaGastos.length > 0 ? listaGastos.map(g => `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.descripcion}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.departamento} ${g.es_deuda_socio ? '(Retiro Socio)' : ''}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-family: monospace; color: #991b1b;">-$${Number(g.monto).toLocaleString('es-CL')} CLP</td></tr>`).join('') : '<tr><td colspan="3" style="padding: 8px; text-align: center; color: #777;">Sin registros de egresos.</td></tr>'}
      </table>
    </div>
  `;

  const generarVoucherClienteHTML = (inv) => {
    const monto = Number(inv.monto_a_cobrar).toLocaleString('es-CL');
    const fecha = inv.fecha_pago_real.split('T')[0];
    const cliente = inv.contracts?.clients?.nombre_razon_social || 'Cliente EOS';
    const servicio = inv.contracts?.services?.nombre_servicio || 'Servicio Profesional';

    return `
      <div style="font-family: 'Arial', sans-serif; padding: 30px; background: #f8fafc; color: #0f172a; width: 420px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="font-size: 16px; font-weight: bold; letter-spacing: 2px; color: #0f172a;">SERVICIOS EOS</div>
          <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: bold;">Comprobante de Pago Oficial</div>
        </div>
        <div style="font-size: 12px; color: #334155;">
          <p style="margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;"><span>Folio:</span> <strong>${inv.folio_interno}</strong></p>
          <p style="margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;"><span>Fecha:</span> <strong>${fecha}</strong></p>
          <p style="margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;"><span>Cliente:</span> <strong>${cliente}</strong></p>
          <p style="margin: 8px 0; display: flex; justify-content: space-between; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px;"><span>Concepto:</span> <strong>${servicio}</strong></p>
        </div>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 9px; text-transform: uppercase; color: #b45309; letter-spacing: 1px; font-weight: bold; margin-bottom: 4px;">Monto Recibido</div>
          <div style="font-size: 22px; font-weight: bold; color: #0f172a; font-family: monospace;">$${monto} CLP</div>
        </div>
        <div style="text-align: center; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 8px; border-radius: 6px; font-weight: bold; font-size: 10px; letter-spacing: 1px;">✔ PAGO VERIFICADO Y LIQUIDADO</div>
        <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 10px;">Servicios EOS — Blindaje Legal & Inteligencia Tecnológica</div>
      </div>
    `;
  };

  const exportarMensual = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodo = `${meses[selectedMonth - 1]} ${selectedYear}`;
    const html = generarCierreEmpresaHTML('CIERRE CONTABLE MENSUAL', periodo, ingresosBrutosMes, cajaEmpresaMes, liquidacionLegalBrutaMes, liquidacionTechBrutaMes, totalGastosOpMes, totalGastosLegal, totalGastosTech, liquidoLegalMes, liquidoTechMes, balanceNetoEmpresaMes, gastosMes);
    descargarPDF(html, `Cierre_Mensual_${selectedYear}_${selectedMonth}`);
  };

  const exportarAnual = () => {
    const html = generarCierreEmpresaHTML('BALANCE FINANCIERO ANUAL', `Año Fiscal ${selectedYear}`, ingresosBrutosAno, cajaEmpresaAno, liquidacionLegalBrutaAno, liquidacionTechBrutaAno, totalGastosOpAno, totalGastosLegalAno, totalGastosTechAno, liquidoLegalAno, liquidoTechAno, balanceNetoEmpresaAno, gastosAno);
    descargarPDF(html, `Balance_Anual_${selectedYear}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-600" />
            Cierres y Reportes Financieros
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control corporativo global y liquidación neta por divisiones y socios
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <CalendarIcon className="h-5 w-5 text-amber-600 ml-2" />
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between hover:border-amber-400 transition-all">
          <div>
            <h3 className="font-bold text-slate-950 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" /> Cierre Contable Mensual
            </h3>
            <p className="text-xs text-slate-500 mt-1">Descarga directa en PDF con resumen global y por división.</p>
          </div>
          <button 
            onClick={exportarMensual}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
        </div>

        <div className="bg-[#090d16] rounded-2xl border border-slate-800 p-6 shadow-lg flex items-center justify-between hover:border-amber-500 transition-all text-white">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-400" /> Balance Anual Fiscal {selectedYear}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Consolidado general de los 12 meses fiscales.</p>
          </div>
          <button 
            onClick={exportarAnual}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="h-4 w-4" /> Descargar PDF
          </button>
        </div>
      </section>

      {/* VISTA PREVIA RÁPIDA: DATOS GLOBALES Y POR DIVISIÓN */}
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-600" /> Indicadores Globales y Retiros Líquidos (Mes Seleccionado)
      </h2>
      
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Ingresos Brutos</p>
          <div className="text-3xl font-extrabold text-slate-950">
            ${ingresosBrutosMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Retención Caja Empresa</p>
          <div className="text-3xl font-extrabold text-amber-600">
            ${cajaEmpresaMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gastos Operacionales</p>
          <div className="text-3xl font-extrabold text-rose-600">
            ${totalGastosOpMes.toLocaleString('es-CL')}
          </div>
        </div>

        <div className={`rounded-2xl p-6 shadow-sm border ${balanceNetoEmpresaMes >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Balance Neto Empresa</p>
          <div className={`text-3xl font-extrabold ${balanceNetoEmpresaMes >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
            ${balanceNetoEmpresaMes.toLocaleString('es-CL')}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Líquido a Retirar - Socio Legal</p>
          <div className="text-3xl font-extrabold text-slate-950">
            ${liquidoLegalMes.toLocaleString('es-CL')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bruto Legal: ${liquidacionLegalBrutaMes.toLocaleString('es-CL')} | Egresos/Retiros Legal: -${totalGastosLegal.toLocaleString('es-CL')}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Líquido a Retirar - Socio Tech</p>
          <div className="text-3xl font-extrabold text-slate-950">
            ${liquidoTechMes.toLocaleString('es-CL')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bruto Tech: ${liquidacionTechBrutaMes.toLocaleString('es-CL')} | Egresos/Retiros Tech: -${totalGastosTech.toLocaleString('es-CL')}</p>
        </div>
      </section>

      {/* TABLA DE HISTORIAL DE PAGOS */}
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-amber-600" /> Historial de Ingresos del Mes
      </h2>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Fecha Pago</th>
                <th className="px-6 py-3 font-semibold">Folio</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Servicio</th>
                <th className="px-6 py-3 font-semibold">Monto Ingresado</th>
                <th className="px-6 py-3 font-semibold text-right">Voucher Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando registros...</td></tr>
              ) : facturasMes.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">No hay ingresos registrados en este mes.</td></tr>
              ) : (
                facturasMes.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{inv.fecha_pago_real.split('T')[0]}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-700">{inv.folio_interno}</td>
                    <td className="px-6 py-4 font-bold text-slate-950">{inv.contracts?.clients?.nombre_razon_social || 'Cliente'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{inv.contracts?.services?.nombre_servicio || 'Servicio'}</td>
                    <td className="px-6 py-4 font-extrabold text-emerald-700">${Number(inv.monto_a_cobrar).toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          const html = generarVoucherClienteHTML(inv);
                          descargarPDF(html, `Voucher_${inv.folio_interno}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-400 transition-colors shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5" /> Voucher PDF
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