import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { cn } from '../lib/utils';

export interface AuthLayoutProps {
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ className }) => {
  return (
    <div className={cn('min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased', className)}>
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Scissors className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-slate-800 tracking-tight">BelezaFlow</span>
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            A plataforma completa de agendamento para salões de beleza
          </p>
        </div>

        {/* Auth Box */}
        <Outlet />

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-400">
          BelezaFlow &bull; Sistema SaaS com suporte a Supabase &bull; 100% Responsivo
        </p>
      </div>
    </div>
  );
};
