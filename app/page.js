'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { getClients, getServices, getInvoices, getExpenses } from '@/services/eosApi';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    clientsCount: 0,
    servicesCount: 0,
    pendingInvoicesTotal: 0,
    monthlyIncome: 0,
    loading: true
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [clients, services, invoices, expenses] = await Promise.all([
          getClients(),
          getServices(),
          getInvoices(),
          getExpenses()
        ]);

        const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        let pendingTotal = 0;
        let incomeTotal = 0;

        invoices.forEach(inv => {
          if (inv.estado_pago === 'PENDIENTE' || inv.estado_pago === 'ATRASADO') {
            pendingTotal += Number(inv.monto_a_cobrar) || 0;
          }
          if (inv.estado_pago === 'PAGADO' && inv.fecha_pago_real?.startsWith(currentMonthStr)) {
            incomeTotal += Number(inv.monto_a_cobrar) || 0;
          }
        });

        setStats({
          clientsCount: clients.length,
          servicesCount: services.length,
          pendingInvoicesTotal: pendingTotal,
          monthlyIncome: incomeTotal,
          loading: false
        });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3 text-slate-950">
          <LayoutDashboard className="h-7 w-7 text-amber-600" />
          Panel Principal EOS
        </h1>
        <p className="text-xs text-slate-500">
          Resumen ejecutivo de operaciones, finanzas y control corporativo.
        </p>
      </header>

      {/* TARJETAS DE MÉTRICAS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Ingresos del Mes</p>
          <div className="text-3xl font-extrabold text-slate-950">
            {stats.loading ? '...' : `$${stats.monthlyIncome.toLocaleString('es-CL')}`}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Facturado este mes fiscal
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Por Cobrar / Pendiente</p>
          <div className="text-3xl font-extrabold text-amber-600">
            {stats.loading ? '...' : `$${stats.pendingInvoicesTotal.toLocaleString('es-CL')}`}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2">Cuotas vigentes y atrasadas</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Clientes Activos</p>
          <div className="text-3xl font-extrabold text-slate-950">
            {stats.loading ? '...' : stats.clientsCount}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2">Empresas y personas registradas</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Servicios del Catálogo</p>
          <div className="text-3xl font-extrabold text-slate-950">
            {stats.loading ? '...' : stats.servicesCount}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2">Legal, Tech y Mixtos</p>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Accesos Directos del Sistema</h2>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/clientes" className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-amber-400 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-950 text-base mb-1">Directorio de Clientes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Administra la base de datos de clientes corporativos y asigna contratos de servicios.</p>
        </Link>

        <Link href="/cobros" className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-amber-400 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Receipt className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-950 text-base mb-1">Control de Cobros</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Liquida cuotas, procesa abonos parciales y adjunta comprobantes bancarios obligatorios.</p>
        </Link>

        <Link href="/reportes" className="rounded-2xl bg-[#090d16] p-6 shadow-lg border border-slate-800 hover:border-amber-500 transition-all group text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Briefcase className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">Cierres y Reportes</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Genera los balances mensuales y anuales con la distribución exacta de utilidades.</p>
        </Link>
      </section>
    </div>
  );
}