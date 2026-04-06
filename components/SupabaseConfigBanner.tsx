import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

const SupabaseConfigBanner: React.FC = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 p-3">
      <div className="flex items-start gap-3 max-w-md mx-auto">
        <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 shrink-0">
          <AlertTriangle size={16} />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-amber-900">Configuração do Banco de Dados</h3>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            A chave do Supabase é inválida. O app está em <strong>Modo Offline</strong> (dados salvos apenas neste navegador).
          </p>
          <div className="mt-2 flex gap-3">
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-amber-700 flex items-center gap-1 hover:underline"
            >
              Abrir Supabase <ExternalLink size={10} />
            </a>
            <button 
              onClick={() => alert("Para corrigir:\n1. Vá no Supabase > Settings > API\n2. Copie a 'anon public key'\n3. Cole na variável VITE_SUPABASE_ANON_KEY no painel do AI Studio.")}
              className="text-[10px] font-bold text-amber-700 hover:underline"
            >
              Como corrigir?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConfigBanner;
