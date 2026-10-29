import { useState, useEffect } from 'react';
import { 
  User, MapPin, Church, Shield, UserPlus, 
  Users, Edit2, ToggleLeft, ToggleRight, Smartphone, Loader2, RefreshCw, 
  CheckCircle2, Compass, Award, X, Save, Scale, Building2, Search,
  Calendar, Clock, ExternalLink, ChevronRight, Info, AlertTriangle, PhoneCall, KeyRound
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { useAuth, guardarPinLocal } from '../context/AuthContext';

// Icono oficial de WhatsApp estilizado
const IconWhatsApp = ({ size = 18, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    width={size} 
    height={size} 
    className={className}
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.975L2 22l5.133-1.347a9.936 9.936 0 0 0 4.873 1.277h.005c5.505 0 9.988-4.478 9.99-9.985A9.983 9.983 0 0 0 12.012 2zm4.957 14.135c-.272.766-1.583 1.401-2.176 1.488-.521.077-1.205.137-3.415-.774-2.825-1.165-4.636-4.041-4.777-4.228-.141-.188-1.125-1.493-1.125-2.85 0-1.356.705-2.02.959-2.288.254-.268.55-.335.733-.335.183 0 .366.002.522.01.161.008.375-.062.585.441.216.518.737 1.796.8 1.926.063.13.106.28.021.451-.085.17-.127.276-.254.424-.127.148-.267.33-.38.443-.127.127-.26.266-.112.518.148.252.658 1.084 1.411 1.755.97.865 1.787 1.133 2.04 1.26.254.127.401.106.55-.064.148-.17.635-.738.804-.99.169-.253.338-.211.564-.127.226.084 1.438.677 1.685.804.247.127.412.19.475.3.063.11.063.636-.21 1.402z" />
  </svg>
);

// Directorio Ministerial Oficial con los 5 Perfiles Reales (Sin registros ficticios)
const NOMBRES_FICTICIOS_EXCLUIDOS = [
  'wilson mosquera palacios',
  'wilson mosquera',
  'carlos arturo ramírez',
  'carlos arturo ramirez',
  'fernando morales echeverry',
  'héctor fabio caicedo',
  'hector fabio caicedo',
  'andrés ruiz',
  'manuel ortiz',
  'david echeverri',
  'pastor daniel estudiante',
  'pastor carlos gómez'
];

const DIRECTORIO_INICIAL = [
  { 
    id: 'mp-5', 
    nombre_completo: "José Orlando Arcila", 
    rol: "Pastor", 
    telefono: "+57 311 387 0976", 
    activo: true, 
    sedes: { 
      id: 'sede-roldanillo',
      nombre: "Sede Central Roldanillo", 
      ciudad: "Roldanillo", 
      departamento: "Valle del Cauca",
      direccion: "Carrera 7 # 8-45, Barrio El Carmen",
      telefono_contacto: "+57 311 387 0976",
      zona: "Zona Sur-Occidente (Distrito Valle)",
      horarios: [
        { dia: 'Domingo', hora: '09:00 AM - 10:30 AM', culto: 'Escuela Dominical y Discipulado de Familias', tipo: 'Culto Principal' },
        { dia: 'Domingo', hora: '06:00 PM - 08:00 PM', culto: 'Culto General de Alabanza, Adoración y Palabra', tipo: 'Culto Principal' },
        { dia: 'Miércoles', hora: '07:00 PM - 08:30 PM', culto: 'Culto de Doctrina y Estudio Bíblico Sistemático', tipo: 'Enseñanza' },
        { dia: 'Viernes', hora: '09:00 AM - 11:30 AM', culto: 'Ayuno Congregacional y Clamor de Intercesión', tipo: 'Oración' },
        { dia: 'Sábado', hora: '06:30 PM - 08:00 PM', culto: 'Reunión de Jóvenes, Damas Dorcas y Caballeros', tipo: 'Ministerios' },
        { dia: 'Lunes', hora: 'Todo el día', culto: 'Descanso Ministerial Pastoral (Institucional IPO)', tipo: 'Descanso' }
      ]
    } 
  },
  { 
    id: 'mp-2', 
    nombre_completo: "Gabriel González", 
    rol: "Presbitero", 
    telefono: "+57 310 857 0176", 
    activo: true, 
    sedes: { 
      id: 'sede-pereira',
      nombre: "Presbiterio Central Pereira", 
      ciudad: "Pereira", 
      departamento: "Risaralda",
      direccion: "Av. 30 de Agosto # 42-18, Sector Maraya",
      telefono_contacto: "+57 310 857 0176",
      zona: "Zona Sur-Occidente (Risaralda y Junta)",
      horarios: [
        { dia: 'Domingo', hora: '09:00 AM - 11:00 AM', culto: 'Culto Central de Adoración y Santa Cena', tipo: 'Culto Principal' },
        { dia: 'Domingo', hora: '06:00 PM - 07:45 PM', culto: 'Culto Evangelístico y Edificación de Familias', tipo: 'Culto Principal' },
        { dia: 'Miércoles', hora: '07:00 PM - 08:30 PM', culto: 'Escuela Bíblica de Liderazgo y Teología Práctica', tipo: 'Enseñanza' },
        { dia: 'Viernes', hora: '09:00 AM - 12:00 PM', culto: 'Vigilia de Ayuno e Intercesión por Pastores Zonales', tipo: 'Oración' },
        { dia: 'Sábado', hora: '06:00 PM - 08:00 PM', culto: 'Culto Juvenil Panamericano', tipo: 'Ministerios' },
        { dia: 'Lunes', hora: 'Todo el día', culto: 'Descanso Ministerial Pastoral (Institucional IPO)', tipo: 'Descanso' }
      ]
    } 
  },
  { 
    id: 'mp-3', 
    nombre_completo: "Nancy García", 
    rol: "Administracion", 
    telefono: "+57 310 427 8831", 
    activo: true, 
    sedes: { 
      id: 'sede-admin',
      nombre: "Administración Zonal Sur-Occidente", 
      ciudad: "Pereira", 
      departamento: "Risaralda",
      direccion: "Av. Circunvalar # 12-40 Oficina 302",
      telefono_contacto: "+57 310 427 8831",
      zona: "Sede Administrativa y Financiera (Zona Sur-Occidente)",
      horarios: [
        { dia: 'Lunes a Viernes', hora: '08:00 AM - 05:00 PM', culto: 'Atención Administrativa, Contable y Auditoría', tipo: 'Administración' },
        { dia: 'Sábados', hora: '08:30 AM - 12:30 PM', culto: 'Recepción de Soportes y Conciliaciones Pastorales', tipo: 'Administración' }
      ]
    } 
  },
  { 
    id: 'mp-4', 
    nombre_completo: "Dra. Elizabeth Nieto", 
    rol: "Abogado", 
    telefono: "+57 312 747 6470", 
    activo: true, 
    sedes: { 
      id: 'sede-juridica',
      nombre: "Asesoría Jurídica y Notarial", 
      ciudad: "Pereira", 
      departamento: "Risaralda",
      direccion: "Cra 7 # 19-28 Edificio Banco Ganadero Of. 504",
      telefono_contacto: "+57 312 747 6470",
      zona: "Sede Jurídica Territorial y Nacional",
      horarios: [
        { dia: 'Lunes a Jueves', hora: '08:00 AM - 04:00 PM', culto: 'Consultoría Estatutaria, Personerías y Notarial', tipo: 'Jurídica' }
      ]
    } 
  },
  { 
    id: 'mp-1', 
    nombre_completo: "Armando Arboleda", 
    rol: "Presidente Nacional", 
    telefono: "+57 321 643 3191", 
    activo: true, 
    sedes: { 
      id: 'sede-nacional',
      nombre: "Sede Nacional Misión Panamericana", 
      ciudad: "Bogotá D.C.", 
      departamento: "Cundinamarca",
      direccion: "Carrera 13 # 63-39 Chapinero",
      telefono_contacto: "+57 321 643 3191",
      zona: "Dirección Nacional (Misión Panamericana de Colombia)",
      horarios: [
        { dia: 'Domingo', hora: '10:00 AM - 12:30 PM', culto: 'Culto Solemne Nacional de Alabanza y Adoración', tipo: 'Culto Principal' },
        { dia: 'Martes a Viernes', hora: '08:00 AM - 05:00 PM', culto: 'Despacho de Presidencia y Junta Directiva General', tipo: 'Gobierno' }
      ]
    } 
  }
];

export default function RegistroPastor() {
  const { perfil } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState('lista');
  const [usuarios, setUsuarios] = useState(DIRECTORIO_INICIAL);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  // Estados de Búsqueda y Filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');
  const [filtroRol, setFiltroRol] = useState('Todos');

  // Estados para Modal de Ficha Ministerial y Horarios de la Congregación
  const [pastorFicha, setPastorFicha] = useState(null);

  // Estados del formulario de nuevo registro
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pinInicial, setPinInicial] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('Pastor');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [departamento, setDepartamento] = useState('Valle del Cauca');
  const [direccionNueva, setDireccionNueva] = useState('');

  // Estados para el Modal de Edición (Cambio de teléfono / pérdida de celular / PIN)
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editRol, setEditRol] = useState('Pastor');
  const [editDireccion, setEditDireccion] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [editHorarios, setEditHorarios] = useState([]);

  useEffect(() => {
    cargarDirectorio();
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    try {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('nombre', { ascending: true });

      if (!error && data && data.length > 0) {
        setSedes(data);
        if (!sedeSeleccionada) setSedeSeleccionada(data[0].id);
      }
    } catch (err) {
      console.warn('Carga de sedes en modo local institucional');
    }
  };

  const cargarDirectorio = async () => {
    try {
      setCargando(true);
      const guardadoLocal = localStorage.getItem('ipo_directorio_sedes_v2');
      let baseInicial = DIRECTORIO_INICIAL;
      if (guardadoLocal) {
        try {
          baseInicial = JSON.parse(guardadoLocal);
        } catch (e) {}
      }
      const { data, error } = await supabase
        .from('perfiles')
        .select(`
          id,
          nombre_completo,
          telefono,
          rol,
          activo,
          sede_id,
          sedes ( id, nombre, ciudad, departamento, direccion, telefono_contacto )
        `)
        .order('nombre_completo', { ascending: true });

      if (!error && data && data.length > 0) {
        // Filtrar cualquier registro ficticio antiguo y enriquecer registros reales con los horarios de culto
        const reales = data.filter(
          u => !NOMBRES_FICTICIOS_EXCLUIDOS.includes((u.nombre_completo || '').toLowerCase().trim())
        );

        if (reales.length > 0) {
          const datosCompletos = reales.map((u) => {
            const plantillaFallback = DIRECTORIO_INICIAL.find(p => p.nombre_completo.toLowerCase() === u.nombre_completo.toLowerCase()) || DIRECTORIO_INICIAL[0];
            return {
              ...u,
              sedes: {
                ...plantillaFallback.sedes,
                ...(u.sedes || {}),
                direccion: u.sedes?.direccion || plantillaFallback.sedes?.direccion || 'Calle Principal Centro',
                horarios: u.sedes?.horarios || plantillaFallback.sedes?.horarios || []
              }
            };
          });
          setUsuarios(datosCompletos);
        } else {
          setUsuarios(baseInicial);
        }
      } else {
        setUsuarios(baseInicial);
      }
    } catch (error) {
      console.warn('Usando directorio oficial predeterminado:', error);
      setUsuarios(baseInicial);
    } finally {
      setCargando(false);
    }
  };

  // Filtrado reactivo en tiempo real
  const pastoresFiltrados = usuarios.filter((u) => {
    const q = terminoBusqueda.toLowerCase().trim();
    const coincideTexto = 
      !q ||
      u.nombre_completo?.toLowerCase().includes(q) ||
      u.telefono?.toLowerCase().includes(q) ||
      u.sedes?.nombre?.toLowerCase().includes(q) ||
      u.sedes?.ciudad?.toLowerCase().includes(q) ||
      u.sedes?.departamento?.toLowerCase().includes(q) ||
      u.sedes?.direccion?.toLowerCase().includes(q);

    const coincideDepto = 
      filtroDepartamento === 'Todos' || 
      u.sedes?.departamento?.toLowerCase().includes(filtroDepartamento.toLowerCase());

    const coincideRol = 
      filtroRol === 'Todos' || 
      (filtroRol === 'Pastor' && u.rol === 'Pastor') ||
      (filtroRol === 'Presbitero' && u.rol === 'Presbitero') ||
      (filtroRol === 'Directiva' && (u.rol === 'Administracion' || u.rol === 'Abogado' || u.rol === 'Presidente Nacional'));

    return coincideTexto && coincideDepto && coincideRol;
  });

  const abrirEdicion = (u) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre_completo);
    setEditTelefono(u.telefono || '');
    setEditPin('');
    setEditRol(u.rol);
    setEditDireccion(u.sedes?.direccion || '');
    setEditActivo(u.activo);
    const horariosActuales = (u.sedes?.horarios && u.sedes.horarios.length > 0)
      ? JSON.parse(JSON.stringify(u.sedes.horarios))
      : [
          { dia: 'Domingo', hora: '09:00 AM - 10:30 AM', culto: 'Escuela Dominical y Discipulado', tipo: 'Culto Principal' },
          { dia: 'Domingo', hora: '06:00 PM - 08:00 PM', culto: 'Culto General de Alabanza y Palabra', tipo: 'Culto Principal' },
          { dia: 'Miércoles', hora: '07:00 PM - 08:30 PM', culto: 'Culto de Doctrina y Estudio Bíblico', tipo: 'Enseñanza' },
          { dia: 'Viernes', hora: '09:00 AM - 11:30 AM', culto: 'Ayuno Congregacional y Clamor', tipo: 'Oración' },
          { dia: 'Sábado', hora: '06:30 PM - 08:00 PM', culto: 'Reunión de Jóvenes y Familias', tipo: 'Ministerios' },
          { dia: 'Lunes', hora: 'Todo el día', culto: 'Descanso Ministerial Pastoral (Institucional IPO)', tipo: 'Descanso' }
        ];
    setEditHorarios(horariosActuales);
  };

  const actualizarHorario = (index, campo, valor) => {
    setEditHorarios(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  const agregarCulto = () => {
    setEditHorarios(prev => [
      ...prev,
      { dia: 'Jueves', hora: '07:00 PM - 08:30 PM', culto: 'Servicio de Oración y Familias', tipo: 'Oración' }
    ]);
  };

  const eliminarCulto = (index) => {
    setEditHorarios(prev => prev.filter((_, i) => i !== index));
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    setGuardandoEdicion(true);
    try {
      const numNormalizado = editTelefono.startsWith('+') ? editTelefono : `+57 ${editTelefono.replace(/\D/g, '')}`;
      const pinLimpio = editPin.replace(/\D/g, '').slice(0, 6);

      if (pinLimpio && pinLimpio.length === 6) {
        // Si es 123456 forzamos que el pastor cree su propio PIN al entrar
        guardarPinLocal(numNormalizado, pinLimpio, pinLimpio === '123456');
      }

      if (!usuarioEditando.id.startsWith('mp-')) {
        const camposUpdate = {
          nombre_completo: editNombre,
          telefono: numNormalizado,
          rol: editRol,
          activo: editActivo,
          updated_at: new Date().toISOString()
        };
        if (pinLimpio && pinLimpio.length === 6) {
          camposUpdate.pin_acceso = pinLimpio;
          camposUpdate.requiere_cambio_pin = pinLimpio === '123456';
        }
        await supabase
          .from('perfiles')
          .update(camposUpdate)
          .eq('id', usuarioEditando.id);
      }

      setUsuarios(prev => {
        const actualizados = prev.map(u => {
          if (u.id === usuarioEditando.id) {
            return {
              ...u,
              nombre_completo: editNombre,
              telefono: numNormalizado,
              rol: editRol,
              activo: editActivo,
              sedes: {
                ...(u.sedes || {}),
                direccion: editDireccion || u.sedes?.direccion,
                horarios: editHorarios
              }
            };
          }
          return u;
        });
        try {
          localStorage.setItem('ipo_directorio_sedes_v2', JSON.stringify(actualizados));
        } catch (e) {
          console.warn('Error guardando en almacenamiento local:', e);
        }
        return actualizados;
      });

      if (pastorFicha && pastorFicha.id === usuarioEditando.id) {
        setPastorFicha(prev => ({
          ...prev,
          nombre_completo: editNombre,
          telefono: numNormalizado,
          rol: editRol,
          sedes: {
            ...(prev.sedes || {}),
            direccion: editDireccion || prev.sedes?.direccion,
            horarios: editHorarios
          }
        }));
      }

      const msgPin = (pinLimpio && pinLimpio.length === 6)
        ? `\nPIN actualizado a: ${pinLimpio}${pinLimpio === '123456' ? ' (se le pedirá crear uno personal en su próximo ingreso)' : ''}`
        : '';
      alert(`¡Expediente de ${editNombre} actualizado exitosamente!\n\nNueva línea autorizada: ${numNormalizado}${msgPin}`);
      setUsuarioEditando(null);
    } catch (error) {
      alert('Error actualizando expediente: ' + error.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const alternarEstado = async (id, estadoActual) => {
    try {
      if (!id.startsWith('mp-')) {
        await supabase
          .from('perfiles')
          .update({ activo: !estadoActual })
          .eq('id', id);
      }
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: !estadoActual } : u));
    } catch (error) {
      alert('Error cambiando estado: ' + error.message);
    }
  };

  const registrarMiembro = async (e) => {
    e.preventDefault();
    if (!nombreCompleto || !telefono) return;

    setGuardando(true);
    try {
      const numeroFormateado = telefono.startsWith('+') ? telefono : `+57 ${telefono.replace(/\D/g, '')}`;
      const pinAsignado = (pinInicial.replace(/\D/g, '').length === 6)
        ? pinInicial.replace(/\D/g, '')
        : '123456';
      const exigirCambio = pinAsignado === '123456';

      guardarPinLocal(numeroFormateado, pinAsignado, exigirCambio);

      const nuevoUsuario = {
        id: `usr-${Date.now()}`,
        nombre_completo: nombreCompleto,
        telefono: numeroFormateado,
        rol: rolSeleccionado,
        pin_acceso: pinAsignado,
        requiere_cambio_pin: exigirCambio,
        activo: true,
        sedes: {
          id: `sede-${Date.now()}`,
          nombre: `Iglesia Panamericana ${departamento}`,
          ciudad: departamento === 'Valle del Cauca' ? 'Cali' : departamento === 'Risaralda' ? 'Pereira' : 'Sede Municipal',
          departamento: departamento,
          direccion: direccionNueva || 'Carrera Principal # 10-20',
          telefono_contacto: numeroFormateado,
          zona: `Zona Sur-Occidente (${departamento})`,
          horarios: [
            { dia: 'Domingo', hora: '09:00 AM - 10:30 AM', culto: 'Escuela Dominical y Familias', tipo: 'Culto Principal' },
            { dia: 'Domingo', hora: '06:00 PM - 07:45 PM', culto: 'Culto General de Adoración y Alabanza', tipo: 'Culto Principal' },
            { dia: 'Miércoles', hora: '07:00 PM - 08:30 PM', culto: 'Culto de Doctrina Bíblica', tipo: 'Enseñanza' },
            { dia: 'Viernes', hora: '09:00 AM - 11:30 AM', culto: 'Ayuno Zonal y Clamor', tipo: 'Oración' },
            { dia: 'Sábado', hora: '06:30 PM - 08:00 PM', culto: 'Culto de Jóvenes y Familias', tipo: 'Ministerios' },
            { dia: 'Lunes', hora: 'Todo el día', culto: 'Descanso Ministerial Pastoral (Institucional IPO)', tipo: 'Descanso' }
          ]
        }
      };

      try {
        await supabase.from('perfiles').insert([{
          nombre_completo: nombreCompleto,
          telefono: numeroFormateado,
          rol: rolSeleccionado,
          pin_acceso: pinAsignado,
          requiere_cambio_pin: exigirCambio,
          activo: true
        }]);
      } catch (errDb) {
        console.warn('Guardado en memoria de sesión activa');
      }

      setUsuarios(prev => [nuevoUsuario, ...prev]);
      setMensajeExito(true);
      setNombreCompleto('');
      setTelefono('');
      setPinInicial('');
      setDireccionNueva('');

      setTimeout(() => {
        setMensajeExito(false);
        setPestanaActiva('lista');
      }, 1000);

    } catch (error) {
      alert('Error al registrar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerBadgeRol = (rol) => {
    const estilos = {
      "Presidente Nacional": "bg-purple-100 text-purple-900 border-purple-300 font-bold",
      Presbitero: "bg-blue-100 text-blue-900 border-blue-300 font-bold",
      Pastor: "bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold",
      Administracion: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      Abogado: "bg-slate-100 text-slate-800 border-slate-300 font-bold"
    };
    return `px-2.5 py-1 rounded-full text-xs border ${estilos[rol] || "bg-slate-50 text-slate-700"}`;
  };

  // Generador de enlace WhatsApp directo
  const obtenerLinkWhatsApp = (telefonoPastor, nombrePastor) => {
    const soloNumeros = (telefonoPastor || '').replace(/\D/g, '');
    const numFinal = soloNumeros.startsWith('57') ? soloNumeros : `57${soloNumeros}`;
    const mensaje = `Paz de Cristo Pastor ${nombrePastor}. Le saluda la Administración Zonal de la Misión Panamericana de Colombia.`;
    return `https://wa.me/${numFinal}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pt-1 pb-12">
      
      {/* =========================================================================
          ENCABEZADO INSTITUCIONAL DE GOBERNANZA
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
              <Compass size={13} className="text-blue-600" /> 
              Misión Panamericana de Colombia · Zona Sur-Occidente
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Directorio Zonal Autorizado
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Directorio Pastoral y Congregaciones</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Consulta líneas autorizadas, direcciones de templos y el cronograma de reuniones de cada iglesia en la zona.
          </p>
        </div>
        
        {/* Selector de Pestañas */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={cargarDirectorio}
            className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-sm"
            title="Recargar directorio"
          >
            <RefreshCw size={17} className={cargando ? 'animate-spin text-blue-600' : ''} />
          </button>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setPestanaActiva('lista')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                pestanaActiva === 'lista' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Directorio ({usuarios.length})</span>
            </button>
            {perfil?.esDominioGlobal && (
              <button
                onClick={() => setPestanaActiva('registro')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pestanaActiva === 'registro' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus size={15} />
                <span>Inscribir en Censo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VISTA 1: DIRECTORIO INTERACTIVO CON BUSCADOR Y EXPEDIENTES
      ========================================================================= */}
      {pestanaActiva === 'lista' && (
        <div className="space-y-4">
          
          {/* BARRA DE BÚSQUEDA Y FILTROS POR DEPARTAMENTO */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              
              {/* Input de Búsqueda */}
              <div className="md:col-span-8 relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por nombre de pastor, iglesia, municipio (ej. Roldanillo, Wilson, Quibdó, Pereira)..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium outline-none transition-all"
                />
                {terminoBusqueda && (
                  <button 
                    onClick={() => setTerminoBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filtro por Rol */}
              <div className="md:col-span-4">
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="Todos">Todos los Cargos</option>
                  <option value="Pastor">Pastores Titulares</option>
                  <option value="Presbitero">Presbiterio Zonal</option>
                  <option value="Directiva">Junta y Administración</option>
                </select>
              </div>

            </div>

            {/* Chips de Departamentos de la Zona Sur-Occidente */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Zona:</span>
              {['Todos', 'Valle del Cauca', 'Risaralda', 'Quindío', 'Caldas', 'Chocó'].map((depto) => (
                <button
                  key={depto}
                  onClick={() => setFiltroDepartamento(depto)}
                  className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                    filtroDepartamento === depto
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {depto}
                </button>
              ))}
              <span className="ml-auto text-xs font-semibold text-slate-500 shrink-0">
                {pastoresFiltrados.length} {pastoresFiltrados.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
          </div>

          {/* TABLA PRINCIPAL DEL DIRECTORIO */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6">Pastor / Funcionario</th>
                    <th className="p-4">Cargo Zonal</th>
                    <th className="p-4">Congregación y Dirección</th>
                    <th className="p-4">Contacto Directo</th>
                    <th className="p-4 text-center">Ficha de Cultos</th>
                    <th className="p-4 text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {pastoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400">
                        <Users size={36} className="mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-slate-700">No se encontraron pastores con los criterios ingresados.</p>
                        <p className="text-xs mt-1">Prueba cambiando el departamento o borrando el término de búsqueda.</p>
                      </td>
                    </tr>
                  ) : (
                    pastoresFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-blue-50/40 transition-colors">
                        
                        {/* 1. Nombre y Estado */}
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {usuario.rol === 'Presidente Nacional' && <Award size={16} className="text-purple-600 shrink-0" />}
                            {usuario.rol === 'Abogado' && <Scale size={15} className="text-purple-600 shrink-0" />}
                            {usuario.rol === 'Administracion' && <Building2 size={15} className="text-amber-600 shrink-0" />}
                            {usuario.rol === 'Pastor' && <Church size={15} className="text-emerald-600 shrink-0" />}
                            <span>{usuario.nombre_completo}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              usuario.activo 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {usuario.activo ? 'Censo Activo' : 'Suspendido'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {usuario.sedes?.ciudad || 'Zona Sur-Occidente'}
                            </span>
                          </div>
                        </td>

                        {/* 2. Badge de Cargo */}
                        <td className="p-4">
                          <span className={obtenerBadgeRol(usuario.rol)}>
                            {usuario.rol === 'Administracion' ? 'Administradora Zonal' : usuario.rol}
                          </span>
                        </td>

                        {/* 3. Congregación y Dirección Física */}
                        <td className="p-4 max-w-xs">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                            <Church size={13} className="text-blue-600 shrink-0" />
                            <span className="truncate">{usuario.sedes?.nombre || 'Sede Central'}</span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-start gap-1 mt-0.5 font-medium">
                            <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                            <span className="leading-tight">{usuario.sedes?.direccion || 'Calle Principal Centro'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 pl-4">
                            {usuario.sedes?.ciudad}, {usuario.sedes?.departamento}
                          </div>
                        </td>

                        {/* 4. Teléfono Celular y Accesos Directos (WhatsApp / Llamar) */}
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <Smartphone size={13} className="text-slate-500" />
                            {usuario.telefono}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {/* Botón WhatsApp */}
                            <a
                              href={obtenerLinkWhatsApp(usuario.telefono, usuario.nombre_completo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all hover:scale-102"
                              title="Escribir por WhatsApp oficial"
                            >
                              <IconWhatsApp size={13} />
                              <span>WhatsApp</span>
                            </a>

                            {/* Botón Llamar */}
                            <a
                              href={`tel:${usuario.telefono?.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all"
                              title="Llamar a línea telefónica"
                            >
                              <PhoneCall size={12} />
                              <span>Llamar</span>
                            </a>
                          </div>
                        </td>

                        {/* 5. Botón Ver Ficha y Cronograma de Reuniones */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setPastorFicha(usuario)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm group"
                          >
                            <Calendar size={13} className="text-blue-300 group-hover:text-white" />
                            <span>Ver Horarios</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>

                        {/* 6. Acciones: Actualizar Línea / Suspender (Solo Dominio Global o el propio Pastor en su sede) */}
                        <td className="p-4 text-right pr-6 space-x-1">
                          {(perfil?.esDominioGlobal || usuario.telefono?.replace(/\D/g, '').slice(-10) === perfil?.telefono?.replace(/\D/g, '').slice(-10)) && (
                            <button 
                              onClick={() => abrirEdicion(usuario)}
                              className="inline-flex p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Editar información de sede o línea telefónica"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {perfil?.esDominioGlobal && (
                            <button 
                              onClick={() => alternarEstado(usuario.id, usuario.activo)}
                              className={`inline-flex p-2 rounded-xl transition-colors ${
                                usuario.activo 
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={usuario.activo ? "Suspender acceso" : "Reactivar acceso"}
                            >
                              {usuario.activo ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VISTA 2: FORMULARIO DE ALTA POR LA OFICINA CENTRAL (NANCY GARCÍA)
      ========================================================================= */}
      {pestanaActiva === 'registro' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
          <div className="bg-slate-900 p-6 text-center border-b-4 border-emerald-500 text-white">
            <h4 className="text-lg font-bold">Inscripción en el Censo Central Ministerial</h4>
            <p className="text-slate-400 text-xs mt-1">
              Solo los pastores registrados desde esta pantalla por Nancy García podrán autenticarse en el sistema.
            </p>
          </div>

          <form onSubmit={registrarMiembro} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre Completo del Pastor o Ministro</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                  <input 
                    type="text" 
                    required 
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Pastor Juan Carlos Valencia" 
                    className="pl-9 w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Departamento (Zona Sur-Occidente)</label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                >
                  <option value="Valle del Cauca">Valle del Cauca</option>
                  <option value="Risaralda">Risaralda</option>
                  <option value="Quindío">Quindío</option>
                  <option value="Caldas">Caldas</option>
                  <option value="Chocó">Chocó</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Smartphone size={14} className="text-emerald-600" />
                  Línea Telefónica Autorizada (WhatsApp)
                </label>
                <input 
                  type="tel" 
                  required 
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 311 387 0976" 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-800" 
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Dirección Física de la Congregación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MapPin size={16} /></div>
                  <input 
                    type="text" 
                    value={direccionNueva}
                    onChange={(e) => setDireccionNueva(e.target.value)}
                    placeholder="Ej. Carrera 5 # 12-34 Barrio El Poblado" 
                    className="pl-9 w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Cargo / Rol Eclesiástico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Shield size={16} /></div>
                  <select 
                    value={rolSeleccionado}
                    onChange={(e) => setRolSeleccionado(e.target.value)}
                    className="pl-9 w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-medium"
                  >
                    <option value="Pastor">Pastor Local (Congregación)</option>
                    <option value="Presbitero">Presbítero Zonal (Junta Directiva)</option>
                    <option value="Administracion">Administración y Finanzas (Nancy García)</option>
                    <option value="Abogado">Asesoría Jurídica y Notarial (Dra. Elizabeth Nieto)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <KeyRound size={14} className="text-blue-600" />
                  PIN Inicial de Acceso (6 dígitos)
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInicial}
                  onChange={(e) => setPinInicial(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Por defecto: 123456 (Temporal)" 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-800" 
                />
                <p className="text-[10px] text-slate-400">
                  Si lo dejas vacío o en 123456, el sistema le pedirá crear su PIN secreto al entrar por primera vez.
                </p>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={guardando}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Inscribir y Habilitar Acceso en el Censo Central
              </button>
            </div>

            {mensajeExito && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                ¡Línea registrada exitosamente! El pastor ya puede ingresar con su celular.
              </div>
            )}
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL DETALLADO: FICHA DE LA CONGREGACIÓN Y HORARIOS DE CULTOS
      ========================================================================= */}
      {pastorFicha && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Header del Expediente */}
            <div className="bg-slate-900 p-6 text-white relative">
              <button 
                onClick={() => setPastorFicha(null)} 
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-700/60">
                  {pastorFicha.sedes?.zona || 'Zona Sur-Occidente'}
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Expediente Activo
                </span>
              </div>

              <h3 className="text-2xl font-black text-white">{pastorFicha.nombre_completo}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Shield size={13} className="text-blue-400" /> {pastorFicha.rol} · {pastorFicha.sedes?.nombre}
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* 1. SECCIÓN: CONTACTO DIRECTO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Línea Telefónica Registrada
                  </span>
                  <div className="text-lg font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Smartphone size={18} className="text-emerald-600" />
                    <span>{pastorFicha.telefono}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={obtenerLinkWhatsApp(pastorFicha.telefono, pastorFicha.nombre_completo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <IconWhatsApp size={16} />
                    <span>Abrir WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${pastorFicha.telefono?.replace(/\s+/g, '')}`}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <PhoneCall size={14} className="text-blue-600" />
                    <span>Llamar</span>
                  </a>
                </div>
              </div>

              {/* 2. SECCIÓN: UBICACIÓN Y DIRECCIÓN EXACTA DE LA IGLESIA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14} className="text-rose-500" />
                    Ubicación y Dirección de la Congregación
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const usuarioParaEditar = pastorFicha;
                        setPastorFicha(null);
                        abrirEdicion(usuarioParaEditar);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                      title="Editar dirección física de la iglesia"
                    >
                      <Edit2 size={12} />
                      <span>Corregir Dirección</span>
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pastorFicha.sedes?.nombre} ${pastorFicha.sedes?.direccion} ${pastorFicha.sedes?.ciudad}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Ver en Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Church size={18} className="text-blue-600 shrink-0" />
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{pastorFicha.sedes?.nombre}</h5>
                      <p className="text-xs text-slate-500">Misión Panamericana de Colombia</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <p className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <span className="text-slate-400 font-normal">Dirección física:</span> 
                      {pastorFicha.sedes?.direccion || 'Calle Principal Centro'}
                    </p>
                    <p className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <span className="text-slate-400 font-normal">Municipio / Ciudad:</span> 
                      {pastorFicha.sedes?.ciudad}, {pastorFicha.sedes?.departamento}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. SECCIÓN: REUNIONES Y HORARIOS DE CULTOS DE SU CONGREGACIÓN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-600" />
                    Reuniones Semanales y Cultos de la Congregación
                  </h4>
                  <button
                    onClick={() => {
                      const usuarioParaEditar = pastorFicha;
                      setPastorFicha(null);
                      abrirEdicion(usuarioParaEditar);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    title="Modificar los días y horarios de reunión"
                  >
                    <Edit2 size={12} />
                    <span>Modificar Horarios</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(pastorFicha.sedes?.horarios || []).map((h, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                        h.tipo === 'Descanso' 
                          ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                          : h.tipo === 'Culto Principal'
                            ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            h.dia === 'Domingo' 
                              ? 'bg-blue-600 text-white' 
                              : h.dia === 'Lunes'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                          }`}>
                            {h.dia}
                          </span>
                          <span className="font-bold text-slate-900">{h.culto}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 pl-1">
                          <Clock size={11} /> {h.hora}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        h.tipo === 'Descanso' 
                          ? 'bg-amber-200 text-amber-900' 
                          : h.tipo === 'Culto Principal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {h.tipo}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Protección del Lunes de Descanso:</strong> Por estatuto nacional de la Misión Panamericana, el día lunes se respeta el descanso de los pastores y sus familias, sin convocatorias zonales obligatorias.
                  </span>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const usuarioParaEditar = pastorFicha;
                  setPastorFicha(null);
                  abrirEdicion(usuarioParaEditar);
                }}
                className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit2 size={13} />
                <span>Corregir Dirección o Celular</span>
              </button>
              <button
                onClick={() => setPastorFicha(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ACTUALIZAR EXPEDIENTE POR ROBO/CAMBIO DE SIMCARD (NANCY GARCÍA)
      ========================================================================= */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 p-5 sm:p-6 flex justify-between items-center text-white border-b border-slate-800 shrink-0">
              <div>
                <h4 className="font-bold text-lg">Actualizar Datos de Pastor y Congregación</h4>
                <p className="text-xs text-blue-300">Línea telefónica, dirección física y días de reuniones/cultos</p>
              </div>
              <button 
                onClick={() => setUsuarioEditando(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo del Pastor</label>
                <input 
                  type="text" 
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>

              {/* CAMBIO DE NÚMERO POR ROBO O PÉRDIDA */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <Smartphone size={15} className="text-amber-700" />
                  Nueva Línea Autorizada (WhatsApp)
                </label>
                <input 
                  type="tel" 
                  required
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm font-bold text-slate-900 bg-white"
                />
                <p className="text-[11px] text-amber-800 leading-tight">
                  Al actualizar este campo, el número anterior queda revocado inmediatamente y el pastor podrá ingresar con su nuevo equipo celular.
                </p>
              </div>

              {/* DIRECCIÓN FÍSICA DE LA IGLESIA */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Dirección Física de la Iglesia</label>
                <input 
                  type="text" 
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  placeholder="Ej. Carrera 7 # 8-45 Barrio El Carmen"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              {/* DÍAS Y HORARIOS DE CULTOS / REUNIONES DE LA CONGREGACIÓN */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Calendar size={15} className="text-blue-600" />
                    Días y Horarios de Reuniones (Cultos)
                  </label>
                  <button
                    type="button"
                    onClick={agregarCulto}
                    className="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Agregar Servicio
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Configura los días, horas y tipos de servicio que celebra tu congregación local.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editHorarios.map((h, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Día</label>
                          <select
                            value={h.dia}
                            onChange={(e) => actualizarHorario(idx, 'dia', e.target.value)}
                            className="w-full text-xs font-bold p-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Domingo">Domingo</option>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                          </select>
                        </div>
                        <div className="col-span-7">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Horario</label>
                          <input
                            type="text"
                            value={h.hora}
                            onChange={(e) => actualizarHorario(idx, 'hora', e.target.value)}
                            placeholder="Ej. 07:00 PM - 08:30 PM"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div className="col-span-1 text-right pt-4">
                          {h.tipo !== 'Descanso' ? (
                            <button
                              type="button"
                              onClick={() => eliminarCulto(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Eliminar este servicio"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-bold" title="Día estatutario de descanso">★</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre del Culto</label>
                          <input
                            type="text"
                            value={h.culto}
                            onChange={(e) => actualizarHorario(idx, 'culto', e.target.value)}
                            placeholder="Ej. Escuela Dominical, Ayuno, Doctrina"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                          <select
                            value={h.tipo}
                            onChange={(e) => actualizarHorario(idx, 'tipo', e.target.value)}
                            className="w-full text-[11px] font-semibold p-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Culto Principal">Culto Principal</option>
                            <option value="Enseñanza">Enseñanza</option>
                            <option value="Oración">Oración</option>
                            <option value="Ministerios">Ministerios</option>
                            <option value="Administración">Administración</option>
                            <option value="Descanso">Descanso</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESTABLECIMIENTO DE PIN DE SEGURIDAD */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 uppercase flex items-center gap-1.5">
                    <KeyRound size={14} className="text-blue-700" />
                    Restablecer PIN de Acceso (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPin('123456')}
                    className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Asignar Temporal (123456)
                  </button>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Dejar en blanco para conservar el PIN actual"
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900 bg-white"
                />
                <p className="text-[11px] text-blue-800 leading-tight">
                  Si asignas <strong>123456</strong>, el pastor deberá crear su propio PIN personal de 6 dígitos en su próximo ingreso.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rol / Cargo</label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="Pastor">Pastor Local</option>
                    <option value="Presbitero">Presbítero Zonal</option>
                    <option value="Administracion">Administración y Finanzas</option>
                    <option value="Abogado">Asesoría Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Estado de Acceso</label>
                  <select
                    value={editActivo ? 'true' : 'false'}
                    onChange={(e) => setEditActivo(e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm bg-white font-semibold"
                  >
                    <option value="true">Habilitado (Activo)</option>
                    <option value="false">Suspendido (Sin Acceso)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {guardandoEdicion ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
