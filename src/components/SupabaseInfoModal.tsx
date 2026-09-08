import React, { useState } from 'react';
import { Database, Check, Copy, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({ isOpen, onClose, className }) => {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  professional_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conexão Supabase"
      className={className}
    >
      <div className="space-y-4 text-sm text-slate-600">
        {/* Status banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <ShieldCheck
            className={`w-5 h-5 mt-0.5 shrink-0 ${
              isSupabaseConfigured ? 'text-emerald-500' : 'text-slate-500'
            }`}
          />
          <div>
            <p className="font-semibold text-slate-800">
              {isSupabaseConfigured
                ? 'Supabase Ativo & Conectado'
                : 'Modo Híbrido com Armazenamento Local Ativo'}
            </p>
            <p className="text-xs mt-0.5 text-slate-600">
              {isSupabaseConfigured
                ? 'As operações de agendamento e serviços estão sendo sincronizadas diretamente com a sua instância Supabase.'
                : 'O aplicativo armazena todos os agendamentos, serviços e status de forma reativa e persistente no navegador. Para ligar ao Supabase remoto, basta configurar as variáveis no arquivo de ambiente.'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
            Variáveis no Arquivo .env
          </h4>
          <div className="bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded-lg overflow-x-auto">
            <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              Script SQL para criação das tabelas
            </h4>
            <button
              onClick={copySql}
              className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-200 font-mono text-xs p-3 rounded-lg overflow-x-auto max-h-44">
            {sqlSchema}
          </pre>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
