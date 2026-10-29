import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const { perfil, user } = useAuth();

  // Datos dinámicos contextualizados a la Misión Panamericana de Colombia
  const usuarioActual = {
    nombre: perfil?.nombre_completo || "Nancy García",
    rol: perfil?.rol || "Administradora Zonal",
    cargoDetalle: perfil?.cargo_detalle || "Encargada de Administración y Finanzas",
    lugar: perfil?.ciudad ? `${perfil.ciudad}, ${perfil.departamento}` : "Pereira, Risaralda",
    direccion: perfil?.sede_nombre || "Presbiterio Central Pereira",
    zona: perfil?.zona || "Zona Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)",
    telefono: perfil?.telefono || user?.phone || "+57 310 427 8831",
    esAdministradora: perfil?.esAdministradora ?? true
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Menú Lateral con la Zona Territorial y Misión Panamericana */}
      <Sidebar 
        usuarioActual={usuarioActual} 
        sidebarAbierto={sidebarAbierto} 
        setSidebarAbierto={setSidebarAbierto} 
      />

      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* 2. Cabecera con selector de perfiles para pruebas */}
        <Header 
          usuarioActual={usuarioActual} 
          setSidebarAbierto={setSidebarAbierto} 
        />

        {/* 3. Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
