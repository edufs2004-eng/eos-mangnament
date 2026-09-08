'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Receipt, 
  CreditCard, 
  BarChart3 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes (CRM)', href: '/clientes', icon: Users },
  { name: 'Personal & Nómina', href: '/personal', icon: Users },
  { name: 'Cobros y Boletas', href: '/cobros', icon: Receipt },
  { name: 'Servicios', href: '/servicios', icon: Briefcase },
  { name: 'Gastos y Deudas', href: '/gastos', icon: CreditCard },
  { name: 'Reportes y Cierres', href: '/reportes', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-200/20 flex flex-col min-h-screen text-slate-300 shadow-xl">
      {/* LOGO CORPORATIVO V2.0 */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <img src="/logo_eos.png" alt="Servicios EOS" className="h-9 w-9 object-contain" />
        <div>
          <span className="font-extrabold text-white tracking-widest text-sm block">SERVICIOS EOS</span>
          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Management v2.3.1</span>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-900 text-center text-[10px] text-slate-600">
        Plataforma Comercial Privada
      </div>
    </aside>
  );
}