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
  Edit,
  PlusCircle,
  Briefcase
} from 'lucide-react';
import { getClients, createClientRecord, updateClientRecord, getServices, createContractAndInvoices } from '@/services/eosApi';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [contractClient, setContractClient] = useState(null);
  const [contractData, setContractData] = useState({
    service_id: '',
    monto_total_acordado: '',
    moneda: 'CLP',
    tipo_pago: 'UNICO',
    numero_cuotas: 1,
    fecha_inicio: new Date().toISOString().split('T')[0],
    marcar_primer_pago_pagado: false,
    fecha_pago_real: new Date().toISOString().split('T')[0],
    valor_uf_dia: '',
    pct_caja_empresa: 30,
    pct_ejecutor_legal: 70,
    pct_ejecutor_tech: 0
  });

  const [formData, setFormData] = useState({
    nombre_razon_social: '',
    tipo_cliente: 'PERSONA_NATURAL',
    rut_identificacion: '',
    email: '',
    telefono: '',
    estado: 'ACTIVO'
  });

  const loadData = async () => {
    setLoading(true);
    const [clientsData, servicesData] = await Promise.all([
      getClients(),
      getServices()
    ]);
    setClients(clientsData);
    setServices(servicesData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const openContractModal = (client) => {
    setContractClient(client);
    const defaultSvc = services[0];
    setContractData({
      service_id: defaultSvc?.id || '',
      monto_total_acordado: defaultSvc?.monto_sugerido || '',
      moneda: defaultSvc?.moneda || 'CLP',
      tipo_pago: 'UNICO',
      numero_cuotas: 1,
      fecha_inicio: new Date().toISOString().split('T')[0],
      marcar_primer_pago_pagado: false,
      fecha_pago_real: new Date().toISOString().split('T')[0],
      valor_uf_dia: '',
      pct_caja_empresa: defaultSvc?.pct_caja_empresa ?? 30,
      pct_ejecutor_legal: defaultSvc?.pct_ejecutor_legal ?? 70,
      pct_ejecutor_tech: defaultSvc?.pct_ejecutor_tech ?? 0
    });
  };

  const handleServiceSelect = (serviceId) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      setContractData(prev => ({
        ...prev,
        service_id: serviceId,
        monto_total_acordado: selectedService.monto_sugerido || '',
        moneda: selectedService.moneda || 'CLP',
        pct_caja_empresa: selectedService.pct_caja_empresa ?? 30,
        pct_ejecutor_legal: selectedService.pct_ejecutor_legal ?? 70,
        pct_ejecutor_tech: selectedService.pct_ejecutor_tech ?? 0
      }));
    }
  };

  const handleSubmitClient = async (e) => {
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
      await loadData();
    } catch (err) {
      alert('Error al guardar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitContract = async (e) => {
    e.preventDefault();
    if (!contractClient || !contractData.service_id || !contractData.monto_total_acordado) return;

    setSubmitting(true);
    try {
      await createContractAndInvoices({
        client_id: contractClient.id,
        ...contractData
      });
      setContractClient(null);
      await loadData();
      alert('¡Servicio asignado y cobros generados con éxito!');
    } catch (err) {
      alert('Error al asignar servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.rut_identificacion && c.rut_identificacion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 text-slate-900">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" />
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de clientes y asignación de servicios legales y tecnológicos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </header>

      <div className="mb-6 flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Buscar por nombre, razón social o RUT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
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
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">Cargando directorio...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">No hay clientes registrados.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-950">
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
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : client.tipo_cliente === 'FUNDACION'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {client.tipo_cliente.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs">{client.rut_identificacion || 'Sin RUT'}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="space-y-1">
                        {client.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {client.email}</div>}
                        {client.telefono && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {client.telefono}</div>}
                        {!client.email && !client.telefono && <span className="text-slate-400 italic">Sin datos de contacto</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {client.contracts?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openContractModal(client)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Asignar Servicio
                      </button>
                      <button 
                        onClick={() => openEditModal(client)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
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

      {/* MODAL 1: CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-950">{editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmitClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre o Razón Social *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre_razon_social} 
                  onChange={(e) => setFormData({...formData, nombre_razon_social: e.target.value})} 
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Cliente</label>
                  <select 
                    value={formData.tipo_cliente} 
                    onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value})} 
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500"
                  >
                    <option value="PERSONA_NATURAL">Persona Natural</option>
                    <option value="PYME">Pyme / Empresa</option>
                    <option value="FUNDACION">Fundación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">RUT / Identificación</label>
                  <input 
                    type="text" 
                    value={formData.rut_identificacion} 
                    onChange={(e) => setFormData({...formData, rut_identificacion: e.target.value})} 
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 bg-amber-50"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="EN_MOROSIDAD">En Morosidad</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-amber-400 hover:bg-slate-900 disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONTRATO (CON PORCENTAJES EDITABLES) */}
      {contractClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-[#090d16] text-white">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-400" /> Asignar Servicio
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">{contractClient.nombre_razon_social}</p>
              </div>
              <button onClick={() => setContractClient(null)} className="rounded-lg p-1 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmitContract} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Seleccionar Servicio *</label>
                <select
                  required
                  value={contractData.service_id}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-medium"
                >
                  <option value="">-- Seleccionar --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.departamento}] {s.nombre_servicio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Moneda / Unidad *</label>
                  <select
                    value={contractData.moneda}
                    onChange={(e) => setContractData({...contractData, moneda: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-bold bg-slate-50"
                  >
                    <option value="CLP">Pesos Chilenos (CLP)</option>
                    <option value="UF">Unidad de Fomento (UF)</option>
                    <option value="PORCENTAJE">Porcentaje de Éxito (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monto Acordado *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={contractData.monto_total_acordado}
                    onChange={(e) => setContractData({...contractData, monto_total_acordado: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* SECCIÓN DE PORCENTAJES PERSONALIZABLES */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-900 uppercase">Porcentajes de Distribución (Modificables)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">Caja Empresa</label>
                    <input type="number" value={contractData.pct_caja_empresa} onChange={(e) => setContractData({...contractData, pct_caja_empresa: Number(e.target.value)})} className="w-full rounded-lg border p-2 text-xs font-bold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">División Legal</label>
                    <input type="number" value={contractData.pct_ejecutor_legal} onChange={(e) => setContractData({...contractData, pct_ejecutor_legal: Number(e.target.value)})} className="w-full rounded-lg border p-2 text-xs font-bold bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase">División Tech</label>
                    <input type="number" value={contractData.pct_ejecutor_tech} onChange={(e) => setContractData({...contractData, pct_ejecutor_tech: Number(e.target.value)})} className="w-full rounded-lg border p-2 text-xs font-bold bg-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Modalidad de Pago</label>
                  <select
                    value={contractData.tipo_pago}
                    onChange={(e) => setContractData({...contractData, tipo_pago: e.target.value})}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900"
                  >
                    <option value="UNICO">Pago Único</option>
                    <option value="CUOTAS_FIJAS">Cuotas Fijas</option>
                    <option value="RECURRENTE_MENSUAL">Suscripción Mensual</option>
                  </select>
                </div>

                {contractData.tipo_pago === 'CUOTAS_FIJAS' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">N° de Cuotas</label>
                    <input
                      type="number"
                      min="2"
                      required
                      value={contractData.numero_cuotas}
                      onChange={(e) => setContractData({...contractData, numero_cuotas: e.target.value})}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  required
                  value={contractData.fecha_inicio}
                  onChange={(e) => setContractData({...contractData, fecha_inicio: e.target.value})}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractData.marcar_primer_pago_pagado}
                    onChange={(e) => setContractData({...contractData, marcar_primer_pago_pagado: e.target.checked})}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-950">¿Marcar el pago inicial como YA RECIBIDO?</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setContractClient(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-amber-400 hover:bg-slate-900 disabled:opacity-50">
                  {submitting ? 'Generando...' : 'Asignar y Generar Cobros'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}