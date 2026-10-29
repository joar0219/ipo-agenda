import { useState } from 'react';
import { User, Settings, LogOut, Menu, Bell, FileText, AlertCircle, Users, ChevronDown, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ usuarioActual, setSidebarAbierto }) {
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const {
    logout,
    perfil,
    perfilSimuladoId,
    cambiarPerfilSimulado,
    perfilesDisponibles,
    modoPresentacion,
    alternarModoPresentacion,
    alternarVistaPastorDesarrollador
  } = useAuth();

  const notificaciones = [
    {
      id: 1,
      tipo: 'urgente',
      titulo: 'Agenda y Deberes Institucionales (Sur-Occidente)',
      texto: 'Recuerda verificar los compromisos eclesiales y soportes mensuales de tu sede.',
      icono: FileText,
      colorIcono: 'text-rose-600',
      bgIcono: 'bg-rose-100',
      leido: false
    },
    {
      id: 2,
      tipo: 'advertencia',
      titulo: 'Descanso Pastoral (Lunes)',
      texto: 'El sistema protege el día lunes para descanso ministerial y familiar.',
      icono: AlertCircle,
      colorIcono: 'text-amber-600',
      bgIcono: 'bg-amber-100',
      leido: false
    },
    {
      id: 3,
      tipo: 'info',
      titulo: 'Coordinación Directiva IPO',
      texto: 'Presbítero Gabriel González, Nancy García y Presidencia Nacional conectados en agenda.',
      icono: User,
      colorIcono: 'text-blue-600',
      bgIcono: 'bg-blue-100',
      leido: true
    }
  ];

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  const irAPerfil = () => {
    setMenuPerfilAbierto(false);
    alert(
      `Expediente Institucional - Misión Panamericana de Colombia\n\n` +
      `Nombre: ${usuarioActual.nombre}\n` +
      `Rol: ${usuarioActual.rol}\n` +
      `Dominio: ${perfil?.esDominioGlobal ? 'Dominio Global (Directivo / Administración)' : 'Dominio Local (Pastoral y Comunidad)'}\n` +
      `Sede: ${usuarioActual.direccion}\n` +
      `Ubicación: ${usuarioActual.lugar}`
    );
  };

  const irAConfiguracion = () => {
    setMenuPerfilAbierto(false);
    alert(
      "Preferencias del Sistema:\n" +
      "• Organización: Misión Panamericana de Colombia (IPO)\n" +
      "• Zona Territorial: Sur-Occidente\n" +
      "• Alcances de Agenda: Personal, Eclesial (Comunidad) e Institucional IPO"
    );
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
      {/* Grupo izquierdo: Botón móvil + Título + Conmutador SuperAdmin / Sustentación */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarAbierto(true)}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800 hidden sm:block">Agenda y Directorio IPO</h2>
          <span className="text-[11px] text-slate-400 hidden sm:block font-medium">
            {perfil?.esDominioGlobal ? 'Dominio Global Institucional' : 'Dominio Pastoral Local'}
          </span>
          <h2 className="text-xl font-bold text-blue-600 sm:hidden">IPO</h2>
        </div>

        {/* BOTÓN EXCLUSIVO PARA EL DESARROLLADOR Y PASTOR (Alternar entre Dominio Global y Vista de Pastor Local) */}
        {perfil?.esSuperAdmin && (
          <button
            type="button"
            onClick={alternarVistaPastorDesarrollador}
            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ml-2 ${
              perfil?.modoVistaLocal
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
            }`}
            title="Como Desarrollador y Pastor puedes alternar entre tu Dominio Global de Administrador y la vista de Pastor Local"
          >
            {perfil?.modoVistaLocal ? (
              <>
                <Eye size={14} className="text-emerald-600" />
                <span>Vista actual: Pastor Local (Cambiar a Dominio Global)</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Dominio Global Activo (Probar vista Pastor Local)</span>
              </>
            )}
          </button>
        )}

        {/* SELECTOR RÁPIDO DE ROLES (VISIBLE SOLO EN MODO SUSTENTACIÓN DIRECTIVA) */}
        {modoPresentacion && perfilesDisponibles && perfilesDisponibles.length > 0 && (
          <div className="hidden xl:flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs ml-2">
            <Users size={14} className="text-amber-700 shrink-0" />
            <span className="text-amber-800 font-semibold">Vista Directiva:</span>
            <select
              value={perfilSimuladoId}
              onChange={(e) => cambiarPerfilSimulado(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs"
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
                <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded border ${
                  perfil?.esDominioGlobal
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
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

          {menuPerfilAbierto && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {perfil?.esDominioGlobal ? 'Dominio Global IPO' : 'Dominio Pastoral Local'}
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">{usuarioActual.nombre}</p>
                <p className="text-xs text-blue-600 font-medium">{usuarioActual.rol}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{usuarioActual.direccion}</p>
              </div>

              <div className="p-2">
                {perfil?.esSuperAdmin && (
                  <div
                    className="flex items-center justify-between p-2 hover:bg-emerald-50 rounded-lg cursor-pointer text-xs text-slate-700 transition-colors"
                    onClick={() => {
                      alternarVistaPastorDesarrollador();
                      setMenuPerfilAbierto(false);
                    }}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <ShieldCheck size={15} className="text-emerald-600" />
                      <span>Alternar Dominio Global/Local</span>
                    </span>
                  </div>
                )}

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
                <div
                  className="flex items-center justify-between p-2 hover:bg-amber-50 rounded-lg cursor-pointer text-xs text-slate-600 transition-colors"
                  onClick={() => {
                    alternarModoPresentacion(!modoPresentacion);
                    setMenuPerfilAbierto(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Users size={15} className="text-amber-600" />
                    <span>Modo Sustentación</span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${modoPresentacion ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                    {modoPresentacion ? 'ACTIVO' : 'OFF'}
                  </span>
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
