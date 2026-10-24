import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../SupabaseClient';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales,
});

export default function MiAgenda() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para el Modal de Nuevo Evento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoAlcance, setNuevoAlcance] = useState('Local');

  // --- LECTURA REAL DESDE SUPABASE ---
  useEffect(() => {
    const cargarAgenda = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('agenda')
          .select('*');

        if (error) throw error;

        if (data) {
          const eventosBaseDeDatos = data.map((evento) => ({
            id: evento.id,
            title: evento.titulo,
            start: new Date(evento.fecha_inicio),
            end: new Date(evento.fecha_fin),
            tipo_alcance: evento.tipo_alcance,
            es_obligatorio: evento.es_obligatorio
          }));
          setEventos(eventosBaseDeDatos);
        }
      } catch (error) {
        console.error("Error al descargar la agenda:", error.message);
        alert("No se pudo conectar con la base de datos.");
      } finally {
        setCargando(false);
      }
    };

    cargarAgenda();
  }, []);

  // --- LÓGICA LOGÍSTICA: RESTRICCIÓN DE DÍAS ---
  const handleSelectSlot = (slotInfo) => {
    const fecha = slotInfo.start;
    const diaDeLaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Si es Lunes (1), bloqueamos la acción con una alerta gerencial
    if (diaDeLaSemana === 1) {
      alert(" DÍA INHABILITADO\n\nPor políticas institucionales, los días Lunes están reservados para el descanso pastoral y no se pueden agendar servicios eclesiales.\n\nPor favor, seleccione un día entre Martes y Domingo.");
      return;
    }

    setFechaSeleccionada(fecha);
    setModalAbierto(true);
  };

  // --- ESCRITURA REAL EN SUPABASE ---
  const guardarEvento = async (e) => {
    e.preventDefault();
    
    // Calculamos las fechas
    const fechaInicio = fechaSeleccionada;
    const fechaFin = new Date(fechaSeleccionada.getTime() + 2 * 60 * 60 * 1000); // 2 horas por defecto

    try {
      // 1. Insertamos en Supabase
      const { data, error } = await supabase
        .from('agenda')
        .insert([
          {
            titulo: nuevoTitulo,
            fecha_inicio: fechaInicio.toISOString(),
            fecha_fin: fechaFin.toISOString(),
            tipo_alcance: nuevoAlcance,
            es_obligatorio: true // Por defecto marcamos true, luego puedes añadir un checkbox si lo deseas
          }
        ])
        .select(); // .select() es vital para que Supabase nos devuelva el ID real que acaba de crear

      if (error) throw error;

      // 2. Si se guardó en la nube, actualizamos la pantalla
      if (data && data.length > 0) {
        const eventoGuardado = data[0];
        const nuevoEventoReact = {
          id: eventoGuardado.id,
          title: eventoGuardado.titulo,
          start: new Date(eventoGuardado.fecha_inicio),
          end: new Date(eventoGuardado.fecha_fin),
          tipo_alcance: eventoGuardado.tipo_alcance,
          es_obligatorio: eventoGuardado.es_obligatorio
        };
        setEventos([...eventos, nuevoEventoReact]);
      }

      // 3. Cerramos modal y limpiamos
      setModalAbierto(false);
      setNuevoTitulo('');
      setNuevoAlcance('Local');

    } catch (error) {
      console.error("Error al insertar en base de datos:", error.message);
      alert("Hubo un problema al registrar la actividad. Intenta de nuevo.");
    }
  };

  const eventStyleGetter = (evento) => {
    let backgroundColor = '#3182ce'; // Azul (Local)
    if (evento.tipo_alcance === 'Zonal' || evento.tipo_alcance === 'Nacional_IPO') backgroundColor = '#e53e3e'; // Rojo
    return {
      style: { backgroundColor, borderRadius: '6px', opacity: 0.9, color: 'white', border: 'none', display: 'block', fontSize: '0.85rem', fontWeight: '500', padding: '2px 6px' }
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col relative">
      
      {/* Cabecera de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Mi Agenda Institucional</h3>
          <p className="text-slate-500">Haz clic en cualquier día (Martes a Domingo) para programar una actividad.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 text-sm font-medium flex items-center gap-2">
          {cargando ? (
             <span className="animate-pulse">Sincronizando...</span>
          ) : (
            <>
              <CalendarIcon size={16} />
              {eventos.length} Actividades
            </>
          )}
        </div>
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh', minHeight: '600px' }}
          culture="es"
          selectable={true} 
          onSelectSlot={handleSelectSlot}
          messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día", noEventsInRange: "No hay actividades." }}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {/* --- MODAL EMERGENTE PARA NUEVO EVENTO --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" />
                Programar Actividad
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEvento} className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex gap-2 items-start">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>Agendando para el <strong>{fechaSeleccionada?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase">Título de la Actividad</label>
                <input 
                  type="text" required autoFocus
                  value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="Ej. Culto de Alabanza"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase">Nivel de Alcance</label>
                <select 
                  value={nuevoAlcance} onChange={(e) => setNuevoAlcance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="Local">Local (Congregación)</option>
                  <option value="Zonal">Zonal (Múltiples Sedes)</option>
                  <option value="Nacional_IPO">Nacional (Directiva)</option>
                </select>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  Confirmar en Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}