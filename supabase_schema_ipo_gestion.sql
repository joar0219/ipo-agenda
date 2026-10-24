-- ==============================================================================
-- MISIÓN PANAMERICANA DE COLOMBIA - GOBERNANZA ZONAL Y CENTRAL
-- Sistema: IPO Gestión
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
    direccion TEXT,
    telefono_contacto TEXT,
    tipo TEXT DEFAULT 'Local' CHECK (tipo IN ('Sede_Nacional', 'Presbiterio_Zonal', 'Local', 'Mision')),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existía, añadir columna zona si falta:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sedes' AND column_name='zona') THEN
        ALTER TABLE public.sedes ADD COLUMN zona TEXT DEFAULT 'Zona Sur-Occidente';
    END IF;
END $$;

-- 3. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    telefono TEXT UNIQUE,
    rol TEXT DEFAULT 'Pastor' CHECK (rol IN ('Presidente_Nacional', 'Presbitero', 'Pastor', 'Administracion', 'Abogado')),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE AGENDA MINISTERIAL
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

-- 5. TABLA DE DEBERES INSTITUCIONALES (Supervisados por Nancy García)
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

-- 7. POLÍTICAS RLS
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deberes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_deberes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de sedes" ON public.sedes;
CREATE POLICY "Lectura de sedes" ON public.sedes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de perfiles" ON public.perfiles;
CREATE POLICY "Lectura de perfiles" ON public.perfiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura de agenda" ON public.agenda;
CREATE POLICY "Lectura de agenda" ON public.agenda FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de deberes" ON public.deberes;
CREATE POLICY "Gestion de deberes" ON public.deberes FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestion de entregas" ON public.entregas_deberes;
CREATE POLICY "Gestion de entregas" ON public.entregas_deberes FOR ALL TO authenticated USING (true);

-- 8. DATOS SEMILLA: ESTRUCTURA TERRITORIAL DE LA MISIÓN PANAMERICANA
-- Sedes de la Zona Sur-Occidente (Valle, Risaralda, Quindío, Caldas, Chocó)
INSERT INTO public.sedes (nombre, ciudad, departamento, zona, tipo)
VALUES 
    ('Sede Central Roldanillo', 'Roldanillo', 'Valle del Cauca', 'Zona Sur-Occidente', 'Local'),
    ('Presbiterio Central Pereira', 'Pereira', 'Risaralda', 'Zona Sur-Occidente', 'Presbiterio_Zonal'),
    ('Sede Local Cartago', 'Cartago', 'Valle del Cauca', 'Zona Sur-Occidente', 'Local'),
    ('Sede Central Armenia', 'Armenia', 'Quindío', 'Zona Sur-Occidente', 'Local'),
    ('Sede Manizales Norte', 'Manizales', 'Caldas', 'Zona Sur-Occidente', 'Local'),
    ('Misión Quibdó', 'Quibdó', 'Chocó', 'Zona Sur-Occidente', 'Mision'),
    ('Sede Nacional Misión Panamericana', 'Bogotá D.C.', 'Cundinamarca', 'Nacional', 'Sede_Nacional')
ON CONFLICT DO NOTHING;

-- Deberes institucionales emitidos por la Administración Zonal
INSERT INTO public.deberes (titulo, descripcion, asignado_por, rol_destino, fecha_limite, prioridad, requiere_adjunto)
VALUES 
    ('Informe Financiero Mensual', 'Radicación del balance contable mensual con soportes bancarios y comprobantes ante la Administración Zonal (Nancy García).', 'Nancy García (Administración Zonal)', 'Pastor', CURRENT_DATE + INTERVAL '10 days', 'ALTA', TRUE),
    ('Censo Congregacional Zonal', 'Consolidado de miembros activos, bautizados y líderes en la sede local para el archivo del Presbiterio.', 'Gabriel González (Presbítero)', 'Pastor', CURRENT_DATE + INTERVAL '15 days', 'MEDIA', FALSE),
    ('Coordinación Logística Reunión Zonal', 'Confirmación de protocolo y asistencia para la asamblea de presbíteros de la Zona Sur-Occidente.', 'Junta Directiva Zonal', 'Pastor', CURRENT_DATE + INTERVAL '7 days', 'MEDIA', FALSE)
ON CONFLICT DO NOTHING;
