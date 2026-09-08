'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Receipt, 
  CreditCard, 
  ShieldCheck,
  BarChart3 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes (CRM)', href: '/clientes', icon: Users },
  { name: 'Servicios', href: '/servicios', icon: Briefcase },
  { name: 'Cobros y Boletas', href: '/cobros', icon: Receipt },
  { name: 'Gastos y Deudas', href: '/gastos', icon: CreditCard },
  { name: 'Reportes y Vouchers', href: '/reportes', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* LOGO CORPORATIVO EOS */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">
            EOS
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide text-base">Servicios EOS</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" /> Blindaje & Tech
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER DEL SIDEBAR */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-medium text-slate-400">EOS Management v1.0</p>
        <p>30% Empresa / 70% Socios</p>
      </div>
    </aside>
  );
}