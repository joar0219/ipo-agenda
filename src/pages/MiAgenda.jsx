import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  Church,
  Globe,
  Trash2,
  Filter
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { useAuth } from '../context/AuthContext';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { es: es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function MiAgenda() {
  const { user, perfil } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroAlcance, setFiltroAlcance] = useState('Todos');

  // Estados para el Modal de Nuevo Evento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoDetalle, setEventoDetalle] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('11:00');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoAlcance, setNuevoAlcance] = useState('Local');
  const [esObligatorio, setEsObligatorio] = useState(false);

  const cargarAgenda = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;

      if (data) {
        // Filtrar según el dominio del usuario:
        // - Nivel IPO (Nacional_IPO, Zonal): visible para todos los registrados.
        // - Eclesial / Local: visible para su comunidad y para el Dominio Global.
        // - Personal: privado del pastor que lo creó (salvo que no tenga usuario_id asignado).
        const miId = user?.id && !String(user.id).startsWith('perfil-') ? user.id : null;

        const filtradosDominio = data.filter((ev) => {
          if (ev.tipo_alcance === 'Nacional_IPO' || ev.tipo_alcance === 'Zonal') return true;
          if (ev.tipo_alcance === 'Personal') {
            if (!ev.usuario_id || !miId) return true;
            return ev.usuario_id === miId;
          }
          // Eclesial / Local
          if (perfil?.esDominioGlobal) return true;
          if (!ev.sede_id || !perfil?.sede_id) return true;
          return ev.sede_id === perfil.sede_id;
        });

        const eventosFormateados = filtradosDominio.map((evento) => ({
          id: evento.id,
          title: evento.titulo,
          descripcion: evento.descripcion || '',
          start: new Date(evento.fecha_inicio),
          end: new Date(evento.fecha_fin),
          tipo_alcance: evento.tipo_alcance,
          es_obligatorio: evento.es_obligatorio,
          usuario_id: evento.usuario_id,
          sede_id: evento.sede_id
        }));

        setEventos(eventosFormateados);
      }
    } catch (error) {
      console.error("Error al descargar la agenda:", error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
  }, [user, perfil]);

  // --- LÓGICA LOGÍSTICA: RESTRICCIÓN DEL LUNES DE DESCANSO ---
  const handleSelectSlot = (slotInfo) => {
    const fecha = slotInfo.start;
    const diaDeLaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    if (diaDeLaSemana === 1) {
      const confirmarPersonal = window.confirm(
        "DÍA DE DESCANSO PASTORAL (LUNES)\n\n" +
        "Por políticas institucionales de la IPO, los días Lunes están reservados para el descanso pastoral y familiar (no se agendan servicios eclesiales ni convocatorias).\n\n" +
        "¿Deseas anotar únicamente un recordatorio en tu Agenda Personal / Descanso?"
      );
      if (!confirmarPersonal) return;
      setNuevoAlcance('Personal');
    } else {
      setNuevoAlcance('Local');
    }

    setFechaSeleccionada(fecha);
    setModalAbierto(true);
  };

  // --- GUARDAR ACTIVIDAD EN SUPABASE ---
  const guardarEvento = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo || !fechaSeleccionada) return;

    // Validar que un pastor sin dominio global no intente publicar eventos globales IPO
    if (!perfil?.esDominioGlobal && (nuevoAlcance === 'Nacional_IPO' || nuevoAlcance === 'Zonal')) {
      alert('Solo el Dominio Global (Administración, Presbiterio, Asesoría Jurídica o Presidencia) puede publicar eventos a nivel general IPO.');
      return;
    }

    const baseFecha = new Date(fechaSeleccionada);
    const [hI, mI] = (horaInicio || '09:00').split(':').map(Number);
    const [hF, mF] = (horaFin || '11:00').split(':').map(Number);

    const fechaInicio = new Date(baseFecha);
    fechaInicio.setHours(hI || 9, mI || 0, 0, 0);

    const fechaFin = new Date(baseFecha);
    fechaFin.setHours(hF || 11, mF || 0, 0, 0);
    if (fechaFin <= fechaInicio) {
      fechaFin.setTime(fechaInicio.getTime() + 2 * 60 * 60 * 1000);
    }

    const uuidValido = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
      ? user.id
      : null;

    try {
      const { data, error } = await supabase
        .from('agenda')
        .insert([
          {
            titulo: nuevoTitulo,
            descripcion: nuevaDescripcion || null,
            fecha_inicio: fechaInicio.toISOString(),
            fecha_fin: fechaFin.toISOString(),
            tipo_alcance: nuevoAlcance,
            es_obligatorio: nuevoAlcance === 'Personal' ? false : esObligatorio,
            usuario_id: uuidValido,
            sede_id: perfil?.sede_id || null
          }
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const guardado = data[0];
        setEventos(prev => [
          ...prev,
          {
            id: guardado.id,
            title: guardado.titulo,
            descripcion: guardado.descripcion || '',
            start: new Date(guardado.fecha_inicio),
            end: new Date(guardado.fecha_fin),
            tipo_alcance: guardado.tipo_alcance,
            es_obligatorio: guardado.es_obligatorio
          }
        ]);
      }

      setModalAbierto(false);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevoAlcance('Local');
      setEsObligatorio(false);
    } catch (error) {
      console.error("Error al insertar en base de datos:", error.message);
      alert("No se pudo registrar la actividad: " + error.message);
    }
  };

  const eliminarEvento = async (evento) => {
    const esGlobal = evento.tipo_alcance === 'Nacional_IPO' || evento.tipo_alcance === 'Zonal';
    if (esGlobal && !perfil?.esDominioGlobal) {
      alert('Este evento es de nivel institucional IPO. Solo la Directiva o Administración Global puede eliminarlo.');
      return;
    }

    const confirmar = window.confirm(`¿Deseas eliminar la actividad "${evento.title}" de la agenda?`);
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('agenda').delete().eq('id', evento.id);
      if (error) throw error;
      setEventos(prev => prev.filter(ev => ev.id !== evento.id));
      setEventoDetalle(null);
    } catch (error) {
      alert('Error al eliminar evento: ' + error.message);
    }
  };

  const eventosFiltrados = eventos.filter(ev => {
    if (filtroAlcance === 'Todos') return true;
    if (filtroAlcance === 'Personal') return ev.tipo_alcance === 'Personal' || ev.tipo_alcance === 'Descanso';
    if (filtroAlcance === 'Local') return ev.tipo_alcance === 'Local';
    if (filtroAlcance === 'IPO') return ev.tipo_alcance === 'Nacional_IPO' || ev.tipo_alcance === 'Zonal';
    return true;
  });

  const eventStyleGetter = (evento) => {
    let backgroundColor = '#2563eb'; // Azul: Agenda Eclesial / Comunidad Local
    if (evento.tipo_alcance === 'Personal' || evento.tipo_alcance === 'Descanso') {
      backgroundColor = '#059669'; // Esmeralda: Agenda Personal del Pastor
    } else if (evento.tipo_alcance === 'Zonal' || evento.tipo_alcance === 'Nacional_IPO') {
      backgroundColor = '#dc2626'; // Rojo Institucional: Nivel IPO (Zonal / Nacional)
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: '600',
        padding: '3px 7px'
      }
    };
  };

  const obtenerEtiquetaAlcance = (tipo) => {
    if (tipo === 'Personal' || tipo === 'Descanso') return 'Agenda Personal';
    if (tipo === 'Local') return 'Agenda Eclesial (Comunidad)';
    if (tipo === 'Zonal') return 'Nivel IPO Zonal';
    if (tipo === 'Nacional_IPO') return 'Nivel IPO Nacional';
    return tipo;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 h-full flex flex-col relative">
      {/* Cabecera de la página y Leyenda de los 3 Niveles de Agenda */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              perfil?.esDominioGlobal
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {perfil?.esDominioGlobal
                ? 'Dominio Global: Personal + Eclesial + Nivel IPO'
                : 'Dominio Pastoral: Tu Agenda Personal y Eclesial de tu Comunidad'}
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">Agenda Ministerial Unificada</h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Selecciona cualquier día en el calendario para programar actividades personales, servicios de tu iglesia o eventos IPO.
          </p>
        </div>

        {/* Filtros por tipo de Agenda */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mr-1">
            <Filter size={13} /> Ver:
          </span>
          <button
            onClick={() => setFiltroAlcance('Todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filtroAlcance === 'Todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({eventos.length})
          </button>
          <button
            onClick={() => setFiltroAlcance('Personal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filtroAlcance === 'Personal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Personal
          </button>
          <button
            onClick={() => setFiltroAlcance('Local')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filtroAlcance === 'Local'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Eclesial (Iglesia)
          </button>
          <button
            onClick={() => setFiltroAlcance('IPO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filtroAlcance === 'IPO'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Nivel IPO
          </button>
        </div>
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex-1 min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={eventosFiltrados}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh', minHeight: '600px' }}
          culture="es"
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(ev) => setEventoDetalle(ev)}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Lista",
            noEventsInRange: "No hay actividades programadas en este rango."
          }}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {/* --- MODAL EMERGENTE PARA PROGRAMAR NUEVA ACTIVIDAD --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-900 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-400" />
                Programar en Agenda
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEvento} className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-900 text-xs p-3 rounded-xl border border-blue-200 flex gap-2 items-start">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p>
                  Fecha seleccionada:{' '}
                  <strong className="capitalize">
                    {fechaSeleccionada?.toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="Ej. Visita pastoral, Culto de Doctrina, Asamblea..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Tipo de Agenda (Dominio)</label>
                <select
                  value={nuevoAlcance}
                  onChange={(e) => setNuevoAlcance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white font-semibold text-slate-800"
                >
                  <option value="Personal">🟢 Agenda Personal (Privada del Pastor)</option>
                  <option value="Local">🔵 Agenda Eclesial (Comunidad / Iglesia Local)</option>
                  {perfil?.esDominioGlobal && (
                    <>
                      <option value="Zonal">🔴 Nivel IPO Zonal (Sur-Occidente)</option>
                      <option value="Nacional_IPO">🔴 Nivel IPO Nacional (Misión Panamericana)</option>
                    </>
                  )}
                </select>
                {!perfil?.esDominioGlobal && (
                  <p className="text-[11px] text-slate-400">
                    Como Pastor Local tienes dominio completo sobre tu Agenda Personal y la Agenda Eclesial de tu comunidad.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Notas o Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Detalles del lugar, predicador o requerimientos..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {nuevoAlcance !== 'Personal' && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={esObligatorio}
                    onChange={(e) => setEsObligatorio(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Marcar como asistencia o servicio prioritario</span>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE DE EVENTO --- */}
      {eventoDetalle && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {obtenerEtiquetaAlcance(eventoDetalle.tipo_alcance)}
              </span>
              <button onClick={() => setEventoDetalle(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h4 className="text-xl font-black text-slate-900">{eventoDetalle.title}</h4>
              {eventoDetalle.descripcion && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {eventoDetalle.descripcion}
                </p>
              )}
              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  <strong>Inicio:</strong>{' '}
                  {eventoDetalle.start?.toLocaleString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p>
                  <strong>Finalización:</strong>{' '}
                  {eventoDetalle.end?.toLocaleString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => eliminarEvento(eventoDetalle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Eliminar Actividad
                </button>
                <button
                  type="button"
                  onClick={() => setEventoDetalle(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
