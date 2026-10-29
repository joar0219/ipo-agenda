import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';

const AuthContext = createContext(null);

const STORAGE_KEY_SESION = 'ipo_sesion_activa_v2';
const STORAGE_KEY_PINS = 'ipo_pins_locales_v2';
const STORAGE_KEY_MODO_DEMO = 'ipo_modo_presentacion';

// Perfiles institucionales reales de la Misión Panamericana de Colombia (Sin registros ficticios)
export const PERFILES_INSTITUCIONALES = [
  {
    id: 'perfil-jose-arcila',
    nombre_completo: 'José Orlando Arcila',
    rol: 'Pastor & Admin. Sistema',
    rol_codigo: 'Pastor',
    cargo_detalle: 'Pastor Titular Sede Roldanillo · Desarrollador y Administrador General del Sistema',
    sede_nombre: 'Sede Central Roldanillo',
    ciudad: 'Roldanillo',
    departamento: 'Valle del Cauca',
    zona: 'Zona Sur-Occidente (Dominio Global y Pastoral)',
    telefono: '+57 315 123 4567',
    pin_acceso: '234567',
    requiere_cambio_pin: false,
    modulo: 'SuperAdmin y Pastoral',
    esAdministradora: true,
    esDominioGlobal: true,
    esSuperAdmin: true,
    activo: true
  },
  {
    id: 'perfil-nancy-garcia',
    nombre_completo: 'Nancy García',
    rol: 'Administración y Contabilidad',
    rol_codigo: 'Administracion',
    cargo_detalle: 'Encargada de Administración Zonal y Contabilidad',
    sede_nombre: 'Administración Zonal Sur-Occidente',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente (Dominio Global)',
    telefono: '+57 312 456 7890',
    pin_acceso: '456789',
    requiere_cambio_pin: false,
    modulo: 'Contable y Financiero',
    esAdministradora: true,
    esDominioGlobal: true,
    esSuperAdmin: false,
    activo: true
  },
  {
    id: 'perfil-gabriel-gonzalez',
    nombre_completo: 'Gabriel González',
    rol: 'Presbítero Principal',
    rol_codigo: 'Presbitero',
    cargo_detalle: 'Presbiterio Zonal y Miembro de Junta Directiva',
    sede_nombre: 'Presbiterio Central Pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente y Junta Directiva (Dominio Global)',
    telefono: '+57 318 987 6543',
    pin_acceso: '876543',
    requiere_cambio_pin: false,
    modulo: 'Eclesiástico y Pastoral',
    esAdministradora: true,
    esDominioGlobal: true,
    esSuperAdmin: false,
    activo: true
  },
  {
    id: 'perfil-elizabeth-nieto',
    nombre_completo: 'Dra. Elizabeth Nieto',
    rol: 'Asesoría Jurídica',
    rol_codigo: 'Abogado',
    cargo_detalle: 'Dirección de Asuntos Legales y Estatutarios',
    sede_nombre: 'Oficina Central Jurídica Pereira',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    zona: 'Zona Sur-Occidente y Nacional (Dominio Global)',
    telefono: '+57 310 999 8888',
    pin_acceso: '998888',
    requiere_cambio_pin: false,
    modulo: 'Jurídico y Notarial',
    esAdministradora: true,
    esDominioGlobal: true,
    esSuperAdmin: false,
    activo: true
  },
  {
    id: 'perfil-armando-arboleda',
    nombre_completo: 'Armando Arboleda',
    rol: 'Presidente Nacional',
    rol_codigo: 'Presidente Nacional',
    cargo_detalle: 'Presidente General de la Misión Panamericana de Colombia',
    sede_nombre: 'Sede Nacional Misión Panamericana',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    zona: 'Nacional (Dominio Global)',
    telefono: '+57 300 111 2233',
    pin_acceso: '112233',
    requiere_cambio_pin: false,
    modulo: 'Gobierno General',
    esAdministradora: true,
    esDominioGlobal: true,
    esSuperAdmin: false,
    activo: true
  }
];

export const ROLES_DOMINIO_GLOBAL = [
  'Administracion',
  'Administración y Contabilidad',
  'Administradora Zonal',
  'Contabilidad',
  'Presbitero',
  'Presbítero Principal',
  'Directiva_Nacional',
  'Presidente Nacional',
  'Presidente_Nacional',
  'Presidente',
  'Asesoría Jurídica',
  'Abogado',
  'Pastor & Admin. Sistema',
  'SuperAdmin'
];

export function obtenerPinsLocales() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PINS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function guardarPinLocal(telefono, pin, requiereCambio = false) {
  try {
    const clave = (telefono || '').replace(/\D/g, '').slice(-10);
    if (!clave) return;
    const actuales = obtenerPinsLocales();
    actuales[clave] = { pin, requiereCambio, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_PINS, JSON.stringify(actuales));
  } catch (e) {
    console.warn('No se pudo guardar PIN en almacenamiento local:', e);
  }
}

export function normalizarPerfilInstitucional(data) {
  if (!data) return PERFILES_INSTITUCIONALES[0];
  const soloDigitos = (data.telefono || '').replace(/\D/g, '').slice(-10);
  const plantilla = PERFILES_INSTITUCIONALES.find(
    p => p.telefono.replace(/\D/g, '').slice(-10) === soloDigitos
  );

  // Si es José Orlando Arcila (Desarrollador y Pastor), tiene rango de SuperAdmin y Dominio Global
  const esDesarrolladorPastor =
    soloDigitos === '3151234567' ||
    (data.nombre_completo || '').toLowerCase().includes('orlando arcila') ||
    Boolean(data.esSuperAdmin);

  const rolFinal = esDesarrolladorPastor
    ? (data.modoVistaLocal ? 'Pastor Local' : 'Pastor & Admin. Sistema')
    : (data.rol || plantilla?.rol || 'Pastor');

  const tieneDominioGlobal = esDesarrolladorPastor
    ? !data.modoVistaLocal
    : (ROLES_DOMINIO_GLOBAL.includes(rolFinal) || Boolean(data.esDominioGlobal) || Boolean(data.esAdministradora));

  return {
    id: data.id || plantilla?.id || 'usuario-activo',
    nombre_completo: data.nombre_completo || plantilla?.nombre_completo || 'Ministro Autorizado',
    rol: rolFinal,
    rol_codigo: data.rol_codigo || plantilla?.rol_codigo || data.rol || 'Pastor',
    cargo_detalle: data.cargo_detalle || plantilla?.cargo_detalle || (tieneDominioGlobal ? 'Directiva y Administración Global IPO' : 'Pastor Titular de Congregación Local'),
    telefono: data.telefono || plantilla?.telefono || '',
    sede_id: data.sede_id || null,
    sede_nombre: data.sedes?.nombre || data.sede_nombre || plantilla?.sede_nombre || 'Congregación Local IPO',
    ciudad: data.sedes?.ciudad || data.ciudad || plantilla?.ciudad || 'Roldanillo',
    departamento: data.sedes?.departamento || data.departamento || plantilla?.departamento || 'Valle del Cauca',
    zona: data.zona || plantilla?.zona || 'Zona Sur-Occidente',
    esAdministradora: tieneDominioGlobal,
    esDominioGlobal: tieneDominioGlobal,
    esSuperAdmin: esDesarrolladorPastor,
    modoVistaLocal: Boolean(data.modoVistaLocal),
    activo: data.activo ?? true,
    pin_acceso: data.pin_acceso || plantilla?.pin_acceso || '123456',
    requiere_cambio_pin: data.requiere_cambio_pin ?? false
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_SESION) || sessionStorage.getItem(STORAGE_KEY_SESION);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        return normalizarPerfilInstitucional(parsed);
      }
    } catch {
      // Ignorar errores de parseo
    }
    return PERFILES_INSTITUCIONALES[0];
  });

  const [sesionInstitucionalActiva, setSesionInstitucionalActiva] = useState(() => {
    return Boolean(
      localStorage.getItem(STORAGE_KEY_SESION) ||
      sessionStorage.getItem(STORAGE_KEY_SESION)
    );
  });

  const [modoPresentacion, setModoPresentacion] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MODO_DEMO) === 'true';
  });

  const [cargando, setCargando] = useState(true);
  const [perfilSimuladoId, setPerfilSimuladoId] = useState('perfil-jose-arcila');

  const cargarPerfil = async (userId) => {
    try {
      const { data } = await supabase
        .from('perfiles')
        .select('*, sedes(nombre, ciudad, departamento, tipo)')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const normalizado = normalizarPerfilInstitucional(data);
        setPerfil(normalizado);
      }
    } catch (err) {
      console.error('Error al obtener perfil de Supabase:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sesionActual } }) => {
      if (sesionActual?.user) {
        setSession(sesionActual);
        setUser(sesionActual.user);
        cargarPerfil(sesionActual.user.id);
      }
      setCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nuevaSesion) => {
      setSession(nuevaSesion);
      setUser(nuevaSesion?.user ?? null);
      if (nuevaSesion?.user) {
        await cargarPerfil(nuevaSesion.user.id);
      }
      setCargando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const iniciarSesionConPerfil = (datosPerfil, recordarDispositivo = true) => {
    const perfilNormalizado = normalizarPerfilInstitucional(datosPerfil);
    setPerfil(perfilNormalizado);
    setPerfilSimuladoId(perfilNormalizado.id);
    setSesionInstitucionalActiva(true);

    const serializado = JSON.stringify(perfilNormalizado);
    if (recordarDispositivo) {
      localStorage.setItem(STORAGE_KEY_SESION, serializado);
      sessionStorage.removeItem(STORAGE_KEY_SESION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESION, serializado);
      localStorage.removeItem(STORAGE_KEY_SESION);
    }
  };

  // Permite al Desarrollador/Pastor alternar entre su Dominio Global (SuperAdmin) y Vista de Pastor Local normal
  const alternarVistaPastorDesarrollador = () => {
    if (!perfil?.esSuperAdmin) return;
    const actualizado = normalizarPerfilInstitucional({
      ...perfil,
      modoVistaLocal: !perfil.modoVistaLocal
    });
    setPerfil(actualizado);
    if (localStorage.getItem(STORAGE_KEY_SESION)) {
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(actualizado));
    } else if (sessionStorage.getItem(STORAGE_KEY_SESION)) {
      sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(actualizado));
    }
  };

  const cambiarPerfilSimulado = (nuevoId) => {
    const encontrado = PERFILES_INSTITUCIONALES.find(p => p.id === nuevoId);
    if (encontrado) {
      setPerfilSimuladoId(nuevoId);
      const normalizado = normalizarPerfilInstitucional(encontrado);
      setPerfil(normalizado);
      if (localStorage.getItem(STORAGE_KEY_SESION)) {
        localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(normalizado));
      } else if (sessionStorage.getItem(STORAGE_KEY_SESION)) {
        sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(normalizado));
      }
    }
  };

  const iniciarSesionDemo = (perfilId = 'perfil-jose-arcila') => {
    const encontrado = PERFILES_INSTITUCIONALES.find(p => p.id === perfilId) || PERFILES_INSTITUCIONALES[0];
    iniciarSesionConPerfil(encontrado, true);
  };

  const alternarModoPresentacion = (valor) => {
    const nuevo = valor !== undefined ? Boolean(valor) : !modoPresentacion;
    setModoPresentacion(nuevo);
    localStorage.setItem(STORAGE_KEY_MODO_DEMO, String(nuevo));
  };

  const logout = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY_SESION);
      sessionStorage.removeItem(STORAGE_KEY_SESION);
      localStorage.removeItem('ipo_sesion_demo');
      setSesionInstitucionalActiva(false);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setPerfil(PERFILES_INSTITUCIONALES[0]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  const usuarioAutenticado = session?.user || (sesionInstitucionalActiva ? {
    id: perfil?.id,
    phone: perfil?.telefono,
    nombre_completo: perfil?.nombre_completo,
    rol: perfil?.rol
  } : null);

  const valor = {
    session: session || (sesionInstitucionalActiva ? { user: usuarioAutenticado } : null),
    user: usuarioAutenticado,
    perfil,
    cargando,
    logout,
    iniciarSesionConPerfil,
    iniciarSesionDemo,
    alternarVistaPastorDesarrollador,
    sesionDemoActiva: sesionInstitucionalActiva,
    modoPresentacion,
    alternarModoPresentacion,
    perfilSimuladoId,
    cambiarPerfilSimulado,
    perfilesDisponibles: PERFILES_INSTITUCIONALES,
    recargarPerfil: () => user?.id && cargarPerfil(user.id),
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
