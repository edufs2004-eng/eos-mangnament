'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  AlertCircle, 
  ArrowDownRight, 
  Building2, 
  User, 
  X, 
  Search,
  Receipt,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getExpenses, getUsers, createExpenseRecord } from '@/services/eosApi';

export default function GastosPage() {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  
  // Estado Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: 'HERRAMIENTAS_TECH',
    fecha_gasto: new Date().toISOString().split('T')[0],
    es_deuda_socio: false,
    socio_deudor_id: ''
  });

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    const [expensesData, usersData] = await Promise.all([
      getExpenses(),
      getUsers()
    ]);
    setExpenses(expensesData);
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler para guardar gasto
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descripcion.trim() || !formData.monto) return;

    if (formData.es_deuda_socio && !formData.socio_deudor_id) {
      alert('Debes seleccionar al socio responsable si es un retiro o deuda personal.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        descripcion: formData.descripcion.trim(),
        monto: parseFloat(formData.monto),
        categoria: formData.categoria,
        fecha_gasto: formData.fecha_gasto,
        es_deuda_socio: formData.es_deuda_socio,
        socio_deudor_id: formData.es_deuda_socio ? formData.socio_deudor_id : null
      };

      await createExpenseRecord(payload);
      
      // Limpiar formulario y cerrar modal
      setFormData({
        descripcion: '',
        monto: '',
        categoria: 'HERRAMIENTAS_TECH',
        fecha_gasto: new Date().toISOString().split('T')[0],
        es_deuda_socio: false,
        socio_deudor_id: ''
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Error al registrar el gasto en Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    if (categoryFilter === 'TODAS') return matchesSearch;
    if (categoryFilter === 'DEUDAS') return matchesSearch && exp.es_deuda_socio;
    return matchesSearch && exp.categoria === categoryFilter;
  });

  // Métricas
  const totalGastosOperativos = expenses
    .filter((e) => !e.es_deuda_socio)
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  const totalDeudasSocios = expenses
    .filter((e) => e.es_deuda_socio)
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-900" />
            Gastos & Deudas de Socios
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de egresos operacionales y registro transparente de retiros personales
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Registrar Egreo / Retiro
        </button>
      </header>

      {/* MÉTRICAS */}
      <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gastos Operacionales</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700"><ArrowDownRight className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              ${totalGastosOperativos.toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-slate-500">Afecta directamente la caja líquida de la empresa</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deudas / Retiros Socios</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><AlertCircle className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-700">
              ${totalDeudasSocios.toLocaleString('es-CL')} CLP
            </div>
            <p className="mt-1 text-xs text-amber-700 font-medium">Se descontará del 70% del socio al liquidar</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Criterio Contable</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-900"><Building2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-900">Ajuste Transparente</div>
            <p className="mt-1 text-xs text-slate-500">
              Los retiros personales no reducen el 30% de la empresa, sino el saldo individual del socio.
            </p>
          </div>
        </div>
      </section>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-1">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por descripción del gasto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm text-xs font-semibold overflow-x-auto">
          {['TODAS', 'DEUDAS', 'HERRAMIENTAS_TECH', 'DOMINIOS_HOSTING', 'LEGAL_ADMIN', 'VARIOS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === cat 
                  ? 'bg-blue-900 text-white' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'DEUDAS' ? 'Deudas Socios' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE GASTOS */}
      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Descripción</th>
                <th className="px-6 py-3 font-semibold">Categoría</th>
                <th className="px-6 py-3 font-semibold">Monto</th>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Imputado A</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    Cargando registros de egresos...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No hay egresos o deudas registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {exp.descripcion}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {exp.categoria.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${Number(exp.monto).toLocaleString('es-CL')} CLP
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {exp.fecha_gasto}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {exp.es_deuda_socio ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                          <User className="h-3.5 w-3.5" />
                          {exp.users?.nombre || 'Socio Deudor'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          Servicios EOS (Caja)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {exp.es_deuda_socio ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                          Deuda Socio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                          Gasto Empresa
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

      {/* MODAL NUEVO GASTO / DEUDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">Registrar Egresos / Retiro</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Descripción del Gasto / Retiro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Google Workspace / Pago Comida / Servidor Cloud"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto (CLP) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 5000"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_gasto}
                    onChange={(e) => setFormData({...formData, fecha_gasto: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="HERRAMIENTAS_TECH">Herramientas Tech / Software</option>
                  <option value="DOMINIOS_HOSTING">Dominios y Hosting</option>
                  <option value="LEGAL_ADMIN">Trámites Legales / Administración</option>
                  <option value="RETIRO_SOCIO">Retiro de Socio / Personal</option>
                  <option value="VARIOS">Otros Gastos Varios</option>
                </select>
              </div>

              {/* CHECKBOX DE DEUDA DE SOCIO */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_deuda_socio}
                    onChange={(e) => setFormData({
                      ...formData, 
                      es_deuda_socio: e.target.checked,
                      categoria: e.target.checked ? 'RETIRO_SOCIO' : formData.categoria
                    })}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-amber-950">¿Es un retiro o gasto personal de un socio?</span>
                    <p className="text-xs text-amber-800">Se imputará como deuda del socio para descontarse en su próxima liquidación.</p>
                  </div>
                </label>

                {formData.es_deuda_socio && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 uppercase mb-1">
                      Seleccionar Socio Responsable *
                    </label>
                    <select
                      required={formData.es_deuda_socio}
                      value={formData.socio_deudor_id}
                      onChange={(e) => setFormData({...formData, socio_deudor_id: e.target.value})}
                      className="w-full rounded-lg border border-amber-300 p-2.5 text-sm text-slate-900 bg-white outline-none focus:border-amber-600"
                    >
                      <option value="">-- Seleccionar Socio --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.rol.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}