import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * API 3: CRUD DE USUARIOS - DETALLE, ACTUALIZAR Y ELIMINAR
 * Rutas:
 *   - GET    /api/usuarios/[id] -> Consulta el detalle de un miembro específico.
 *   - PUT    /api/usuarios/[id] -> Actualiza datos del miembro (nombre, rol, sede, estado).
 *   - DELETE /api/usuarios/[id] -> Elimina o suspende a un miembro institucional.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extraer el identificador del usuario de los parámetros de ruta o query
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      codigo: 400,
      mensaje: 'Falta el parámetro identificador (ID) del usuario.'
    });
  }

  // =========================================================================
  // OPERACIÓN GET: CONSULTAR USUARIO POR ID (READ SINGLE)
  // =========================================================================
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select(`
          id,
          nombre_completo,
          telefono,
          rol,
          activo,
          notas,
          created_at,
          sedes ( id, nombre, ciudad, departamento, direccion )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          codigo: 404,
          mensaje: `No se encontró ningún miembro con el ID: ${id}`
        });
      }

      return res.status(200).json({
        success: true,
        codigo: 200,
        mensaje: 'Detalle de usuario recuperado exitosamente.',
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        codigo: 500,
        mensaje: 'Error al consultar detalle del usuario.',
        detalle: error.message
      });
    }
  }

  // =========================================================================
  // OPERACIÓN PUT / PATCH: ACTUALIZAR USUARIO (UPDATE)
  // =========================================================================
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { nombreCompleto, rol, sedeId, activo, notas } = req.body;

      // Construcción dinámica de campos a actualizar
      const camposActualizar = {};
      if (nombreCompleto !== undefined) camposActualizar.nombre_completo = nombreCompleto;
      if (rol !== undefined) camposActualizar.rol = rol;
      if (sedeId !== undefined) camposActualizar.sede_id = sedeId;
      if (activo !== undefined) camposActualizar.activo = activo;
      if (notas !== undefined) camposActualizar.notas = notas;
      camposActualizar.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('perfiles')
        .update(camposActualizar)
        .eq('id', id)
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

      if (error) throw error;

      return res.status(200).json({
        success: true,
        codigo: 200,
        mensaje: 'Perfil de usuario actualizado correctamente.',
        data
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        codigo: 500,
        mensaje: 'Error al actualizar el usuario.',
        detalle: error.message
      });
    }
  }

  // =========================================================================
  // OPERACIÓN DELETE: ELIMINAR USUARIO (DELETE)
  // =========================================================================
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        codigo: 200,
        mensaje: `Usuario con ID ${id} eliminado del sistema exitosamente.`
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        codigo: 500,
        mensaje: 'Error al eliminar el usuario.',
        detalle: error.message
      });
    }
  }

  // Método no permitido
  return res.status(405).json({
    success: false,
    codigo: 405,
    mensaje: `Método ${req.method} no permitido en esta ruta.`
  });
}
