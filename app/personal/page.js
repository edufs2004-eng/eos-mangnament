'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, Briefcase, DollarSign } from 'lucide-react';
import { getPayrollStaff, createPayrollStaff, deletePayrollStaff } from '@/services/eosApi';

export default function PersonalPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    departamento: 'LEGAL',
    tipo: 'EMPLEADO',
    costo_mensual: '',
    estado: 'ACTIVO'
  });

  const loadStaff = async () => {
    setLoading(true);
    const data = await getPayrollStaff();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.costo_mensual) return;

    setSubmitting(true);
    try {
      await createPayrollStaff(formData);
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        departamento: 'LEGAL',
        tipo: 'EMPLEADO',
        costo_mensual: '',
        estado: 'ACTIVO'
      });
      await loadStaff();
    } catch (err) {
      alert('Error al registrar colaborador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de personal?')) return;
    try {
      await deletePayrollStaff(id);
      await loadStaff();
    } catch (err) {
      alert('Error al eliminar.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" />
            Gestión de Personal & Nómina (Payroll)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de socios fundadores y colaboradores segmentados por división
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          Registrar Colaborador
        </button>
      </header>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Colaborador / Socio</th>
                <th className="px-6 py-3 font-semibold">División / Área</th>
                <th className="px-6 py-3 font-semibold">Clasificación</th>
                <th className="px-6 py-3 font-semibold text-right">Costo Mensual</th>
                <th className="px-6 py-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando personal...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">No hay colaboradores registrados.</td></tr>
              ) : (
                staff.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-950 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs">
                        {person.nombre.charAt(0)}
                      </div>
                      {person.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                        <Briefcase className="h-3 w-3 text-slate-500" /> {person.departamento}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {person.tipo === 'SOCIO_FUNDADOR' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                          <Shield className="h-3.5 w-3.5" /> Socio Fundador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                          <Users className="h-3.5 w-3.5" /> Empleado / Colaborador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900 font-mono">
                      ${Number(person.costo_mensual).toLocaleString('es-CL')} CLP
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">Registrar Nuevo Colaborador</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">División / Área *</label>
                <select 
                  value={formData.departamento} 
                  onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold bg-white text-slate-900"
                >
                  <option value="LEGAL">División Legal</option>
                  <option value="TECH">División Tech</option>
                  <option value="EMPRESA">Empresa General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Clasificación *</label>
                <select 
                  value={formData.tipo} 
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-semibold bg-white text-slate-900"
                >
                  <option value="EMPLEADO">Empleado / Colaborador Regular</option>
                  <option value="SOCIO_FUNDADOR">Socio Fundador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Costo / Sueldo Mensual (CLP) *</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Ej: 800000"
                  value={formData.costo_mensual} 
                  onChange={(e) => setFormData({...formData, costo_mensual: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-bold outline-none focus:border-amber-500" 
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-amber-400 hover:bg-slate-900 disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}