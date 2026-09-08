'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Building, 
  UserCheck, 
  X,
  Layers
} from 'lucide-react';
import { getExpenses, createExpenseRecord } from '@/services/eosApi';

export default function GastosPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    departamento: 'LEGAL',
    es_deuda_socio: false,
    socio_acreedor: 'LEGAL'
  });

  const loadData = async () => {
    setLoading(true);
    const data = await getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion.trim() || !formData.monto) return;

    setSubmitting(true);
    try {
      await createExpenseRecord(formData);
      setIsModalOpen(false);
      setFormData({
        descripcion: '',
        monto: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        departamento: 'LEGAL',
        es_deuda_socio: false,
        socio_acreedor: 'LEGAL'
      });
      await loadData();
    } catch (err) {
      alert('Error al registrar el gasto o retiro.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'GASTOS_OPERACIONALES') return matchesSearch && !exp.es_deuda_socio;
    if (filterType === 'DEUDAS_SOCIOS') return matchesSearch && exp.es_deuda_socio;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-600" />
            Gastos & Retiros de Socios
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de egresos operacionales segmentados y adelantos / retiros de socios fundadores
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Registrar Gasto o Retiro
        </button>
      </header>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center bg-white rounded-2xl border border-slate-200 p-1 shadow-sm text-xs font-bold">
          {['TODOS', 'GASTOS_OPERACIONALES', 'DEUDAS_SOCIOS'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl transition-colors whitespace-nowrap ${
                filterType === type ? 'bg-slate-950 text-amber-400' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {type === 'TODOS' ? 'Todos' : type === 'GASTOS_OPERACIONALES' ? 'Gastos Empresa' : 'Retiros / Deudas Socios'}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Descripción</th>
                <th className="px-6 py-3 font-semibold">Área / Departamento</th>
                <th className="px-6 py-3 font-semibold">Clasificación</th>
                <th className="px-6 py-3 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando registros...</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">No hay registros financieros encontrados.</td></tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{exp.fecha_gasto}</td>
                    <td className="px-6 py-4 font-bold text-slate-950">{exp.descripcion}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        <Layers className="h-3 w-3 text-slate-500" /> {exp.departamento || 'LEGAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {exp.es_deuda_socio ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                          <UserCheck className="h-3.5 w-3.5" /> Retiro / Deuda Socio ({exp.socio_acreedor})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                          <Building className="h-3.5 w-3.5" /> Gasto Operacional
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-rose-600 font-mono">
                      -${Number(exp.monto).toLocaleString('es-CL')} CLP
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL GASTO O RETIRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">Registrar Gasto o Retiro de Socio</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Descripción *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Retiro de utilidades socio legal / Pago servidores"
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Área / Departamento Responsable *</label>
                <select 
                  value={formData.departamento} 
                  onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold bg-white text-slate-900"
                >
                  <option value="LEGAL">División Legal</option>
                  <option value="TECH">División Tech</option>
                  <option value="EMPRESA">Empresa General (Caja Global)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto en Pesos (CLP) *</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Ej: 50000"
                  value={formData.monto} 
                  onChange={(e) => setFormData({...formData, monto: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-bold outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha del Registro</label>
                <input 
                  type="date" 
                  required 
                  value={formData.fecha_gasto} 
                  onChange={(e) => setFormData({...formData, fecha_gasto: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900" 
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.es_deuda_socio} 
                    onChange={(e) => setFormData({...formData, es_deuda_socio: e.target.checked})} 
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-950">¿Es un retiro de utilidades o deuda de socio?</span>
                </label>

                {formData.es_deuda_socio && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">¿A qué socio/división corresponde?</label>
                    <select 
                      value={formData.socio_acreedor} 
                      onChange={(e) => setFormData({...formData, socio_acreedor: e.target.value})}
                      className="w-full rounded-xl border border-amber-300 p-2 text-xs bg-white font-semibold"
                    >
                      <option value="LEGAL">Socio División Legal</option>
                      <option value="TECH">Socio División Tech</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-amber-400 hover:bg-slate-900 disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}