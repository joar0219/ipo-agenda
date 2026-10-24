import { useState } from 'react';
import { UserCircle, User, Settings, LogOut, Menu, Bell, FileText, AlertCircle, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ usuarioActual, setSidebarAbierto }) {
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const { logout, perfilSimuladoId, cambiarPerfilSimulado, perfilesDisponibles } = useAuth();

  const notificaciones = [
    {
      id: 1,
      tipo: 'urgente',
      titulo: 'Informe Financiero Zonal (Sur-Occidente)',
      texto: 'Vence en 2 días. 10 de 12 sedes ya han radicado soporte.',
      icono: FileText,
      colorIcono: 'text-rose-600',
      bgIcono: 'bg-rose-100',
      leido: false
    },
    {
      id: 2,
      tipo: 'advertencia',
      titulo: 'Descanso Pastoral (Lunes)',
      texto: 'El sistema bloquea automáticamente eventos oficiales los lunes.',
      icono: AlertCircle,
      colorIcono: 'text-amber-600',
      bgIcono: 'bg-amber-100',
      leido: false
    },
    {
      id: 3,
      tipo: 'info',
      titulo: 'Junta Directiva Nacional',
      texto: 'Presbítero Gabriel González y Presidente Armando Arboleda han coordinado agenda.',
      icono: User,
      colorIcono: 'text-blue-600',
      bgIcono: 'bg-blue-100',
      leido: true
    }
  ];

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  const irAPerfil = () => {
    setMenuPerfilAbierto(false);
    alert(`Expediente Institucional - Misión Panamericana de Colombia\n\nNombre: ${usuarioActual.nombre}\nRol: ${usuarioActual.rol}\nJurisdicción: ${usuarioActual.zona}\nSede: ${usuarioActual.direccion}\nUbicación: ${usuarioActual.lugar}`);
  };

  const irAConfiguracion = () => {
    setMenuPerfilAbierto(false);
    alert("Preferencias del Sistema:\n• Organización: Misión Panamericana de Colombia\n• Zona Territorial: Sur-Occidente\n• Sede Principal Zonal: Pereira, Risaralda");
  };

  const cerrarSesion = async () => {
    setMenuPerfilAbierto(false);
    const confirmar = window.confirm("¿Deseas cerrar tu sesión institucional?");
    if (confirmar) {
      await logout();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-20 shrink-0">
      
      {/* Grupo izquierdo: Botón móvil + Título + Selector de Pruebas Zonal */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSidebarAbierto(true)}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800 hidden sm:block">Panel de Gobernanza</h2>
          <span className="text-[11px] text-slate-400 hidden sm:block font-medium">Zona Sur-Occidente</span>
          <h2 className="text-xl font-bold text-blue-600 sm:hidden">IPO</h2>
        </div>

        {/* SELECTOR RÁPIDO DE ROLES PARA TIEMPO DE PRUEBA Y DEMOSTRACIÓN */}
        {perfilesDisponibles && perfilesDisponibles.length > 0 && (
          <div className="hidden xl:flex items-center gap-2 bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl text-xs ml-4">
            <Users size={14} className="text-blue-600 shrink-0" />
            <span className="text-slate-500 font-semibold">Simular Rol:</span>
            <select
              value={perfilSimuladoId}
              onChange={(e) => cambiarPerfilSimulado(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              {perfilesDisponibles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_completo} — {p.rol}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Grupo derecho: Notificaciones y Perfil */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="relative">
          <button 
            onClick={() => {
              setNotificacionesAbiertas(!notificacionesAbiertas);
              setMenuPerfilAbierto(false);
            }}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Bell size={22} />
            {noLeidas > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {noLeidas}
              </span>
            )}
          </button>

          {/* Menú desplegable de Notificaciones */}
          {notificacionesAbiertas && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Notificaciones Institucionales</h3>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Zona Sur-Occidente</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto">
                {notificaciones.map((notif) => (
                  <div key={notif.id} className={`flex items-start gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.leido ? 'bg-blue-50/30' : ''}`}>
                    <div className={`p-2 rounded-full shrink-0 mt-0.5 ${notif.bgIcono} ${notif.colorIcono}`}>
                      <notif.icono size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!notif.leido ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        {notif.titulo}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.texto}
                      </p>
                    </div>
                    {!notif.leido && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LÍNEA DIVISORIA */}
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        {/* PERFIL DE USUARIO */}
        <div className="relative">
          <div 
            onClick={() => {
              setMenuPerfilAbierto(!menuPerfilAbierto);
              setNotificacionesAbiertas(false);
            }}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 sm:p-2 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">{usuarioActual.nombre}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                  {usuarioActual.rol}
                </span>
                <span className="text-xs text-slate-400">· {usuarioActual.lugar}</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center shadow-sm text-sm">
              {usuarioActual.nombre.charAt(0)}
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </div>

          {/* Menú desplegable del Perfil */}
          {menuPerfilAbierto && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identidad Activa</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{usuarioActual.nombre}</p>
                <p className="text-xs text-blue-600 font-medium">{usuarioActual.rol}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{usuarioActual.direccion}</p>
              </div>

              <div className="p-2">
                <div 
                  className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm text-slate-700 transition-colors"
                  onClick={irAPerfil}
                >
                  <User size={16} />
                  <span>Expediente Institucional</span>
                </div>
                <div 
                  className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm text-slate-700 transition-colors"
                  onClick={irAConfiguracion}
                >
                  <Settings size={16} />
                  <span>Jurisdicción y Sedes</span>
                </div>
                <div className="border-t border-slate-100 my-1"></div>
                <div 
                  onClick={cerrarSesion}
                  className="flex items-center gap-2 p-2 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
}
