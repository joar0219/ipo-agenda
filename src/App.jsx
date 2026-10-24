import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import MisDeberes from './pages/MisDeberes';
import MiAgenda from './pages/MiAgenda';
import RegistroPastor from './pages/RegistroPastor';
import Login from './pages/Login';
import { Loader2, ShieldCheck } from 'lucide-react';

function ContenidoApp() {
  const { session, cargando } = useAuth();

  // Pantalla de carga mientras Supabase verifica localStorage y tokens de acceso
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-4 animate-pulse">
          <ShieldCheck size={36} className="text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">IPO Gestión</h2>
        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-400" />
          Verificando sesión institucional segura...
        </p>
      </div>
    );
  }

  // Si no hay sesión válida, mostramos el login por WhatsApp
  if (!session) {
    return <Login />;
  }

  // Si hay sesión activa en Supabase, mostramos la plataforma completa
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<MiAgenda />} />
          <Route path="deberes" element={<MisDeberes />} />
          <Route path="registro" element={<RegistroPastor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ContenidoApp />
    </AuthProvider>
  );
}
