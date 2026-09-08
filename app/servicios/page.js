'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Scale, 
  Code2, 
  Layers, 
  Search, 
  X, 
  DollarSign,
  Building2,
  PieChart
} from 'lucide-react';
import { getServices, createServiceRecord } from '@/services/eosApi';

export default function ServiciosPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('TODOS');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario actualizado con Moneda
  const [formData, setFormData] = useState({
    nombre_servicio: '',
    departamento: 'LEGAL',
    descripcion: '',
    monto_sugerido: '',
    moneda: 'CLP',
    pct_caja_empresa: 30,
    pct_ejecutor_legal: 70,
    pct_ejecutor_tech: 0
  });

  const loadServices = async () => {
    setLoading(true);
    const data = await getServices();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleDeptChange = (dept) => {
    if (dept === 'LEGAL') {
      setFormData({ ...formData, departamento: dept, pct_caja_empresa: 30, pct_ejecutor_legal: 70, pct_ejecutor_tech: 0 });
    } else if (dept === 'TECH') {
      setFormData({ ...formData, departamento: dept, pct_caja_empresa: 30, pct_ejecutor_legal: 0, pct_ejecutor_tech: 70 });
    } else if (dept === 'MIXTO') {
      setFormData({ ...formData, departamento: dept, pct_caja_empresa: 30, pct_ejecutor_legal: 35, pct_ejecutor_tech: 35 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_servicio.trim()) return;

    const totalPct = Number(formData.pct_caja_empresa) + Number(formData.pct_ejecutor_legal) + Number(formData.pct_ejecutor_tech);
    if (totalPct !== 100) {
      alert(`La suma de porcentajes debe ser 100%. Suma actual: ${totalPct}%`);
      return;
    }

    setSubmitting(true);
    try {
      await createServiceRecord({
        ...formData,
        monto_sugerido: formData.monto_sugerido ? parseFloat(formData.monto_sugerido) : 0
      });

      setFormData({
        nombre_servicio: '',
        departamento: 'LEGAL',
        descripcion: '',
        monto_sugerido: '',
        moneda: 'CLP',
        pct_caja_empresa: 30,
        pct_ejecutor_legal: 70,
        pct_ejecutor_tech: 0
      });
      setIsModalOpen(false);
      await loadServices();
    } catch (err) {
      alert('Error al registrar el servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.nombre_servicio.toLowerCase().includes(searchTerm.toLowerCase());
    if (deptFilter === 'TODOS') return matchesSearch;
    return matchesSearch && s.departamento === deptFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-900" />
            Catálogo de Servicios & Reglas 30/70
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configuración de prestaciones, precios base (CLP, UF, %) y comisiones
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Servicio
        </button>
      </header>

      {/* METRICAS DE REPARTO */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Servicios Legales</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><Scale className="h-5 w-5" /></div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-slate-900">30% Empresa / 70% Legal</div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Servicios Tecnológicos</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700"><Code2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-slate-900">30% Empresa / 70% Tech</div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Packs Mixtos</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-700"><Layers className="h-5 w-5" /></div>
          </div>
          <div className="mt-4 text-2xl font-extrabold text-slate-900">30% Emp / 35% L / 35% T</div>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input type="text" placeholder="Buscar servicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent text-sm text-slate-800 outline-none" />
        </div>
        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm text-xs font-semibold">
          {['TODOS', 'LEGAL', 'TECH', 'MIXTO'].map((dept) => (
            <button key={dept} onClick={() => setDeptFilter(dept)} className={`px-4 py-2 rounded-lg transition-colors ${deptFilter === dept ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{dept}</button>
          ))}
        </div>
      </div>

      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Nombre del Servicio</th>
                <th className="px-6 py-3 font-semibold">Departamento</th>
                <th className="px-6 py-3 font-semibold">Precio Base (Referencia)</th>
                <th className="px-6 py-3 font-semibold">Caja Empresa</th>
                <th className="px-6 py-3 font-semibold">Ejecutores (70%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando catálogo...</td></tr>
              ) : filteredServices.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">No hay servicios.</td></tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {service.nombre_servicio}
                      {service.descripcion && <span className="block text-xs font-normal text-slate-500 mt-0.5">{service.descripcion}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border ${service.departamento === 'LEGAL' ? 'bg-amber-50 text-amber-800 border-amber-200' : service.departamento === 'TECH' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>
                        {service.departamento}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <span className={`px-2.5 py-1 rounded-md text-xs border ${service.moneda === 'UF' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : service.moneda === 'PORCENTAJE' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' : 'bg-transparent border-transparent'}`}>
                        {service.moneda === 'CLP' ? `$${Number(service.monto_sugerido || 0).toLocaleString('es-CL')} CLP` : service.moneda === 'UF' ? `${service.monto_sugerido} UF` : `${service.monto_sugerido}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-900">{service.pct_caja_empresa}%</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      L: <span className="text-amber-700 font-bold">{service.pct_ejecutor_legal}%</span> | T: <span className="text-teal-700 font-bold">{service.pct_ejecutor_tech}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Servicio</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre del Servicio *</label>
                <input type="text" required value={formData.nombre_servicio} onChange={(e) => setFormData({...formData, nombre_servicio: e.target.value})} className="w-full rounded-lg border p-2.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Departamento</label>
                  <select value={formData.departamento} onChange={(e) => handleDeptChange(e.target.value)} className="w-full rounded-lg border p-2.5 text-sm">
                    <option value="LEGAL">Legal (70% Abogada)</option>
                    <option value="TECH">Tech (70% Developer)</option>
                    <option value="MIXTO">Mixto (35% / 35%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Moneda del Precio</label>
                  <select value={formData.moneda} onChange={(e) => setFormData({...formData, moneda: e.target.value})} className="w-full rounded-lg border p-2.5 text-sm bg-slate-50 font-bold">
                    <option value="CLP">Pesos (CLP)</option>
                    <option value="UF">Unidad de Fomento (UF)</option>
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Valor Sugerido ({formData.moneda})</label>
                <input type="number" step="any" placeholder={formData.moneda === 'CLP' ? "150000" : formData.moneda === 'UF' ? "10" : "15"} value={formData.monto_sugerido} onChange={(e) => setFormData({...formData, monto_sugerido: e.target.value})} className="w-full rounded-lg border p-2.5 text-sm" />
              </div>

              {/* DESGLOSE DE COMISIONES */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase block flex items-center gap-1">
                  <PieChart className="h-4 w-4 text-blue-900" /> Regla de Reparto (Suma = 100%)
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Empresa</span>
                    <input type="number" value={formData.pct_caja_empresa} onChange={(e) => setFormData({...formData, pct_caja_empresa: Number(e.target.value)})} className="w-full text-center font-bold text-blue-900 bg-transparent text-sm" />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Legal</span>
                    <input type="number" value={formData.pct_ejecutor_legal} onChange={(e) => setFormData({...formData, pct_ejecutor_legal: Number(e.target.value)})} className="w-full text-center font-bold text-amber-700 bg-transparent text-sm" />
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase">Tech</span>
                    <input type="number" value={formData.pct_ejecutor_tech} onChange={(e) => setFormData({...formData, pct_ejecutor_tech: Number(e.target.value)})} className="w-full text-center font-bold text-teal-700 bg-transparent text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-semibold">{submitting ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}