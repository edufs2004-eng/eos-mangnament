'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  X,
  Edit
} from 'lucide-react';
import { getClients, createClientRecord, updateClientRecord } from '@/services/eosApi';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal y Formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Crear Nuevo, UUID = Editar

  const [formData, setFormData] = useState({
    nombre_razon_social: '',
    tipo_cliente: 'PERSONA_NATURAL',
    rut_identificacion: '',
    email: '',
    telefono: '',
    estado: 'ACTIVO'
  });

  const loadClients = async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Abrir Modal para Crear
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      nombre_razon_social: '',
      tipo_cliente: 'PERSONA_NATURAL',
      rut_identificacion: '',
      email: '',
      telefono: '',
      estado: 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  // Abrir Modal para Editar
  const openEditModal = (client) => {
    setEditingId(client.id);
    setFormData({
      nombre_razon_social: client.nombre_razon_social || '',
      tipo_cliente: client.tipo_cliente || 'PERSONA_NATURAL',
      rut_identificacion: client.rut_identificacion || '',
      email: client.email || '',
      telefono: client.telefono || '',
      estado: client.estado || 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_razon_social.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateClientRecord(editingId, formData);
      } else {
        await createClientRecord(formData);
      }
      setIsModalOpen(false);
      await loadClients(); // Recargar datos
    } catch (err) {
      alert('Error al guardar el cliente. Verifica que el RUT no esté duplicado.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar búsqueda
  const filteredClients = clients.filter(c => 
    c.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.rut_identificacion && c.rut_identificacion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-900" />
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de Personas Naturales, Pymes y Fundaciones protegidas por Servicios EOS
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </header>

      <div className="mb-6 flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Buscar por nombre, razón social o RUT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <section className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Cliente / Razón Social</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">RUT / ID</th>
                <th className="px-6 py-3 font-semibold">Contacto</th>
                <th className="px-6 py-3 font-semibold">Contratos</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    Cargando directorio de clientes...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          {client.tipo_cliente === 'PERSONA_NATURAL' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        </div>
                        {client.nombre_razon_social}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${
                        client.tipo_cliente === 'PERSONA_NATURAL' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : client.tipo_cliente === 'FUNDACION'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {client.tipo_cliente.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                      {client.rut_identificacion || 'Sin RUT'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="space-y-1">
                        {client.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {client.email}</div>}
                        {client.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {client.telefono}</div>}
                        {!client.email && !client.telefono && <span className="text-slate-400 italic">Sin datos de contacto</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {client.contracts?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openEditModal(client)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors border border-slate-200 hover:border-blue-300"
                      >
                        <Edit className="h-3.5 w-3.5" /> Editar
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez / Empresa SpA"
                  value={formData.nombre_razon_social}
                  onChange={(e) => setFormData({...formData, nombre_razon_social: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Cliente</label>
                  <select
                    value={formData.tipo_cliente}
                    onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="PERSONA_NATURAL">Persona Natural</option>
                    <option value="PYME">Pyme / Empresa</option>
                    <option value="FUNDACION">Fundación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">RUT / Identificación (Opcional)</label>
                  <input
                    type="text"
                    placeholder="12.345.678-9"
                    value={formData.rut_identificacion}
                    onChange={(e) => setFormData({...formData, rut_identificacion: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo (Opcional)</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado de la cuenta</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 bg-amber-50"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="EN_MOROSIDAD">En Morosidad</option>
                  </select>
                </div>
              )}

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
                  {submitting ? 'Guardando...' : editingId ? 'Actualizar Cliente' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}