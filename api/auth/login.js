import { createClient } from '@supabase/supabase-js';

// Inicialización del cliente Supabase con variables de entorno
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * API 1: AUTENTICACIÓN / LOGIN (IPO GESTIÓN)
 * Ruta: POST /api/auth/login
 * Descripción: Valida las credenciales (vía OTP WhatsApp / SMS o email) y entrega el token de sesión.
 */
export default async function handler(req, res) {
  // Configuración de cabeceras CORS para permitir peticiones desde clientes web y móviles
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Validar que el método HTTP sea POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      codigo: 405,
      mensaje: 'Método no permitido. Solo se acepta POST.'
    });
  }

  const { telefono, codigo, email, password } = req.body;

  try {
    // Modalidad A: Inicio de sesión por WhatsApp / SMS OTP (Estilo IPO Gestión)
    if (telefono && codigo) {
      const numeroFormateado = telefono.startsWith('+') ? telefono : `+57${telefono.replace(/\s+/g, '')}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: numeroFormateado,
        token: codigo,
        type: 'sms'
      });

      if (error) {
        return res.status(401).json({
          success: false,
          codigo: 401,
          mensaje: 'Código de verificación incorrecto o expirado.',
          detalle: error.message
        });
      }

      // Obtener perfil complementario (rol y sede)
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*, sedes(nombre, ciudad)')
        .eq('id', data.user.id)
        .maybeSingle();

      return res.status(200).json({
        success: true,
        codigo: 200,
        mensaje: 'Autenticación exitosa en IPO Gestión',
        data: {
          tokenAcceso: data.session?.access_token,
          tipoToken: 'Bearer',
          expiraEn: data.session?.expires_in,
          usuario: {
            id: data.user.id,
            telefono: data.user.phone,
            nombreCompleto: perfil?.nombre_completo || 'Pastor Titular',
            rol: perfil?.rol || 'Pastor',
            sede: perfil?.sedes?.nombre || 'Sede Central',
            ciudad: perfil?.sedes?.ciudad || 'Roldanillo'
          }
        }
      });
    }

    // Modalidad B: Inicio de sesión tradicional con Email y Contraseña (Alternativa académica)
    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          codigo: 401,
          mensaje: 'Credenciales inválidas.',
          detalle: error.message
        });
      }

      return res.status(200).json({
        success: true,
        codigo: 200,
        mensaje: 'Autenticación exitosa',
        data: {
          tokenAcceso: data.session?.access_token,
          usuario: data.user
        }
      });
    }

    // Si no se proporcionaron los datos obligatorios
    return res.status(400).json({
      success: false,
      codigo: 400,
      mensaje: 'Petición incompleta. Debe enviar { telefono, codigo } o { email, password }.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      codigo: 500,
      mensaje: 'Error interno en el servidor de autenticación.',
      detalle: error.message
    });
  }
}
