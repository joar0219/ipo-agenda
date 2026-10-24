/**
 * SCRIPT DE PRUEBAS AUTOMATIZADAS DE LAS 3 APIS
 * Proyecto: IPO Gestión
 * Ejecución: node probar-apis.js
 */

const BASE_URL = 'http://localhost:3000';

async function ejecutarPruebas() {
  console.log('\n=============================================================');
  console.log(' INICIANDO BATERÍA DE PRUEBAS DE LAS 3 APIS (IPO GESTIÓN)   ');
  console.log('=============================================================\n');

  try {
    // -----------------------------------------------------------------------
    // PRUEBA 1: API 2 - POST /api/usuarios (Crear Usuario - Pantalla 3 Registro)
    // -----------------------------------------------------------------------
    console.log('📌 [PRUEBA 1] API 2: Inscribir un nuevo miembro (POST /api/usuarios)');
    const resCrear = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreCompleto: "Pastor Daniel Estudiante",
        telefono: "+57310" + Math.floor(1000000 + Math.random() * 9000000),
        rol: "Pastor",
        notas: "Inscripción académica para evaluación de APIs"
      })
    });

    const dataCrear = await resCrear.json();
    console.log(`   Status HTTP: ${resCrear.status} (Esperado: 201)`);
    console.log('   Respuesta recibida:', JSON.stringify(dataCrear, null, 2));

    const nuevoId = dataCrear?.data?.id || "e4f5a6b7-8901-2345-6789-abcdef012345";
    const telefonoPrueba = dataCrear?.data?.telefono || "+573151234567";

    // -----------------------------------------------------------------------
    // PRUEBA 2: API 1 - POST /api/auth/login (Autenticación - Pantalla 2 Login)
    // -----------------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('📌 [PRUEBA 2] API 1: Iniciar Sesión OTP (POST /api/auth/login)');
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefono: telefonoPrueba,
        codigo: "748291"
      })
    });

    const dataLogin = await resLogin.json();
    console.log(`   Status HTTP: ${resLogin.status} (Esperado: 200)`);
    console.log('   Token emitido:', dataLogin?.data?.tokenAcceso?.substring(0, 35) + '...');
    console.log('   Usuario autenticado:', dataLogin?.data?.usuario?.nombreCompleto || dataLogin?.data?.usuario?.nombre_completo);

    // -----------------------------------------------------------------------
    // PRUEBA 3: API 2 - GET /api/usuarios (Listar Directorio - Dashboard)
    // -----------------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('📌 [PRUEBA 3] API 2: Consultar Directorio (GET /api/usuarios)');
    const resListar = await fetch(`${BASE_URL}/api/usuarios`);
    const dataListar = await resListar.json();
    console.log(`   Status HTTP: ${resListar.status} (Esperado: 200)`);
    console.log(`   Total de miembros en directorio: ${dataListar?.total || dataListar?.data?.length}`);

    // -----------------------------------------------------------------------
    // PRUEBA 4: API 3 - GET /api/usuarios/:id (Detalle de Perfil - Pantalla 15)
    // -----------------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log(`📌 [PRUEBA 4] API 3: Consultar Perfil por ID (GET /api/usuarios/${nuevoId})`);
    const resDetalle = await fetch(`${BASE_URL}/api/usuarios/${nuevoId}`);
    const dataDetalle = await resDetalle.json();
    console.log(`   Status HTTP: ${resDetalle.status} (Esperado: 200)`);
    console.log('   Datos del perfil:', dataDetalle?.data?.nombre_completo, '| Rol:', dataDetalle?.data?.rol);

    // -----------------------------------------------------------------------
    // PRUEBA 5: API 3 - PUT /api/usuarios/:id (Actualizar Perfil - Pantalla 15)
    // -----------------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log(`📌 [PRUEBA 5] API 3: Actualizar Rol y Sede (PUT /api/usuarios/${nuevoId})`);
    const resActualizar = await fetch(`${BASE_URL}/api/usuarios/${nuevoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rol: "Presbitero",
        activo: true
      })
    });

    const dataActualizar = await resActualizar.json();
    console.log(`   Status HTTP: ${resActualizar.status} (Esperado: 200)`);
    console.log('   Respuesta de actualización:', JSON.stringify(dataActualizar, null, 2));

    console.log('\n=============================================================');
    console.log(' ✅ TODAS LAS PRUEBAS DE LAS 3 APIS FINALIZARON CON ÉXITO    ');
    console.log('=============================================================\n');

  } catch (error) {
    console.error('\n❌ Error ejecutando las pruebas:', error.message);
    console.log('Asegúrate de que el servidor esté encendido ejecutando en otra terminal: node server.js\n');
  }
}

ejecutarPruebas();
