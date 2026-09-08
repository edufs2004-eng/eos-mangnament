'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Scale, 
  Code2, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { getCompanyBalance, getInvoices } from '@/services/eosApi';

export default function DashboardPage() {
  const [balance, setBalance] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [balanceData, invoicesData] = await Promise.all([
          getCompanyBalance(),
          getInvoices()
        ]);
        
        setBalance(balanceData || {
          saldo_liquido_caja_empresa: 0,
          total_acumulado_legal: 0,
          total_acumulado_tech: 0,
          total_gastos_operacionales: 5000
        });

        setInvoices(invoicesData || []);
      } catch (error) {
        console.error('Error al cargar datos del Dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600 font-medium">Conectando con Servicios EOS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950 text-white font-bold tracking-wider shadow-md">
              EOS
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Servicios EOS</h1>
              <p className="text-xs font-medium text-slate-500">Blindaje Legal & Inteligencia Tecnológica</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Sistema Operativo Activo
          </span>
        </div>
      </header>

      {/* METRICAS DE CAJA */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Caja Empresa (30%)</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-900"><Building2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              ${Number(balance?.saldo_liquido_caja_empresa || 0).toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-slate-500">Fondo libre para operaciones</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">División Legal</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><Scale className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              ${Number(balance?.total_acumulado_legal || 0).toLocaleString('es-CL')} CLP
            </div>
            <div className="mt-1 flex items-center text-xs text-amber-700 font-medium">
              <AlertCircle className="mr-1 h-3.5 w-3.5" /> Deuda pendiente: -$5.000 CLP
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">División Tech</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700"><Code2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              ${Number(balance?.total_acumulado_tech || 0).toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-slate-500">Acumulado por servicios web/data</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gastos / Retiros</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700"><ArrowDownRight className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              ${Number(balance?.total_gastos_operacionales || 0).toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-rose-600 font-medium">Google Workspace / Servidores</p>
          </div>
        </div>
      </section>

      {/* COBROS */}
      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Cobros y Facturación Activa</h2>
          <p className="text-xs text-slate-500">Registro de cuotas e ingresos de clientes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Folio</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Servicio</th>
                <th className="px-6 py-3 font-semibold">Monto</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No hay boletas registradas o pendientes aún.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{inv.folio_interno}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {inv.contracts?.clients?.nombre_razon_social || 'Cliente General'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {inv.contracts?.services?.nombre_servicio || 'Servicio General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${Number(inv.monto_a_cobrar).toLocaleString('es-CL')} CLP
                    </td>
                    <td className="px-6 py-4">
                      {inv.estado_pago === 'PAGADO' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                          <Clock className="h-3.5 w-3.5" /> Pendiente
                        </span>
                      )}
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