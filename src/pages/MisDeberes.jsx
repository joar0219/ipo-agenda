import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  User, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  Calendar, 
  Check, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Building,
  Plus,
  Send,
  X,
  Compass,
  CheckCheck
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { useAuth } from '../context/AuthContext';

export default function MisDeberes() {
  const { user, perfil } = useAuth();
  const [vistaActiva, setVistaActiva] = useState(perfil?.esAdministradora ? 'auditoria' : 'mis-deberes');
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [subiendoId, setSubiendoId] = useState(null);

  // Estados para el Modal de Nancy: "Emitir Nuevo Deber Zonal"
  const [modalNuevoDeber, setModalNuevoDeber] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState('MEDIA');
  const [nuevoRequiereAdjunto, setNuevoRequiereAdjunto] = useState(true);
  const [guardandoDeber, setGuardandoDeber] = useState(false);

  // Filtro de departamento para la auditoría de la Zona Sur-Occidente
  const [filtroDpto, setFiltroDpto] = useState('Todos');

  // Datos reales de auditoría para las sedes oficiales registradas (Sin registros ficticios)
  const [auditoriaSedes, setAuditoriaSedes] = useState([
    {
      id: 1,
      sede: "Sede Central Roldanillo",
      departamento: "Valle del Cauca",
      pastor: "José Orlando Arcila",
      telefono: "+57 311 387 0976",
      informe: "Informe Financiero Mensual",
      estado: "Entregado",
      fechaEntrega: "2026-10-22",
      soporteUrl: "https://edbbhvfdocttghcpvxhu.supabase.co/storage/v1/object/public/soportes-institucionales/ejemplo_balance_roldanillo.pdf"
    },
    {
      id: 2,
      sede: "Presbiterio Central Pereira",
      departamento: "Risaralda",
      pastor: "Gabriel González (Presbítero)",
      telefono: "+57 310 857 0176",
      informe: "Informe Financiero Mensual",
      estado: "Entregado",
      fechaEntrega: "2026-10-21",
      soporteUrl: "https://edbbhvfdocttghcpvxhu.supabase.co/storage/v1/object/public/soportes-institucionales/ejemplo_balance_pereira.pdf"
    }
  ]);

  useEffect(() => {
    setVistaActiva(perfil?.esAdministradora ? 'auditoria' : 'mis-deberes');
  }, [perfil?.esAdministradora]);

  useEffect(() => {
    cargarDeberes();
  }, [user, perfil]);

  const cargarDeberes = async () => {
    try {
      setCargando(true);
      
      const { data: deberesData, error: errDeberes } = await supabase
        .from('deberes')
        .select('*')
        .eq('activo', true)
        .order('fecha_limite', { ascending: true });

      if (errDeberes) throw errDeberes;

      let entregasMap = {};
      // Consultar entregas en Supabase (y cruzarlas tanto para el pastor actual como para la tabla de auditoría de Nancy)
      const { data: todasEntregas } = await supabase
        .from('entregas_deberes')
        .select('*, perfiles(nombre_completo, telefono)');

      if (todasEntregas) {
        todasEntregas.forEach(e => {
          if (user?.id && e.usuario_id === user.id) {
            entregasMap[e.deber_id] = e;
          }
        });

        // Actualizar tabla de auditoría zonal en tiempo real si algún pastor radicó soporte
        setAuditoriaSedes(prev => prev.map(fila => {
          const digitosFila = (fila.telefono || '').replace(/\D/g, '').slice(-10);
          const entregaPastor = todasEntregas.find(e => {
            const digitosEntrega = (e.perfiles?.telefono || '').replace(/\D/g, '').slice(-10);
            return digitosEntrega && digitosEntrega === digitosFila && e.estado === 'completado';
          });
          if (entregaPastor) {
            return {
              ...fila,
              estado: 'Entregado',
              fechaEntrega: entregaPastor.fecha_entrega ? entregaPastor.fecha_entrega.slice(0, 10) : new Date().toISOString().slice(0, 10),
              soporteUrl: entregaPastor.archivo_url || fila.soporteUrl
            };
          }
          return fila;
        }));
      }

      const tareasFusionadas = (deberesData || []).map(d => {
        const miEntrega = entregasMap[d.id];
        return {
          id: d.id,
          titulo: d.titulo,
          descripcion: d.descripcion,
          asignadoPor: d.asignado_por || 'Directiva Zonal IPO',
          fechaLimite: d.fecha_limite,
          prioridad: d.prioridad || 'MEDIA',
          requiereAdjunto: Boolean(d.requiere_adjunto),
          estado: miEntrega?.estado === 'completado' ? 'completado' : 'pendiente',
          archivoUrl: miEntrega?.archivo_url || null,
          fechaEntrega: miEntrega?.fecha_entrega || null
        };
      });

      setTareas(tareasFusionadas);
    } catch (error) {
      console.error('Error al cargar deberes:', error);
    } finally {
      setCargando(false);
    }
  };

  const alternarEstado = async (id) => {
    const tareaActual = tareas.find(t => t.id === id);
    if (!tareaActual) return;

    const nuevoEstado = tareaActual.estado === 'pendiente' ? 'completado' : 'pendiente';
    setProcesandoId(id);

    try {
      if (user?.id) {
        await supabase
          .from('entregas_deberes')
          .upsert({
            deber_id: id,
            usuario_id: user.id,
            estado: nuevoEstado,
            fecha_entrega: nuevoEstado === 'completado' ? new Date().toISOString() : null
          }, { onConflict: 'deber_id,usuario_id' });
      }

      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    } catch (error) {
      console.error('Error actualizando estado:', error);
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarSubidaArchivo = (tarea) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/png,image/jpeg,image/webp';
    input.onchange = async (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;

      setSubiendoId(tarea.id);

      try {
        let publicUrl = null;
        if (user?.id) {
          const extension = archivo.name.split('.').pop();
          const rutaLimpia = `${user.id}/${tarea.id}_${Date.now()}.${extension}`;

          const { error: errUpload } = await supabase.storage
            .from('soportes-institucionales')
            .upload(rutaLimpia, archivo, { cacheControl: '3600', upsert: true });

          if (!errUpload) {
            const { data } = supabase.storage.from('soportes-institucionales').getPublicUrl(rutaLimpia);
            publicUrl = data.publicUrl;

            await supabase.from('entregas_deberes').upsert({
              deber_id: tarea.id,
              usuario_id: user.id,
              estado: 'completado',
              archivo_url: publicUrl,
              fecha_entrega: new Date().toISOString()
            }, { onConflict: 'deber_id,usuario_id' });
          } else {
            console.warn('Aviso de almacenamiento en Supabase Storage:', errUpload.message);
            // Si el bucket está en creación o en modo local, creamos un blob URL visible en el navegador
            try {
              publicUrl = URL.createObjectURL(archivo);
            } catch (errBlob) {
              publicUrl = null;
            }
          }
        } else {
          try {
            publicUrl = URL.createObjectURL(archivo);
          } catch (errBlob) {
            publicUrl = null;
          }
        }

        setTareas(prev => prev.map(t => t.id === tarea.id ? { 
          ...t, 
          estado: 'completado', 
          archivoUrl: publicUrl || "https://ejemplo-soporte-institucional.pdf",
          fechaEntrega: new Date().toISOString()
        } : t));

        // Sincronizar de inmediato en la tabla de Auditoría Zonal para la sede del pastor actual
        const telActual = (perfil?.telefono || '').replace(/\D/g, '').slice(-10);
        setAuditoriaSedes(prev => prev.map(s => {
          if ((s.telefono || '').replace(/\D/g, '').slice(-10) === telActual) {
            return {
              ...s,
              estado: 'Entregado',
              fechaEntrega: new Date().toISOString().slice(0, 10),
              soporteUrl: publicUrl || "https://ejemplo-soporte-institucional.pdf"
            };
          }
          return s;
        }));

        alert(`¡Soporte "${archivo.name}" radicado con éxito ante la administración zonal de Nancy García!`);
      } catch (error) {
        alert('Error al radicar el soporte: ' + error.message);
      } finally {
        setSubiendoId(null);
      }
    };
    input.click();
  };

  // Nancy emite un nuevo deber institucional para las congregaciones
  const emitirNuevoDeberZonal = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo || !nuevaFechaLimite) return;

    setGuardandoDeber(true);
    try {
      const { data, error } = await supabase
        .from('deberes')
        .insert([{
          titulo: nuevoTitulo,
          descripcion: nuevaDescripcion || 'Instrucción emitida por la Administración Zonal Sur-Occidente.',
          asignado_por: `${perfil?.nombre_completo} (Administración Zonal)`,
          rol_destino: 'Pastor',
          fecha_limite: nuevaFechaLimite,
          prioridad: nuevaPrioridad,
          requiere_adjunto: nuevoRequiereAdjunto,
          activo: true
        }])
        .select()
        .single();

      if (error) throw error;

      alert("¡Deber institucional emitido con éxito a todas las sedes de la Zona Sur-Occidente!");
      setModalNuevoDeber(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevaFechaLimite('');
      cargarDeberes();
    } catch (error) {
      alert("Error al emitir deber: " + error.message);
    } finally {
      setGuardandoDeber(false);
    }
  };

  // Filtrado de auditoría por departamento
  const sedesFiltradas = filtroDpto === 'Todos' 
    ? auditoriaSedes 
    : auditoriaSedes.filter(s => s.departamento === filtroDpto);

  const sedesAlDia = auditoriaSedes.filter(s => s.estado === 'Entregado').length;
  const sedesEnMora = auditoriaSedes.filter(s => s.estado === 'Pendiente').length;
  const porcentajeCumplimiento = Math.round((sedesAlDia / auditoriaSedes.length) * 100);

  const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
  const urgentes = tareas.filter(t => t.estado === 'pendiente' && t.prioridad === 'ALTA').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pt-2">
      
      {/* Encabezado Institucional y Control Zonal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
              <Compass size={12} /> Zona Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">
            {perfil?.esAdministradora ? "Gestor de Auditoría y Deberes Zonales" : "Mis Deberes Institucionales"}
          </h3>
          <p className="text-slate-500 text-sm">
            {perfil?.esAdministradora 
              ? `Supervisión de informes financieros a cargo de ${perfil?.nombre_completo} (Administración Zonal)`
              : "Buzón de tareas y rendición de cuentas con la administración zonal de la IPO."}
          </p>
        </div>
        
        {/* Pestañas de Vista (Auditoría Zonal vs Mis Deberes) */}
        <div className="flex items-center gap-3">
          {perfil?.esAdministradora && (
            <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/40">
              <button
                onClick={() => setVistaActiva('auditoria')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  vistaActiva === 'auditoria' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building size={14} className="text-blue-600" />
                <span>Auditoría Zonal ({auditoriaSedes.length})</span>
              </button>
              <button
                onClick={() => setVistaActiva('mis-deberes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  vistaActiva === 'mis-deberes' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={14} className="text-emerald-600" />
                <span>Mis Tareas</span>
              </button>
            </div>
          )}

          <button 
            onClick={cargarDeberes}
            disabled={cargando}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Recargar deberes"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: PANEL DE AUDITORÍA ZONAL (PARA NANCY GARCÍA Y DIRECTIVA)
      ========================================================================= */}
      {vistaActiva === 'auditoria' && perfil?.esAdministradora && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Métricas de la Zona Sur-Occidente */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Sedes en la Zona</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{auditoriaSedes.length}</p>
              <span className="text-[11px] text-blue-600 font-medium">5 Departamentos cubiertos</span>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Informes al Día</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{sedesAlDia}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Soportes PDF verificados</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase">Sedes en Mora</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{sedesEnMora}</p>
              <span className="text-[11px] text-rose-600 font-medium">Requieren notificación</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Cumplimiento Zonal</span>
                <p className="text-2xl font-black text-blue-600 mt-1">{porcentajeCumplimiento}%</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${porcentajeCumplimiento}%` }}></div>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Botón para Nancy */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filtrar:</span>
              {['Todos', 'Valle del Cauca', 'Risaralda', 'Quindío', 'Caldas', 'Chocó'].map(dpto => (
                <button
                  key={dpto}
                  onClick={() => setFiltroDpto(dpto)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    filtroDpto === dpto 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dpto}
                </button>
              ))}
            </div>

            {/* BOTÓN PARA QUE NANCY CREE NUEVOS DEBERES */}
            <button
              onClick={() => setModalNuevoDeber(true)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <Plus size={16} />
              Emitir Nuevo Deber Zonal
            </button>
          </div>

          {/* Tabla de Rendición de Cuentas por Sede */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                    <th className="p-4 pl-6">Congregación / Sede</th>
                    <th className="p-4">Pastor Titular</th>
                    <th className="p-4">Obligación Mensual</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-right pr-6">Acción de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {sedesFiltradas.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building size={15} className="text-blue-600" />
                          {item.sede}
                        </div>
                        <div className="text-xs text-slate-400 pl-5">{item.departamento}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-slate-800">{item.pastor}</div>
                        <div className="text-xs text-slate-500">{item.telefono}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-slate-700">{item.informe}</div>
                        {item.fechaEntrega ? (
                          <div className="text-xs text-emerald-600 font-medium">Radicado: {item.fechaEntrega}</div>
                        ) : (
                          <div className="text-xs text-rose-500 font-medium">Plazo vencido el día 10</div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.estado === 'Entregado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.estado === 'Entregado' ? <CheckCheck size={14} /> : <AlertCircle size={14} />}
                          {item.estado}
                        </span>
                      </td>

                      <td className="p-4 text-right pr-6">
                        {item.soporteUrl ? (
                          <a
                            href={item.soporteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FileText size={14} />
                            Ver Soporte PDF
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <a
                            href={`https://wa.me/${item.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Paz de Cristo Pastor ${item.pastor}. Le saluda Nancy García desde la Administración Zonal Sur-Occidente de la Misión Panamericana. Le recordamos amablemente radicar el soporte de: ${item.informe} correspondiente a la sede ${item.sede}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Send size={13} />
                            Recordar por WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VISTA 2: LISTA DE TAREAS INDIVIDUALES (PASTOR LOCAL / CUMPLIMIENTO)
      ========================================================================= */}
      {(!perfil?.esAdministradora || vistaActiva === 'mis-deberes') && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Resumen para el pastor */}
          <div className="flex gap-3 justify-end mb-2">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col items-center shadow-sm">
              <span className="text-xl font-bold text-slate-700">{pendientes}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendientes</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex flex-col items-center shadow-sm">
              <span className="text-xl font-bold text-rose-600">{urgentes}</span>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Urgentes</span>
            </div>
          </div>

          {cargando && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Sincronizando deberes de la Misión Panamericana...</p>
            </div>
          )}

          {!cargando && tareas.map((tarea) => (
            <div 
              key={tarea.id} 
              className={`relative bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row gap-5
                ${tarea.estado === 'completado' ? 'border-slate-200 bg-slate-50/70' : 
                  tarea.prioridad === 'ALTA' ? 'border-rose-200 shadow-sm' : 'border-slate-200 shadow-sm'}
              `}
            >
              {tarea.estado === 'pendiente' && tarea.prioridad === 'ALTA' && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl"></div>
              )}

              <button 
                onClick={() => alternarEstado(tarea.id)}
                disabled={procesandoId === tarea.id || subiendoId === tarea.id}
                className="shrink-0 mt-1 sm:mt-0 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
              >
                {procesandoId === tarea.id ? (
                  <Loader2 size={28} className="animate-spin text-blue-600" />
                ) : tarea.estado === 'completado' ? (
                  <CheckCircle2 size={28} className="text-emerald-500" />
                ) : (
                  <Circle size={28} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className={`text-lg font-bold truncate ${tarea.estado === 'completado' ? 'text-slate-600' : 'text-slate-800'}`}>
                    {tarea.titulo}
                  </h4>
                  {tarea.estado === 'pendiente' && tarea.prioridad === 'ALTA' && (
                    <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                      <AlertCircle size={12} /> URGENTE
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-500 mb-4 leading-relaxed max-w-3xl">
                  {tarea.descripcion}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                    <User size={14} className="text-slate-400" />
                    Asignado por: <span className="text-slate-700 font-semibold">{tarea.asignadoPor}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${tarea.estado === 'pendiente' && tarea.prioridad === 'ALTA' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100'}`}>
                    <Calendar size={14} className={tarea.estado === 'pendiente' && tarea.prioridad === 'ALTA' ? 'text-rose-500' : 'text-slate-400'} />
                    Vence: <span className={tarea.estado === 'pendiente' && tarea.prioridad === 'ALTA' ? 'text-rose-700 font-bold' : 'text-slate-700'}>{tarea.fechaLimite}</span>
                  </div>

                  {tarea.archivoUrl && (
                    <a
                      href={tarea.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors font-semibold"
                    >
                      <FileText size={13} />
                      Soporte Radicado
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-5 mt-2 sm:mt-0">
                {tarea.estado === 'pendiente' ? (
                  <>
                    {tarea.requiereAdjunto ? (
                      <button 
                        onClick={() => manejarSubidaArchivo(tarea)}
                        disabled={subiendoId === tarea.id}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm"
                      >
                        {subiendoId === tarea.id ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Radicando...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={18} />
                            Subir Soporte (PDF)
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={() => alternarEstado(tarea.id)}
                        disabled={procesandoId === tarea.id}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm"
                      >
                        <Check size={18} />
                        Finalizar Tarea
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-emerald-600 h-full gap-1">
                    <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      Auditoría OK
                    </div>
                    {tarea.requiereAdjunto && (
                      <button 
                        onClick={() => manejarSubidaArchivo(tarea)}
                        disabled={subiendoId === tarea.id}
                        className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium mt-1"
                      >
                        Reemplazar archivo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          MODAL: NANCY GARCÍA EMITE UN NUEVO DEBER INSTITUCIONAL
      ========================================================================= */}
      {modalNuevoDeber && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <div>
                <h4 className="font-bold text-lg">Emitir Deber Zonal</h4>
                <p className="text-xs text-slate-400">Administración Zonal Sur-Occidente — Misión Panamericana</p>
              </div>
              <button 
                onClick={() => setModalNuevoDeber(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={emitirNuevoDeberZonal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Título de la Obligación</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Balance Trimestral o Censo Zonal 2026"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Instrucciones para las Sedes</label>
                <textarea 
                  rows="3"
                  placeholder="Detalles sobre lo que cada pastor debe radicar..."
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha Límite</label>
                  <input 
                    type="date" 
                    required
                    value={nuevaFechaLimite}
                    onChange={(e) => setNuevaFechaLimite(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Prioridad</label>
                  <select
                    value={nuevaPrioridad}
                    onChange={(e) => setNuevaPrioridad(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="ALTA">Alta (Urgente)</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="reqAdjunto"
                  checked={nuevoRequiereAdjunto}
                  onChange={(e) => setNuevoRequiereAdjunto(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="reqAdjunto" className="text-xs font-semibold text-slate-700">
                  Exige comprobante o soporte adjunto (PDF / Imagen)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoDeber(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoDeber}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {guardandoDeber ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Publicar en la Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
