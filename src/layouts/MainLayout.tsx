import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { NewAppointmentModal } from '../components/NewAppointmentModal';
import { SupabaseInfoModal } from '../components/SupabaseInfoModal';
import { cn } from '../lib/utils';

export interface MainLayoutProps {
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className }) => {
  const { isSupabaseActive, toastMessage } = useSalon();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className={cn('min-h-screen bg-slate-50 text-slate-800 antialiased', className)}>
      {/* Sidebar Desktop & Mobile Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Wrapper offset by sidebar on desktop (md:pl-64) */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Component */}
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          rightActions={
            !isSuperAdmin ? (
              <button
                onClick={() => setIsNewAppointmentOpen(true)}
                className="flex items-center gap-2 h-9 px-3.5 sm:px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs sm:text-sm border border-slate-800 shadow-sm transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Novo Agendamento</span>
              </button>
            ) : null
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal Novo Agendamento */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
      />

      {/* Modal Supabase */}
      <SupabaseInfoModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
