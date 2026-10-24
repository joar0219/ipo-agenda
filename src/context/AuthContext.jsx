import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';

const AuthContext = createContext(null);

// Perfiles institucionales oficiales para la Misión Panamericana de Colombia
export const PERFILES_INSTITUCIONALES = [
  {
    id: 'perfil-nancy-garcia',
    nombre_completo: 'Nancy García',
    rol: 'Administración y Contabilidad',
    cargo_detalle: 'Encargada de Administración Zonal y Finanzas',
    sede_nombre: 'Presbiterio Central Pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)',
    telefono: '+57 312 456 7890',
    modulo: 'Contable y Financiero',
    esAdministradora: true,
    activo: true
  },
  {
    id: 'perfil-elizabeth-nieto',
    nombre_completo: 'Dra. Elizabeth Nieto',
    rol: 'Asesoría Jurídica',
    cargo_detalle: 'Dirección de Asuntos Legales y Estatutarios',
    sede_nombre: 'Oficina Central Jurídica Pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente y Nacional',
    telefono: '+57 310 999 8888',
    modulo: 'Jurídico y Notarial',
    esAdministradora: true,
    activo: true
  },
  {
    id: 'perfil-gabriel-gonzalez',
    nombre_completo: 'Gabriel González',
    rol: 'Presbítero Principal',
    cargo_detalle: 'Presbiterio Zonal y Miembro de Junta Directiva',
    sede_nombre: 'Presbiterio Central Pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente y Junta Directiva',
    telefono: '+57 318 987 6543',
    modulo: 'Eclesiástico y Pastoral',
    esAdministradora: true,
    activo: true
  },
  {
    id: 'perfil-armando-arboleda',
    nombre_completo: 'Armando Arboleda',
    rol: 'Presidente Nacional',
    cargo_detalle: 'Presidente General de la Misión Panamericana de Colombia',
    sede_nombre: 'Sede Nacional Misión Panamericana',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    zona: 'Nacional (Todas las Zonas Territoriales)',
    telefono: '+57 300 111 2233',
    modulo: 'Gobierno General',
    esAdministradora: true,
    activo: true
  },
  {
    id: 'perfil-jose-arcila',
    nombre_completo: 'José Orlando Arcila',
    rol: 'Pastor Local',
    cargo_detalle: 'Pastor Titular Congregación Roldanillo',
    sede_nombre: 'Sede Central Roldanillo',
    ciudad: 'Roldanillo',
    departamento: 'Valle del Cauca',
    zona: 'Zona Sur-Occidente (Distrito Valle)',
    telefono: '+57 315 123 4567',
    modulo: 'Pastoral Local',
    esAdministradora: false,
    activo: true
  }
];

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(PERFILES_INSTITUCIONALES[0]);
  const [cargando, setCargando] = useState(true);
  const [perfilSimuladoId, setPerfilSimuladoId] = useState('perfil-nancy-garcia');
  
  const [sesionDemoActiva, setSesionDemoActiva] = useState(() => {
    return localStorage.getItem('ipo_sesion_demo') === 'true';
  });

  const cargarPerfil = async (userId, userMetadata = {}) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*, sedes(nombre, ciudad, departamento, tipo)')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const esAdmin = ['Administracion', 'Administración y Contabilidad', 'Administradora Zonal', 'Presbitero', 'Directiva_Nacional', 'Presidente', 'Asesoría Jurídica', 'Abogado'].includes(data.rol);
        setPerfil({
          id: data.id,
          nombre_completo: data.nombre_completo,
          rol: data.rol,
          telefono: data.telefono,
          sede_id: data.sede_id,
          sede_nombre: data.sedes?.nombre || 'Presbiterio Zonal',
          ciudad: data.sedes?.ciudad || 'Pereira',
          departamento: data.sedes?.departamento || 'Risaralda',
          zona: 'Zona Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)',
          esAdministradora: esAdmin,
          activo: data.activo ?? true,
        });
      }
    } catch (err) {
      console.error('Error al obtener perfil de Supabase:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sesionActual } }) => {
      setSession(sesionActual);
      setUser(sesionActual?.user ?? null);
      if (sesionActual?.user) {
        cargarPerfil(sesionActual.user.id, sesionActual.user.user_metadata);
      }
      setCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nuevaSesion) => {
      setSession(nuevaSesion);
      setUser(nuevaSesion?.user ?? null);
      if (nuevaSesion?.user) {
        await cargarPerfil(nuevaSesion.user.id, nuevaSesion.user.user_metadata);
      }
      setCargando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cambiarPerfilSimulado = (nuevoId) => {
    const encontrado = PERFILES_INSTITUCIONALES.find(p => p.id === nuevoId);
    if (encontrado) {
      setPerfilSimuladoId(nuevoId);
      setPerfil(encontrado);
    }
  };

  const iniciarSesionDemo = (perfilId = 'perfil-nancy-garcia') => {
    localStorage.setItem('ipo_sesion_demo', 'true');
    setSesionDemoActiva(true);
    cambiarPerfilSimulado(perfilId);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('ipo_sesion_demo');
      setSesionDemoActiva(false);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setPerfil(PERFILES_INSTITUCIONALES[0]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const valor = {
    session: session || (sesionDemoActiva ? { user: { id: 'demo-user' } } : null),
    user: user || (sesionDemoActiva ? { id: 'demo-user', phone: perfil.telefono } : null),
    perfil,
    cargando,
    logout,
    iniciarSesionDemo,
    sesionDemoActiva,
    perfilSimuladoId,
    cambiarPerfilSimulado,
    perfilesDisponibles: PERFILES_INSTITUCIONALES,
    recargarPerfil: () => user && cargarPerfil(user.id, user.user_metadata),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
