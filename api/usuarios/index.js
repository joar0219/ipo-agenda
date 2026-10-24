import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * API 2: CRUD DE USUARIOS - LISTAR Y CREAR
 * Rutas: 
 *   - GET  /api/usuarios  -> Consulta el directorio de personal institucional.
 *   - POST /api/usuarios  -> Inscribe un nuevo pastor, presbítero o funcionario.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // =========================================================================
  // OPERACIÓN GET: LEER / CONSULTAR USUARIOS (READ)
  // =========================================================================
  if (req.method === 'GET') {
    try {
      const { rol, activo } = req.query;

      let consulta = supabase
        .from('perfiles')
        .select(`
          id,
          nombre_completo,
          telefono,
          rol,
          activo,
          notas,
          created_at,
          sedes (
            id,
            nombre,
            ciudad,
            departamento
          )
        `)
        .order('nombre_completo', { ascending: true });

      // Filtro opcional por rol
      if (rol) {
        consulta = consulta.eq('rol', rol);
      }

      // Filtro opcional por estado activo/suspendido
      if (activo !== undefined) {
        consulta = consulta.eq('activo', activo === 'true');
      }

      const { data, error } = await consulta;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        codigo: 200,
        total: data.length,
        mensaje: 'Directorio de miembros obtenido con éxito',
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        codigo: 500,
        mensaje: 'Error al consultar la lista de usuarios.',
        detalle: error.message
      });
    }
  }

  // =========================================================================
  // OPERACIÓN POST: CREAR / INSCRIBIR USUARIO (CREATE)
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const { nombreCompleto, telefono, rol, sedeId, notas } = req.body;

      // Validación de campos obligatorios
      if (!nombreCompleto || !telefono) {
        return res.status(400).json({
          success: false,
          codigo: 400,
          mensaje: 'Campos obligatorios faltantes: nombreCompleto y telefono son requeridos.'
        });
      }

      // Normalizar número telefónico
      const telefonoNormalizado = telefono.startsWith('+') ? telefono : `+57${telefono.replace(/\s+/g, '')}`;

      // Insertar nuevo registro en la tabla perfiles de Supabase
      const { data, error } = await supabase
        .from('perfiles')
        .insert([
          {
            nombre_completo: nombreCompleto,
            telefono: telefonoNormalizado,
            rol: rol || 'Pastor',
            sede_id: sedeId || null,
            activo: true,
            notas: notas || null
          }
        ])
        .select(`
          id,
          nombre_completo,
          telefono,
          rol,
          activo,
          sede_id,
          sedes ( id, nombre, ciudad )
        `)
        .single();

      if (error) {
        // Manejo de error si el teléfono ya está registrado (UNIQUE constraint)
        if (error.code === '23505') {
          return res.status(409).json({
            success: false,
            codigo: 409,
            mensaje: 'El número de teléfono ya se encuentra registrado para otro miembro institucional.'
          });
        }
        throw error;
      }

      return res.status(201).json({
        success: true,
        codigo: 201,
        mensaje: 'Miembro institucional registrado exitosamente.',
        data
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        codigo: 500,
        mensaje: 'Error al registrar nuevo usuario en el sistema.',
        detalle: error.message
      });
    }
  }

  // Método no permitido
  return res.status(405).json({
    success: false,
    codigo: 405,
    mensaje: `Método ${req.method} no permitido en esta ruta. Utilice GET o POST.`
  });
}
