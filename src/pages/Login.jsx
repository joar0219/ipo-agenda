import { useState, useRef } from 'react';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  UserCheck,
  Sparkles,
  AlertCircle,
  Scale,
  Building2,
  Church,
  Eye,
  EyeOff,
  KeyRound,
  HelpCircle,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../SupabaseClient';
import { useAuth, obtenerPinsLocales, guardarPinLocal } from '../context/AuthContext';

// Icono SVG oficial de WhatsApp integrado
const IconWhatsApp = ({ size = 20, className = "" }) => (
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

export default function Login({ onLoginSuccess }) {
  const {
    iniciarSesionConPerfil,
    iniciarSesionDemo,
    perfilesDisponibles,
    modoPresentacion,
    alternarModoPresentacion
  } = useAuth();

  // Paso 1: Ingresar Celular | Paso 2: Ingresar PIN Personal | Paso 3: Crear Nuevo PIN Personal (Primer ingreso)
  const [paso, setPaso] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [nuevoPin, setNuevoPin] = useState(['', '', '', '', '', '']);
  const [confirmarPin, setConfirmarPin] = useState(['', '', '', '', '', '']);

  const [mostrarPin, setMostrarPin] = useState(false);
  const [recordarDispositivo, setRecordarDispositivo] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [usuarioDetectado, setUsuarioDetectado] = useState(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [toquesLogo, setToquesLogo] = useState(0);

  const pinRefs = useRef([]);
  const nuevoPinRefs = useRef([]);
  const confirmarPinRefs = useRef([]);

  // Activar/desactivar Modo Presentación Directiva haciendo 5 clics en el escudo o desde el pie de página
  const manejarToqueEscudo = () => {
    const siguiente = toquesLogo + 1;
    setToquesLogo(siguiente);
    if (siguiente >= 5) {
      alternarModoPresentacion(!modoPresentacion);
      setToquesLogo(0);
    }
  };

  // --- PASO 1: VERIFICAR QUE EL NÚMERO EXISTA EN EL CENSO CENTRAL ---
  const verificarLineaAutorizada = async (e) => {
    e.preventDefault();
    const soloDigitos = telefono.replace(/\D/g, '');
    if (soloDigitos.length < 10) {
      setMensajeError('Por favor ingresa un número de celular válido de 10 dígitos.');
      return;
    }

    setCargando(true);
    setMensajeError('');

    try {
      const ultimos10 = soloDigitos.slice(-10);
      let perfilAutorizado = null;

      // 1. Buscar en la base de datos oficial en Supabase
      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*, sedes(nombre, ciudad, departamento, tipo)')
          .ilike('telefono', `%${ultimos10}%`)
          .maybeSingle();

        if (!error && data) {
          perfilAutorizado = data;
        }
      } catch (errDb) {
        console.warn('Verificación contra respaldo institucional activa:', errDb);
      }

      // 2. Respaldo con el directorio oficial institucional
      const plantillaLocal = perfilesDisponibles.find(
        p => p.telefono.replace(/\D/g, '').slice(-10) === ultimos10
      );

      if (!perfilAutorizado && plantillaLocal) {
        perfilAutorizado = { ...plantillaLocal };
      } else if (perfilAutorizado && plantillaLocal) {
        // Completar PIN por defecto si la columna aún no estaba en BD
        if (!perfilAutorizado.pin_acceso) {
          perfilAutorizado.pin_acceso = plantillaLocal.pin_acceso;
        }
      }

      // 3. Revisar si Nancy o el pastor actualizaron el PIN localmente en este navegador
      const pinsLocales = obtenerPinsLocales();
      if (perfilAutorizado && pinsLocales[ultimos10]) {
        perfilAutorizado = {
          ...perfilAutorizado,
          pin_acceso: pinsLocales[ultimos10].pin,
          requiere_cambio_pin: pinsLocales[ultimos10].requiereCambio
        };
      }

      // REGLA INSTITUCIONAL: Bloquear líneas no inscritas en el censo
      if (!perfilAutorizado) {
        setMensajeError(
          `Línea telefónica no autorizada: El número (${telefono}) no figura en el Censo Oficial de la Misión Panamericana de Colombia.\n\nPor seguridad institucional, solo la Administración Zonal (Nancy García) puede inscribir tu línea o autorizar un nuevo número.`
        );
        setCargando(false);
        return;
      }

      if (perfilAutorizado.activo === false) {
        setMensajeError(
          'Esta cuenta ministerial se encuentra suspendida temporalmente. Comunícate con la Administración Zonal en Pereira.'
        );
        setCargando(false);
        return;
      }

      setUsuarioDetectado(perfilAutorizado);
      setPin(['', '', '', '', '', '']);
      setMensajeError('');
      setPaso(2);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } catch (error) {
      console.error('Error en validación de línea:', error);
      setMensajeError('Ocurrió un inconveniente al verificar la línea. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // Manejo de casillas de 6 dígitos (teclado numérico, pegado y retroceso)
  const manejarCambioDigito = (arreglo, setArreglo, refs, index, valor) => {
    const limpio = valor.replace(/\D/g, '');
    if (!limpio && valor !== '') return;

    const copia = [...arreglo];
    copia[index] = limpio.slice(-1);
    setArreglo(copia);
    setMensajeError('');

    if (limpio && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const manejarKeyDown = (arreglo, setArreglo, refs, index, e) => {
    if (e.key === 'Backspace' && !arreglo[index] && index > 0) {
      const copia = [...arreglo];
      copia[index - 1] = '';
      setArreglo(copia);
      refs.current[index - 1]?.focus();
    }
  };

  const manejarPegado = (setArreglo, refs, e) => {
    e.preventDefault();
    const pegado = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pegado) return;
    const nuevo = ['', '', '', '', '', ''];
    for (let i = 0; i < pegado.length; i++) {
      nuevo[i] = pegado[i];
    }
    setArreglo(nuevo);
    const focoIdx = Math.min(pegado.length, 5);
    refs.current[focoIdx]?.focus();
  };

  // --- PASO 2: VERIFICAR EL PIN PERSONAL DE 6 DÍGITOS ---
  const verificarPinPersonal = async (e) => {
    e.preventDefault();
    const pinIngresado = pin.join('');
    if (pinIngresado.length < 6) {
      setMensajeError('Completa los 6 dígitos de tu PIN personal de seguridad.');
      return;
    }

    if (intentosFallidos >= 5) {
      setMensajeError('Has superado el número máximo de intentos. Solicita a la Administración Zonal el restablecimiento de tu PIN.');
      return;
    }

    setCargando(true);
    setMensajeError('');

    try {
      const ultimos6Telefono = (usuarioDetectado?.telefono || '').replace(/\D/g, '').slice(-6);
      const pinEsperado = usuarioDetectado?.pin_acceso || ultimos6Telefono || '123456';

      const esPinCorrecto = pinIngresado === pinEsperado;

      if (!esPinCorrecto) {
        const nuevosIntentos = intentosFallidos + 1;
        setIntentosFallidos(nuevosIntentos);
        setPin(['', '', '', '', '', '']);
        pinRefs.current[0]?.focus();
        setMensajeError(
          `PIN de seguridad incorrecto (${5 - nuevosIntentos} intentos restantes). Verifica tu clave personal o solicita soporte a Administración Zonal.`
        );
        setCargando(false);
        return;
      }

      // Si el usuario tiene marcado cambio de PIN obligatorio (o su PIN sigue siendo el genérico 123456), lo llevamos al Paso 3
      if (usuarioDetectado?.requiere_cambio_pin || pinEsperado === '123456') {
        setNuevoPin(['', '', '', '', '', '']);
        setConfirmarPin(['', '', '', '', '', '']);
        setPaso(3);
        setTimeout(() => nuevoPinRefs.current[0]?.focus(), 100);
        setCargando(false);
        return;
      }

      // Autenticación exitosa
      iniciarSesionConPerfil(usuarioDetectado, recordarDispositivo);
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error('Error verificando PIN:', error);
      setMensajeError('No se pudo validar el PIN en este momento.');
    } finally {
      setCargando(false);
    }
  };

  // --- PASO 3: GUARDAR NUEVO PIN PERSONAL (PRIMER INGRESO) ---
  const guardarNuevoPinPersonal = async (e) => {
    e.preventDefault();
    const strNuevo = nuevoPin.join('');
    const strConfirmar = confirmarPin.join('');

    if (strNuevo.length < 6 || strConfirmar.length < 6) {
      setMensajeError('Debes completar los 6 dígitos en ambos campos.');
      return;
    }

    if (strNuevo !== strConfirmar) {
      setMensajeError('Los PIN ingresados no coinciden. Verifícalos e intenta de nuevo.');
      return;
    }

    if (strNuevo === '123456' || /^(\d)\1{5}$/.test(strNuevo)) {
      setMensajeError('Por tu seguridad, elige un PIN personal distinto a 123456 o números repetidos (ej. 111111).');
      return;
    }

    setCargando(true);
    setMensajeError('');

    try {
      // Actualizar en Supabase si tiene ID real
      if (usuarioDetectado?.id && !String(usuarioDetectado.id).startsWith('perfil-') && !String(usuarioDetectado.id).startsWith('mp-')) {
        await supabase
          .from('perfiles')
          .update({
            pin_acceso: strNuevo,
            requiere_cambio_pin: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', usuarioDetectado.id);
      }

      // Guardar también en almacenamiento seguro local para persistencia inmediata
      guardarPinLocal(usuarioDetectado.telefono, strNuevo, false);

      const perfilActualizado = {
        ...usuarioDetectado,
        pin_acceso: strNuevo,
        requiere_cambio_pin: false
      };

      iniciarSesionConPerfil(perfilActualizado, recordarDispositivo);
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error('Error guardando nuevo PIN:', error);
      setMensajeError('No se pudo actualizar el PIN. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const entrarDirectoDemo = (perfilId) => {
    iniciarSesionDemo(perfilId);
    if (onLoginSuccess) onLoginSuccess();
  };

  // Enlace directo al WhatsApp de Nancy García para restablecimiento de PIN o cambio de línea
  const obtenerEnlaceSoporteNancy = () => {
    const numNancy = '573104278831';
    const nombre = usuarioDetectado?.nombre_completo || 'Pastor / Ministro';
    const tel = telefono || usuarioDetectado?.telefono || '';
    const texto = `Paz de Cristo hermana Nancy García (Administración Zonal). Solicito apoyo para restablecer mi PIN de acceso en la plataforma IPO Gestión. Nombre: ${nombre} - Línea: ${tel}.`;
    return `https://wa.me/${numNancy}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        {/* Cabecera Institucional */}
        <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
          <button
            type="button"
            onClick={manejarToqueEscudo}
            title="Emblema Institucional IPO (5 toques para modo demostración)"
            className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-950/60 mb-3 mx-auto cursor-pointer active:scale-95 transition-transform p-1.5 border-2 border-slate-700/60 hover:border-blue-400 group"
          >
            <img 
              src="/logo-ipo.png" 
              alt="Iglesia Panamericana de Occidente" 
              className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform" 
            />
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">IPO Gestión</h1>
          <p className="text-blue-300 text-xs font-semibold mt-1">
            Misión Panamericana de Colombia · Zona Sur-Occidente
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] bg-slate-800 text-emerald-300 px-3 py-1 rounded-full font-semibold border border-slate-700">
            <Lock size={10} />
            Acceso Cifrado por Línea Oficial + PIN Personal
          </span>
        </div>

        <div className="p-7">
          {/* =================================================================
              PASO 1: IDENTIFICACIÓN POR NÚMERO DE CELULAR EN EL CENSO
          ================================================================= */}
          {paso === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Acceso Ministerial Seguro</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Digita tu número de celular autorizado en el Censo Oficial de la Misión Panamericana.
                </p>
              </div>

              {mensajeError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-line leading-relaxed font-medium">
                    {mensajeError}
                  </div>
                </div>
              )}

              <form onSubmit={verificarLineaAutorizada} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <IconWhatsApp className="text-emerald-600" size={16} />
                    Número de Celular Registrado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      +57
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="311 387 0976"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-bold text-slate-800 text-base tracking-wide"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Solo las líneas activas en el directorio zonal pueden continuar al ingreso de PIN.
                  </p>
                </div>

                {/* Opción de recordar dispositivo */}
                <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={recordarDispositivo}
                    onChange={(e) => setRecordarDispositivo(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium">Mantener mi sesión activa en este dispositivo personal</span>
                </label>

                <button
                  type="submit"
                  disabled={cargando || telefono.replace(/\D/g, '').length < 10}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {cargando ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Continuar a mi PIN Personal <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Soporte directo con Administración Zonal */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <a
                  href={obtenerEnlaceSoporteNancy()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                >
                  <HelpCircle size={14} className="text-emerald-600" />
                  <span>¿Cambiaste de celular o eres pastor nuevo? Contactar Administración</span>
                </a>
              </div>

              {/* PANEL DEMOSTRACIÓN DIRECTIVA (Oculto en producción, visible solo si se activa Modo Presentación) */}
              {modoPresentacion && (
                <div className="mt-5 pt-4 border-t border-dashed border-amber-300 bg-amber-50/50 -mx-7 -mb-7 p-6 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-600" />
                      Modo Demostración Directiva Activo
                    </span>
                    <button
                      type="button"
                      onClick={() => alternarModoPresentacion(false)}
                      className="text-[10px] font-bold text-amber-700 underline hover:text-amber-900"
                    >
                      Ocultar panel
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-800/90 leading-snug mb-2">
                    Accesos rápidos y credenciales de prueba para sustentación ante la Junta Directiva:
                  </p>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => entrarDirectoDemo('perfil-nancy-garcia')}
                      className="w-full py-2 px-3 bg-white hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 size={14} className="text-amber-700" />
                        Nancy García (310 427 8831)
                      </span>
                      <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-full font-bold text-amber-900">
                        PIN: 427883
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => entrarDirectoDemo('perfil-elizabeth-nieto')}
                      className="w-full py-2 px-3 bg-white hover:bg-purple-50 text-purple-950 rounded-xl text-xs font-bold transition-all border border-purple-200 flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Scale size={14} className="text-purple-700" />
                        Dra. Elizabeth Nieto (312 747 6470)
                      </span>
                      <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded-full font-bold text-purple-900">
                        PIN: 747647
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => entrarDirectoDemo('perfil-gabriel-gonzalez')}
                      className="w-full py-2 px-3 bg-white hover:bg-blue-50 text-blue-950 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Church size={14} className="text-blue-700" />
                        Gabriel González (310 857 0176)
                      </span>
                      <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full font-bold text-blue-900">
                        PIN: 857017
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => entrarDirectoDemo('perfil-jose-arcila')}
                      className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-700" />
                        Pastor José Arcila (311 387 0976)
                      </span>
                      <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-emerald-900">
                        PIN: 387097
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              PASO 2: DIGITAR EL PIN SECRETO DE 6 DÍGITOS
          ================================================================= */}
          {paso === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mb-2 shadow-sm">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Ingresa tu PIN Personal</h2>
                <p className="text-slate-600 text-xs mt-0.5">
                  Bienvenido(a), <strong className="text-slate-900">{usuarioDetectado?.nombre_completo}</strong>
                </p>
                <span className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold mt-1 inline-block border border-blue-200">
                  {usuarioDetectado?.rol} · {usuarioDetectado?.sedes?.nombre || usuarioDetectado?.sede_nombre || 'Zona Sur-Occidente'}
                </span>
              </div>

              {mensajeError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{mensajeError}</span>
                </div>
              )}

              <form onSubmit={verificarPinPersonal} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      PIN de Seguridad (6 dígitos)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarPin(!mostrarPin)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {mostrarPin ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{mostrarPin ? 'Ocultar' : 'Mostrar'}</span>
                    </button>
                  </div>

                  <div
                    className="flex justify-between gap-1.5"
                    onPaste={(e) => manejarPegado(setPin, pinRefs, e)}
                  >
                    {pin.map((digito, index) => (
                      <input
                        key={index}
                        ref={(el) => (pinRefs.current[index] = el)}
                        type={mostrarPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={1}
                        value={digito}
                        onChange={(e) => manejarCambioDigito(pin, setPin, pinRefs, index, e.target.value)}
                        onKeyDown={(e) => manejarKeyDown(pin, setPin, pinRefs, index, e)}
                        className="w-11 h-13 text-center text-xl font-black bg-slate-50 border-2 border-slate-300 focus:border-blue-600 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando || pin.join('').length < 6}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {cargando ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                  Verificar PIN y Entrar
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPaso(1);
                      setMensajeError('');
                    }}
                    className="font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    ← Cambiar celular
                  </button>

                  <a
                    href={obtenerEnlaceSoporteNancy()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <IconWhatsApp size={13} />
                    <span>¿Olvidaste tu PIN?</span>
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* =================================================================
              PASO 3: CREACIÓN DE PIN PERSONAL EN EL PRIMER INGRESO
          ================================================================= */}
          {paso === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mb-2 shadow-sm">
                  <RefreshCw size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Actualiza tu PIN Personal</h2>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Por seguridad ministerial, reemplaza tu clave temporal por un <strong>PIN personal de 6 dígitos</strong> que solo tú conozcas.
                </p>
              </div>

              {mensajeError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{mensajeError}</span>
                </div>
              )}

              <form onSubmit={guardarNuevoPinPersonal} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Nuevo PIN Personal (6 dígitos)
                  </label>
                  <div
                    className="flex justify-between gap-1.5"
                    onPaste={(e) => manejarPegado(setNuevoPin, nuevoPinRefs, e)}
                  >
                    {nuevoPin.map((digito, index) => (
                      <input
                        key={index}
                        ref={(el) => (nuevoPinRefs.current[index] = el)}
                        type={mostrarPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={1}
                        value={digito}
                        onChange={(e) => manejarCambioDigito(nuevoPin, setNuevoPin, nuevoPinRefs, index, e.target.value)}
                        onKeyDown={(e) => manejarKeyDown(nuevoPin, setNuevoPin, nuevoPinRefs, index, e)}
                        className="w-11 h-12 text-center text-lg font-black bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 text-slate-900 rounded-xl outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirmar Nuevo PIN
                  </label>
                  <div
                    className="flex justify-between gap-1.5"
                    onPaste={(e) => manejarPegado(setConfirmarPin, confirmarPinRefs, e)}
                  >
                    {confirmarPin.map((digito, index) => (
                      <input
                        key={index}
                        ref={(el) => (confirmarPinRefs.current[index] = el)}
                        type={mostrarPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={1}
                        value={digito}
                        onChange={(e) => manejarCambioDigito(confirmarPin, setConfirmarPin, confirmarPinRefs, index, e.target.value)}
                        onKeyDown={(e) => manejarKeyDown(confirmarPin, setConfirmarPin, confirmarPinRefs, index, e)}
                        className="w-11 h-12 text-center text-lg font-black bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 text-slate-900 rounded-xl outline-none transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando || nuevoPin.join('').length < 6 || confirmarPin.join('').length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {cargando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Guardar mi PIN y Entrar al Sistema
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Pie de tarjeta con conmutador discreto para la sustentación / presentación */}
        <div className="bg-slate-50 border-t border-slate-100 p-3.5 flex items-center justify-between px-6">
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Lock size={11} />
            Misión Panamericana · Auditoría Central
          </p>
          <button
            type="button"
            onClick={() => alternarModoPresentacion(!modoPresentacion)}
            className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="Activar/Desactivar panel de sustentación directiva"
          >
            {modoPresentacion ? 'Modo Producción' : 'Modo Sustentación'}
          </button>
        </div>
      </div>
    </div>
  );
}
