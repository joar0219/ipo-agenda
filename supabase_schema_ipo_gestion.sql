-- ==============================================================================
-- MISIÓN PANAMERICANA DE COLOMBIA - GOBERNANZA ZONAL Y CENTRAL
-- Sistema: IPO Gestión (Versión Sincronizada con Frontend y Storage)
-- Zona Territorial: Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE SEDES CON ZONIFICACIÓN TERRITORIAL
CREATE TABLE IF NOT EXISTS public.sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    departamento TEXT NOT NULL,
    zona TEXT DEFAULT 'Zona Sur-Occidente' NOT NULL, -- Valle, Risaralda, Quindío, Caldas, Chocó
    direccion TEXT DEFAULT 'Calle Principal Centro',
    telefono_contacto TEXT,
    tipo TEXT DEFAULT 'Local' CHECK (tipo IN ('Sede_Nacional', 'Presbiterio_Zonal', 'Local', 'Mision')),
    horarios JSONB, -- Estructura de cultos semanales
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existía, asegurar columnas complementarias
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sedes' AND column_name='zona') THEN
        ALTER TABLE public.sedes ADD COLUMN zona TEXT DEFAULT 'Zona Sur-Occidente';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sedes' AND column_name='direccion') THEN
        ALTER TABLE public.sedes ADD COLUMN direccion TEXT DEFAULT 'Calle Principal Centro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sedes' AND column_name='horarios') THEN
        ALTER TABLE public.sedes ADD COLUMN horarios JSONB;
    END IF;
END $$;

-- 3. TABLA DE PERFILES (SINCRONIZADA CON TODOS LOS ROLES INSTITUCIONALES)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    telefono TEXT UNIQUE NOT NULL,
    rol TEXT DEFAULT 'Pastor',
    sede_id UUID REFERENCES public.sedes(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Actualizar restricción CHECK para admitir tanto nombres amigables como códigos técnicos
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles ADD CONSTRAINT perfiles_rol_check 
    CHECK (rol IN (
        'Presidente Nacional', 'Presidente_Nacional', 
        'Presbitero', 'Pastor', 
        'Administracion', 'Abogado', 
        'Contabilidad', 'Asesoría Jurídica'
    ));

-- 4. TABLA DE AGENDA MINISTERIAL (PROTECCIÓN DEL LUNES DE DESCANSO)
CREATE TABLE IF NOT EXISTS public.agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo_alcance TEXT DEFAULT 'Local' CHECK (tipo_alcance IN ('Nacional_IPO', 'Local', 'Personal', 'Descanso')),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    es_obligatorio BOOLEAN DEFAULT FALSE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA DE DEBERES INSTITUCIONALES (SUPERVISADOS POR NANCY GARCÍA)
CREATE TABLE IF NOT EXISTS public.deberes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    asignado_por TEXT DEFAULT 'Nancy García (Administración Zonal)',
    rol_destino TEXT DEFAULT 'Pastor',
    fecha_limite DATE NOT NULL,
    prioridad TEXT DEFAULT 'MEDIA' CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    requiere_adjunto BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE ENTREGAS Y ESTADO DE AUDITORÍA
CREATE TABLE IF NOT EXISTS public.entregas_deberes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deber_id UUID NOT NULL REFERENCES public.deberes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'aprobado', 'observado')),
    archivo_url TEXT,
    fecha_entrega TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(deber_id, usuario_id)
);

-- 7. POLÍTICAS DE SEGURIDAD RLS (SEGURAS Y HABILITANTES PARA VERIFICACIÓN Y GESTIÓN)
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deberes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_deberes ENABLE ROW LEVEL SECURITY;

-- Políticas de Sedes: Lectura abierta para Directorio
DROP POLICY IF EXISTS "Lectura de sedes" ON public.sedes;
CREATE POLICY "Lectura de sedes" ON public.sedes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestion de sedes" ON public.sedes;
CREATE POLICY "Gestion de sedes" ON public.sedes FOR ALL USING (true);

-- Políticas de Perfiles: Verificación telefónica y lectura institucional
DROP POLICY IF EXISTS "Lectura de perfiles" ON public.perfiles;
CREATE POLICY "Lectura de perfiles" ON public.perfiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestion de perfiles" ON public.perfiles;
CREATE POLICY "Gestion de perfiles" ON public.perfiles FOR ALL USING (true);

-- Políticas de Agenda y Deberes
DROP POLICY IF EXISTS "Lectura de agenda" ON public.agenda;
CREATE POLICY "Lectura de agenda" ON public.agenda FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestion de deberes" ON public.deberes;
CREATE POLICY "Gestion de deberes" ON public.deberes FOR ALL USING (true);

DROP POLICY IF EXISTS "Gestion de entregas" ON public.entregas_deberes;
CREATE POLICY "Gestion de entregas" ON public.entregas_deberes FOR ALL USING (true);

-- 8. CONFIGURACIÓN DEL BUCKET DE STORAGE PARA SOPORTES EN SUPABASE
-- Permite almacenar y consultar PDFs de balances financieros y actas
INSERT INTO storage.buckets (id, name, public)
VALUES ('soportes-institucionales', 'soportes-institucionales', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso publico lectura soportes" ON storage.objects;
CREATE POLICY "Acceso publico lectura soportes" ON storage.objects 
FOR SELECT USING (bucket_id = 'soportes-institucionales');

DROP POLICY IF EXISTS "Subida de soportes institucionales" ON storage.objects;
CREATE POLICY "Subida de soportes institucionales" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'soportes-institucionales');

DROP POLICY IF EXISTS "Actualizacion de soportes institucionales" ON storage.objects;
CREATE POLICY "Actualizacion de soportes institucionales" ON storage.objects 
FOR UPDATE USING (bucket_id = 'soportes-institucionales');

-- 9. DATOS SEMILLA: ESTRUCTURA TERRITORIAL DE LA MISIÓN PANAMERICANA (SUR-OCCIDENTE)
INSERT INTO public.sedes (nombre, ciudad, departamento, zona, direccion, telefono_contacto, tipo)
VALUES 
    ('Sede Central Roldanillo', 'Roldanillo', 'Valle del Cauca', 'Zona Sur-Occidente', 'Carrera 7 # 8-45, Barrio El Carmen', '+57 315 123 4567', 'Local'),
    ('Presbiterio Central Pereira', 'Pereira', 'Risaralda', 'Zona Sur-Occidente', 'Av. 30 de Agosto # 42-18, Sector Maraya', '+57 318 987 6543', 'Presbiterio_Zonal'),
    ('Iglesia Panamericana Central Quibdó', 'Quibdó', 'Chocó', 'Zona Sur-Occidente', 'Calle 26 # 4-50, Barrio Alameda', '+57 311 555 4321', 'Local'),
    ('Iglesia Panamericana Armenia Centro', 'Armenia', 'Quindío', 'Zona Sur-Occidente', 'Carrera 14 # 21-30, Barrio Galán', '+57 316 789 0123', 'Local'),
    ('Iglesia Panamericana Manizales', 'Manizales', 'Caldas', 'Zona Sur-Occidente', 'Calle 22 # 24-12, Sector Centro Histórico', '+57 317 444 9876', 'Local'),
    ('Iglesia Panamericana Cartago', 'Cartago', 'Valle del Cauca', 'Zona Sur-Occidente', 'Carrera 4 # 11-20, Barrio El Carmen', '+57 313 888 2345', 'Local'),
    ('Administración Zonal Sur-Occidente', 'Pereira', 'Risaralda', 'Zona Sur-Occidente', 'Av. Circunvalar # 12-40 Oficina 302', '+57 312 456 7890', 'Presbiterio_Zonal'),
    ('Sede Nacional Misión Panamericana', 'Bogotá D.C.', 'Cundinamarca', 'Nacional', 'Carrera 13 # 63-39 Chapinero', '+57 300 111 2233', 'Sede_Nacional')
ON CONFLICT DO NOTHING;

-- Personal Clave Registrado
INSERT INTO public.perfiles (nombre_completo, telefono, rol, activo, notas)
VALUES 
    ('Nancy García', '+57 312 456 7890', 'Administracion', true, 'Encargada de Administración Zonal y Contabilidad (Sur-Occidente)'),
    ('Dra. Elizabeth Nieto', '+57 310 999 8888', 'Abogado', true, 'Dirección de Asesoría Jurídica y Notarial'),
    ('Gabriel González', '+57 318 987 6543', 'Presbitero', true, 'Presbítero Principal y Miembro de Junta Directiva'),
    ('José Orlando Arcila', '+57 315 123 4567', 'Pastor', true, 'Pastor Local Sede Central Roldanillo'),
    ('Wilson Mosquera Palacios', '+57 311 555 4321', 'Pastor', true, 'Pastor Local Iglesia Panamericana Central Quibdó'),
    ('Carlos Arturo Ramírez', '+57 316 789 0123', 'Pastor', true, 'Pastor Local Iglesia Panamericana Armenia Centro'),
    ('Fernando Morales Echeverry', '+57 317 444 9876', 'Pastor', true, 'Pastor Local Iglesia Panamericana Manizales'),
    ('Héctor Fabio Caicedo', '+57 313 888 2345', 'Pastor', true, 'Pastor Local Iglesia Panamericana Cartago'),
    ('Armando Arboleda', '+57 300 111 2233', 'Presidente Nacional', true, 'Presidente General Misión Panamericana de Colombia')
ON CONFLICT (telefono) DO UPDATE SET 
    nombre_completo = EXCLUDED.nombre_completo,
    rol = EXCLUDED.rol,
    activo = EXCLUDED.activo;

-- Deberes Institucionales emitidos por la Administración Zonal
INSERT INTO public.deberes (titulo, descripcion, asignado_por, rol_destino, fecha_limite, prioridad, requiere_adjunto)
VALUES 
    ('Informe Financiero Mensual', 'Radicación del balance contable mensual con soportes bancarios y comprobantes ante la Administración Zonal (Nancy García).', 'Nancy García (Administración Zonal)', 'Pastor', CURRENT_DATE + INTERVAL '10 days', 'ALTA', TRUE),
    ('Censo Congregacional Zonal', 'Consolidado de miembros activos, bautizados y líderes en la sede local para el archivo del Presbiterio.', 'Gabriel González (Presbítero)', 'Pastor', CURRENT_DATE + INTERVAL '15 days', 'MEDIA', FALSE),
    ('Coordinación Logística Reunión Zonal', 'Confirmación de protocolo y asistencia para la asamblea de presbíteros de la Zona Sur-Occidente.', 'Junta Directiva Zonal', 'Pastor', CURRENT_DATE + INTERVAL '7 days', 'MEDIA', FALSE)
ON CONFLICT DO NOTHING;
