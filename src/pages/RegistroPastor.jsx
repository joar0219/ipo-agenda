import { useState, useEffect } from 'react';
import { 
  User, MapPin, Church, Shield, UserPlus, 
  Users, Edit2, ToggleLeft, ToggleRight, Smartphone, Loader2, RefreshCw, CheckCircle2, Compass, Award, X, Save, Scale, Building2 
} from 'lucide-react';
import { supabase } from '../SupabaseClient';

export default function RegistroPastor() {
  const [pestanaActiva, setPestanaActiva] = useState('lista');
  const [usuarios, setUsuarios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  // Estados del formulario de alta
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('Pastor');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [departamento, setDepartamento] = useState('Valle del Cauca');
  const [notas, setNotas] = useState('');

  // Estados para el Modal de Edición (Cambio de teléfono / pérdida de celular)
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRol, setEditRol] = useState('Pastor');
  const [editSedeId, setEditSedeId] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarDirectorio();
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    try {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('nombre', { ascending: true });

      if (!error && data) {
        setSedes(data);
        if (data.length > 0 && !sedeSeleccionada) {
          setSedeSeleccionada(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando sedes:', err);
    }
  };

  const cargarDirectorio = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('perfiles')
        .select(`
          id,
          nombre_completo,
          telefono,
          rol,
          activo,
          sede_id,
          sedes ( id, nombre, ciudad, departamento )
        `)
        .order('nombre_completo', { ascending: true });

      if (!error && data && data.length > 0) {
        setUsuarios(data);
      } else {
        // Estructura oficial de la Misión Panamericana de Colombia
        setUsuarios([
          { 
            id: 'mp-1', 
            nombre_completo: "Armando Arboleda", 
            rol: "Presidente Nacional", 
            telefono: "+57 300 111 2233", 
            activo: true, 
            sedes: { nombre: "Sede Nacional Misión Panamericana", ciudad: "Bogotá D.C.", departamento: "Cundinamarca" } 
          },
          { 
            id: 'mp-2', 
            nombre_completo: "Gabriel González", 
            rol: "Presbitero", 
            telefono: "+57 318 987 6543", 
            activo: true, 
            sedes: { nombre: "Presbiterio Central Pereira", ciudad: "Pereira", departamento: "Risaralda" } 
          },
          { 
            id: 'mp-3', 
            nombre_completo: "Nancy García", 
            rol: "Administracion", 
            telefono: "+57 312 456 7890", 
            activo: true, 
            sedes: { nombre: "Administración Zonal Sur-Occidente", ciudad: "Pereira", departamento: "Risaralda" } 
          },
          { 
            id: 'mp-4', 
            nombre_completo: "Dra. Elizabeth Nieto", 
            rol: "Abogado", 
            telefono: "+57 310 999 8888", 
            activo: true, 
            sedes: { nombre: "Asesoría Legal y Jurídica", ciudad: "Pereira", departamento: "Risaralda" } 
          },
          { 
            id: 'mp-5', 
            nombre_completo: "José Orlando Arcila", 
            rol: "Pastor", 
            telefono: "+57 315 123 4567", 
            activo: true, 
            sedes: { nombre: "Sede Central Roldanillo", ciudad: "Roldanillo", departamento: "Valle del Cauca" } 
          },
        ]);
      }
    } catch (error) {
      console.error('Error al cargar directorio:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirEdicion = (u) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre_completo);
    setEditTelefono(u.telefono || '');
    setEditRol(u.rol);
    setEditSedeId(u.sede_id || u.sedes?.id || (sedes[0]?.id || ''));
    setEditActivo(u.activo);
  };

  // Guardar cambio de teléfono o traslado ministerial
  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setGuardandoEdicion(true);
    try {
      const numNormalizado = editTelefono.startsWith('+') ? editTelefono : `+57${editTelefono.replace(/\s+/g, '')}`;

      if (!usuarioEditando.id.startsWith('mp-')) {
        const { error } = await supabase
          .from('perfiles')
          .update({
            nombre_completo: editNombre,
            telefono: numNormalizado,
            rol: editRol,
            sede_id: editSedeId || null,
            activo: editActivo,
            updated_at: new Date().toISOString()
          })
          .eq('id', usuarioEditando.id);

        if (error) throw error;
      }

      setUsuarios(prev => prev.map(u => {
        if (u.id === usuarioEditando.id) {
          const sedeElegida = sedes.find(s => s.id === editSedeId);
          return {
            ...u,
            nombre_completo: editNombre,
            telefono: numNormalizado,
            rol: editRol,
            activo: editActivo,
            sedes: sedeElegida || u.sedes
          };
        }
        return u;
      }));

      alert(`¡Expediente de ${editNombre} actualizado con éxito!\n\nNueva línea autorizada: ${numNormalizado}`);
      setUsuarioEditando(null);
    } catch (error) {
      alert('Error actualizando expediente: ' + error.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const alternarEstado = async (id, estadoActual) => {
    try {
      if (!id.startsWith('mp-')) {
        await supabase
          .from('perfiles')
          .update({ activo: !estadoActual })
          .eq('id', id);
      }

      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !estadoActual } : u));
    } catch (error) {
      alert('Error cambiando estado: ' + error.message);
    }
  };

  const registrarMiembro = async (e) => {
    e.preventDefault();
    if (!nombreCompleto || !telefono) return;

    setGuardando(true);
    try {
      const numeroFormateado = telefono.startsWith('+') ? telefono : `+57${telefono.replace(/\s+/g, '')}`;

      const { data, error } = await supabase
        .from('perfiles')
        .insert([{
          nombre_completo: nombreCompleto,
          telefono: numeroFormateado,
          rol: rolSeleccionado,
          sede_id: (rolSeleccionado === 'Pastor' || rolSeleccionado === 'Presbitero') ? sedeSeleccionada : null,
          activo: true,
          notas: notas ? `${notas} | Depto: ${departamento}` : `Depto: ${departamento}`
        }])
        .select(`id, nombre_completo, telefono, rol, activo, sede_id, sedes ( id, nombre, ciudad, departamento )`);

      if (error && error.code !== '23505') throw error;

      setMensajeExito(true);
      setNombreCompleto('');
      setTelefono('');
      setNotas('');

      setTimeout(() => {
        setMensajeExito(false);
        setPestanaActiva('lista');
        cargarDirectorio();
      }, 1200);

    } catch (error) {
      alert('Error al registrar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerBadgeRol = (rol) => {
    const estilos = {
      "Presidente Nacional": "bg-purple-100 text-purple-800 border-purple-200",
      Presbitero: "bg-blue-100 text-blue-800 border-blue-200",
      Pastor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Administracion: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      Abogado: "bg-slate-100 text-slate-800 border-slate-300",
      "Asesoría Jurídica": "bg-purple-50 text-purple-800 border-purple-200 font-bold",
      "Contabilidad": "bg-emerald-50 text-emerald-800 border-emerald-200"
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${estilos[rol] || "bg-slate-50 text-slate-700"}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pt-2">
      
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
              <Compass size={12} className="text-blue-600" /> Misión Panamericana de Colombia · Zona Sur-Occidente
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Control de Personal y Gobernanza</h3>
          <p className="text-slate-500 text-sm">Registro centralizado por la administración zonal para control de accesos, traslados y pérdida de líneas.</p>
        </div>
        
        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2">
          <button
            onClick={cargarDirectorio}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Recargar directorio"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin text-blue-600' : ''} />
          </button>

          <div className="flex bg-slate-200/70 p-1 rounded-xl border border-slate-300/40">
            <button
              onClick={() => setPestanaActiva('lista')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                pestanaActiva === 'lista' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Directorio ({usuarios.length})</span>
            </button>
            <button
              onClick={() => setPestanaActiva('registro')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                pestanaActiva === 'registro' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus size={15} />
              <span>Inscribir Miembro</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- VISTA 1: TABLA DE USUARIOS --- */}
      {pestanaActiva === 'lista' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                  <th className="p-4 pl-6">Miembro Institucional</th>
                  <th className="p-4">Cargo / Rol</th>
                  <th className="p-4">Asignación / Jurisdicción</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nombre y Teléfono */}
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {usuario.rol === 'Presidente Nacional' && <Award size={16} className="text-purple-600" />}
                        {usuario.rol === 'Abogado' && <Scale size={15} className="text-purple-600" />}
                        {usuario.rol === 'Administracion' && <Building2 size={15} className="text-amber-600" />}
                        {usuario.nombre_completo}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Smartphone size={13} className="text-emerald-600" /> Línea autorizada: {usuario.telefono}
                      </div>
                    </td>

                    {/* Badge de Rol */}
                    <td className="p-4">
                      <span className={obtenerBadgeRol(usuario.rol)}>
                        {usuario.rol === 'Administracion' ? 'Administradora Zonal' : usuario.rol}
                      </span>
                    </td>

                    {/* Sede y Ubicación */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Church size={14} className="text-blue-600 shrink-0" />
                        <span>{usuario.sedes?.nombre || 'Sede Central'}</span>
                      </div>
                      <div className="text-xs text-slate-400 pl-5 flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{usuario.sedes ? `${usuario.sedes.ciudad}, ${usuario.sedes.departamento}` : 'Risaralda'}</span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        usuario.activo 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {usuario.activo ? 'Habilitado' : 'Suspendido'}
                      </span>
                    </td>

                    {/* Acciones: Editar Teléfono / Suspender */}
                    <td className="p-4 text-right pr-6 space-x-1.5">
                      <button 
                        onClick={() => abrirEdicion(usuario)}
                        className="inline-flex p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Actualizar teléfono / sede por cambio o pérdida de equipo"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button 
                        onClick={() => alternarEstado(usuario.id, usuario.activo)}
                        className={`inline-flex p-2 rounded-lg transition-colors ${
                          usuario.activo 
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={usuario.activo ? "Suspender Acceso" : "Habilitar Acceso"}
                      >
                        {usuario.activo ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VISTA 2: FORMULARIO DE ALTA POR OFICINA CENTRAL --- */}
      {pestanaActiva === 'registro' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
          <div className="bg-slate-900 p-6 text-center border-b-4 border-emerald-500 text-white">
            <h4 className="text-lg font-bold">Inscripción en la Base de Datos Central</h4>
            <p className="text-slate-400 text-xs mt-1">
              Solo los pastores y funcionarios registrados desde esta pantalla podrán autenticarse en el sistema.
            </p>
          </div>

          <form onSubmit={registrarMiembro} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                  <input 
                    type="text" 
                    required 
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Pastor Wilson Mosquera o Lic. Sandra Ruiz" 
                    className="pl-9 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Departamento (Zona Sur-Occidente)</label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  <option value="Valle del Cauca">Valle del Cauca</option>
                  <option value="Risaralda">Risaralda</option>
                  <option value="Quindío">Quindío</option>
                  <option value="Caldas">Caldas</option>
                  <option value="Chocó">Chocó</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Smartphone size={14} className="text-emerald-600" />
                  Línea Telefónica Autorizada (WhatsApp)
                </label>
                <input 
                  type="tel" 
                  required 
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 315 123 4567" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-800" 
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Cargo / Rol en la Organización</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Shield size={16} /></div>
                  <select 
                    value={rolSeleccionado}
                    onChange={(e) => setRolSeleccionado(e.target.value)}
                    className="pl-9 w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="Pastor">Pastor Local (Congregación)</option>
                    <option value="Presbitero">Presbítero Zonal (Junta Directiva)</option>
                    <option value="Administracion">Administración y Finanzas (Nancy García)</option>
                    <option value="Contabilidad">Contabilidad Zonal (Auditoría)</option>
                    <option value="Abogado">Asesoría Jurídica y Legal (Dra. Elizabeth Nieto)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Sede Asignada</label>
                <select
                  value={sedeSeleccionada}
                  onChange={(e) => setSedeSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.ciudad}, {s.departamento})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={guardando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Inscribir y Habilitar Acceso en el Censo Central
              </button>
            </div>

            {mensajeExito && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                ¡Línea registrada exitosamente! El pastor ya puede ingresar con este número.
              </div>
            )}
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: ACTUALIZAR EXPEDIENTE POR CAMBIO O PÉRDIDA DE TELÉFONO
      ========================================================================= */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 p-6 flex justify-between items-center text-white border-b border-slate-800">
              <div>
                <h4 className="font-bold text-lg">Actualizar Expediente Ministerial</h4>
                <p className="text-xs text-blue-300">Gestión de cambio de línea o traslado por la Administración Zonal</p>
              </div>
              <button 
                onClick={() => setUsuarioEditando(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>

              {/* CAMBIO DE NÚMERO POR ROBO O CAMBIO DE SIMCARD */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <Smartphone size={15} className="text-amber-700" />
                  Nueva Línea Autorizada (WhatsApp)
                </label>
                <input 
                  type="tel" 
                  required
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-bold text-slate-900 bg-white"
                />
                <p className="text-[11px] text-amber-800 leading-tight">
                  Al actualizar este campo, el número anterior queda revocado inmediatamente y el pastor podrá ingresar con su nuevo equipo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rol / Cargo</label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="Pastor">Pastor Local</option>
                    <option value="Presbitero">Presbítero Zonal</option>
                    <option value="Administracion">Administración y Finanzas</option>
                    <option value="Contabilidad">Contabilidad Zonal</option>
                    <option value="Abogado">Asesoría Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Estado de Acceso</label>
                  <select
                    value={editActivo ? 'true' : 'false'}
                    onChange={(e) => setEditActivo(e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white font-semibold"
                  >
                    <option value="true">Habilitado (Activo)</option>
                    <option value="false">Suspendido (Sin Acceso)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Sede Asignada (Traslado Ministerial)</label>
                <select
                  value={editSedeId}
                  onChange={(e) => setEditSedeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.ciudad}, {s.departamento})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {guardandoEdicion ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Cambios en Base de Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
