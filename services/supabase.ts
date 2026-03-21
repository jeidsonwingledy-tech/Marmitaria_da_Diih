import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/^["'](.+)["']$/, '$1').replace(/\/$/, '');
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim().replace(/^["'](.+)["']$/, '$1');

// Basic JWT validation: Supabase anon keys are always JWTs (3 parts separated by dots, starting with eyJ)
const isLikelyJWT = (key: string) => {
  if (!key) return false;
  const parts = key.split('.');
  return parts.length === 3 && key.startsWith('eyJ');
};

const hasUrl = !!supabaseUrl && supabaseUrl !== 'undefined' && supabaseUrl.length > 10;
const hasKey = !!supabaseKey && supabaseKey !== 'undefined' && isLikelyJWT(supabaseKey);

export const isSupabaseConfigured = hasUrl && hasKey;

// Logging para diagnóstico (visível no console do navegador)
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log("✅ Supabase configurado com sucesso!");
  } else {
    console.group("🔍 Diagnóstico Supabase (Modo Offline)");
    if (!supabaseUrl || supabaseUrl === 'undefined') {
      console.warn("❌ VITE_SUPABASE_URL não encontrada.");
    } else if (!hasUrl) {
      console.warn("❌ VITE_SUPABASE_URL parece inválida:", supabaseUrl);
    } else {
      console.log("✅ VITE_SUPABASE_URL detectada.");
    }

    if (!supabaseKey || supabaseKey === 'undefined') {
      console.warn("❌ VITE_SUPABASE_ANON_KEY não encontrada.");
    } else if (!isLikelyJWT(supabaseKey)) {
      console.warn("❌ VITE_SUPABASE_ANON_KEY não é um JWT válido (deve começar com 'eyJ' e ter 3 partes).");
    } else {
      console.log("✅ VITE_SUPABASE_ANON_KEY detectada.");
    }
    console.info("Dica: Se você acabou de adicionar as variáveis, tente atualizar a página (F5).");
    console.groupEnd();
  }
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
