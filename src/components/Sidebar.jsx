import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, Users, MapPin, Church, X, Compass, ShieldCheck } from 'lucide-react';

export default function Sidebar({ usuarioActual, sidebarAbierto, setSidebarAbierto }) {
  const clasesMenu = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
      isActive 
        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20 font-medium' 
        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
    }`;

  const cerrarMenuMovil = () => {
    if (window.innerWidth < 768) {
      setSidebarAbierto(false);
    }
  };

  return (
    <>
      {/* Fondo oscuro para móviles (Overlay) */}
      {sidebarAbierto && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Encabezado Institucional */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md">
                IPO
              </div>
              <span className="text-xl font-bold tracking-tight text-white">IPO Gestión</span>
            </div>
            <p className="text-[11px] text-blue-300/80 font-medium mt-1">
              Misión Panamericana de Colombia
            </p>
          </div>
          <button 
            onClick={() => setSidebarAbierto(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 p-4 space-y-2 mt-1 overflow-y-auto">
          <NavLink to="/" end className={clasesMenu} onClick={cerrarMenuMovil}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/agenda" className={clasesMenu} onClick={cerrarMenuMovil}>
            <CalendarDays size={20} />
            <span>Mi Agenda</span>
          </NavLink>
          
          <NavLink to="/deberes" className={clasesMenu} onClick={cerrarMenuMovil}>
            <CheckSquare size={20} />
            <span>{usuarioActual.esAdministradora ? "Auditoría y Deberes" : "Mis Deberes"}</span>
          </NavLink>

          <div className="pt-4 mt-2 border-t border-slate-800">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gobernanza Zonal</p>
            <NavLink to="/registro" className={clasesMenu} onClick={cerrarMenuMovil}>
              <Users size={20} />
              <span>Directorio Pastoral y Sedes</span>
            </NavLink>
          </div>
        </nav>

        {/* Perfil Activo con Zona Territorial */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              Perfil Conectado
            </span>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-700/50">
              {usuarioActual.rol}
            </span>
          </div>

          <div>
            <p className="text-sm font-bold text-white truncate">{usuarioActual.nombre}</p>
            <p className="text-[11px] text-slate-400 truncate">{usuarioActual.direccion}</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400 text-xs">
            <div className="flex items-start gap-1.5">
              <MapPin size={13} className="text-slate-500 mt-0.5 shrink-0" />
              <span className="text-[11px] leading-tight text-slate-300">{usuarioActual.lugar}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Compass size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <span className="text-[10px] leading-tight text-blue-200/90 font-medium">
                {usuarioActual.zona}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
