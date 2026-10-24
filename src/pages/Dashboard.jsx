import { useEffect, useState } from 'react';
import { CalendarClock, AlertTriangle, CircleDollarSign, Plus, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, perfil } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [deberesTotales, setDeberesTotales] = useState(0);
  const [deberesCompletados, setDeberesCompletados] = useState(0);
  
  // Estados para el formulario de nuevo evento
  const [titulo, setTitulo] = useState('');
  const [tipoAlcance, setTipoAlcance] = useState('Local');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [esObligatorio, setEsObligatorio] = useState(false);
  const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    obtenerAgenda();
    obtenerEstadisticasDeberes();
  }, [user]);

  const obtenerAgenda = async () => {
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Error cargando la agenda:", error.message);
    } finally {
      setCargando(false);
    }
  };

  const obtenerEstadisticasDeberes = async () => {
    try {
      const { count: total, error: errTotal } = await supabase
        .from('deberes')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      if (!errTotal && total !== null) {
        setDeberesTotales(total);
      }

      if (user?.id) {
        const { count: completados, error: errComp } = await supabase
          .from('entregas_deberes')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', user.id)
          .eq('estado', 'completado');

        if (!errComp && completados !== null) {
          setDeberesCompletados(completados);
        }
      }
    } catch (err) {
      console.error("Error obteniendo estadísticas:", err);
    }
  };

  const guardarEvento = async (e) => {
    e.preventDefault();
    setMensajeForm({ tipo: '', texto: '' });

    if (!titulo || !fechaInicio || !fechaFin) {
      setMensajeForm({ tipo: 'error', texto: 'Por favor, completa todos los campos esenciales.' });
      return;
    }

    // Validación inteligente: Verificar si es lunes (Descanso Ministerial)
    const diaSeleccionado = new Date(fechaInicio).getDay();
    if (diaSeleccionado === 1 && tipoAlcance !== 'Descanso') {
      const confirmar = window.confirm("¡Atención! La fecha seleccionada es un Lunes (Descanso Ministerial). ¿Desea registrar la actividad de todas formas?");
      if (!confirmar) return;
    }

    try {
      const { error } = await supabase
        .from('agenda')
        .insert([
          { 
            titulo, 
            tipo_alcance: tipoAlcance, 
            fecha_inicio: new Date(fechaInicio).toISOString(), 
            fecha_fin: new Date(fechaFin).toISOString(), 
            es_obligatorio: esObligatorio,
            usuario_id: user?.id || null
          }
        ]);

      if (error) throw error;

      setMensajeForm({ tipo: 'exito', texto: 'Evento coordinado y guardado con éxito.' });
      
      // Limpiar formulario
      setTitulo('');
      setFechaInicio('');
      setFechaFin('');
      setEsObligatorio(false);
      
      // Recargar la lista en tiempo real
      obtenerAgenda();
    } catch (error) {
      setMensajeForm({ tipo: 'error', texto: 'Error al guardar: ' + error.message });
    }
  };

  const eliminarEvento = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas cancelar y eliminar esta actividad?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('id', id);

      if (error) throw error;
      obtenerAgenda();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const obtenerColorTipo = (tipo) => {
    switch(tipo) {
      case 'Nacional_IPO': return 'bg-red-500';
      case 'Local': return 'bg-blue-500';
      case 'Personal': return 'bg-green-500';
      case 'Descanso': return 'bg-slate-400';
      default: return 'bg-slate-200';
    }
  };

  // Cálculo de conflictos: eventos que no son de descanso pero están agendados un lunes
  const conflictos = eventos.filter(ev => {
    const d = new Date(ev.fecha_inicio).getDay();
    return d === 1 && ev.tipo_alcance !== 'Descanso';
  }).length;

  const porcentajeSoportes = deberesTotales > 0 
    ? Math.round((deberesCompletados / deberesTotales) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Misión Panamericana de Colombia · Zona Sur-Occidente
          </span>
        </div>
        <h3 className="text-2xl font-bold text-slate-800">Panel de Control General</h3>
        <p className="text-slate-500 text-sm">
          {perfil?.esAdministradora 
            ? `Panel Zonal a cargo de ${perfil?.nombre_completo} (Administradora Zonal - Risaralda, Valle, Chocó)`
            : "Avance de sincronización de agendas y rendición de cuentas con la administración zonal."}
        </p>
      </div>

      {/* Tarjetas de Estadísticas Reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Eventos en agenda</p>
            <h4 className="text-2xl font-bold text-slate-800">{eventos.length}</h4>
            <p className="text-xs text-blue-600 font-medium mt-1">Base de Datos Supabase Activa</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
          <div className={`p-3 rounded-xl ${conflictos > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Conflictos con Descanso</p>
            <h4 className={`text-2xl font-bold ${conflictos > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{conflictos}</h4>
            <p className="text-xs font-medium mt-1 text-slate-500">
              {conflictos > 0 ? 'Actividades en día Lunes' : 'Días de descanso respetados'}
            </p>
          </div>
        </div>

        {/* Tarjeta Adaptativa: Auditoría Zonal para Nancy o Deberes para el Pastor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-start gap-4 mb-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                {perfil?.esAdministradora ? "Rendición Zonal Sur-Occidente" : "Cumplimiento Deberes"}
              </p>
              <h4 className="text-xl font-bold text-slate-800">
                {perfil?.esAdministradora ? "10 de 12 Sedes al día" : `${deberesCompletados} de ${deberesTotales} completados`}
              </h4>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: perfil?.esAdministradora ? '83%' : `${porcentajeSoportes}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">
            {perfil?.esAdministradora ? "83% Soportes radicados en la zona" : `${porcentajeSoportes}% al día`}
          </p>
        </div>
      </div>

      {/* Sección Principal de Trabajo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario de Alta */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            Agendar Actividad
          </h4>
          
          <form onSubmit={guardarEvento} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título de la actividad</label>
              <input 
                type="text" 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Junta Extraordinaria, Servicio..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alcance institucional</label>
              <select 
                value={tipoAlcance}
                onChange={(e) => setTipoAlcance(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Local">Local (Congregación)</option>
                <option value="Nacional_IPO">Nacional (Directiva IPO)</option>
                <option value="Personal">Personal Pastoral</option>
                <option value="Descanso">Descanso Ministerial</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inicio (Fecha y Hora)</label>
                <input 
                  type="datetime-local" 
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Finalización</label>
                <input 
                  type="datetime-local" 
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="obligatorio"
                checked={esObligatorio}
                onChange={(e) => setEsObligatorio(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="obligatorio" className="text-sm font-medium text-slate-700 select-none">
                Marcar como Carácter Obligatorio
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white py-2 px-4 rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors mt-2"
            >
              Publicar en el Ecosistema
            </button>

            {mensajeForm.texto && (
              <div className={`p-3 rounded-lg text-xs font-semibold text-center mt-2 ${mensajeForm.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {mensajeForm.texto}
              </div>
            )}
          </form>
        </div>

        {/* Visualizador de Agenda Dinámica */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-slate-500" />
              Línea de Tiempo Unificada
            </h4>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {cargando ? (
              <div className="p-6 text-center text-slate-500">Sincronizando con Supabase...</div>
            ) : eventos.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No hay actividades programadas.</div>
            ) : (
              eventos.map((evento) => (
                <div key={evento.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                  <div className={`w-2 h-12 rounded-full ${obtenerColorTipo(evento.tipo_alcance)}`}></div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-800">{evento.titulo}</h5>
                    <p className="text-sm text-slate-500">{evento.tipo_alcance.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-sm font-bold text-slate-800 capitalize">
                      {new Date(evento.fecha_inicio).toLocaleDateString('es-CO', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-2">
                      {evento.es_obligatorio && (
                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
                          Obligatorio
                        </span>
                      )}
                      <button 
                        onClick={() => eliminarEvento(evento.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Eliminar actividad"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
