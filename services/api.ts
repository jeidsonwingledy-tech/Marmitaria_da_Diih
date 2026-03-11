import { supabase } from './supabase';
import { processImage } from '../utils/imageProcessor';

export const api = {
  /**
   * Upload image to Storage (Supabase)
   */
  async uploadImage(file: File): Promise<string> {
    // 1. Process and compress image client-side first
    const dataUrl = await processImage(file);
    
    // Convert DataURL back to Blob for upload
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Generate unique path: images/{timestamp}_{filename}
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;

    // USE SUPABASE
    if (!supabase) {
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (key && !key.startsWith('eyJ')) {
            throw new Error("Configuração Supabase Inválida: A chave 'VITE_SUPABASE_ANON_KEY' não é um JWT válido. Use a 'anon public key' do painel do Supabase.");
        }
        throw new Error("Supabase não está configurado ou as chaves no ambiente estão incorretas.");
    }

    try {
        console.log(`Iniciando upload para o bucket 'images': ${fileName}`);
        
        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Erro detalhado do Supabase Storage:", error);
            
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('bucket not found') || errorMsg.includes('does not exist')) {
                // Tenta criar o bucket automaticamente se falhar por não existir
                try {
                    console.log("Tentando criar o bucket 'images' automaticamente...");
                    const { error: createError } = await supabase.storage.createBucket('images', { public: true });
                    
                    if (!createError) {
                        // Se criou, tenta o upload novamente uma única vez
                        const { error: retryError } = await supabase.storage
                            .from('images')
                            .upload(fileName, blob, {
                                contentType: 'image/jpeg',
                                cacheControl: '3600',
                                upsert: false
                            });
                        
                        if (!retryError) {
                            console.log("Upload bem-sucedido após criação automática do bucket.");
                            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                            return publicUrl;
                        }
                    } else {
                        console.warn("Não foi possível criar o bucket automaticamente:", createError.message);
                    }
                } catch (setupError) {
                    console.error("Falha ao tentar criar bucket automaticamente:", setupError);
                }

                throw new Error("Erro de Configuração: O bucket 'images' não existe no seu Supabase. \n\nPara corrigir, vá ao painel do Supabase -> Storage e crie um bucket público chamado 'images'.");
            }
            
            if (errorMsg.includes('row-level security') || errorMsg.includes('rls') || errorMsg.includes('permission denied')) {
                throw new Error("Erro de Permissão: O bucket 'images' existe, mas não permite uploads. \n\nNo painel do Supabase, vá em Storage -> Buckets -> images -> Policies e crie uma política permitindo INSERT e SELECT para usuários anônimos.");
            }

            throw new Error(`Falha no upload: ${error.message}`);
        }

        console.log("Upload concluído com sucesso:", data);

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error("Erro ao fazer upload para o Supabase:", error);
        const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar imagem para o Supabase.';
        throw new Error(errorMessage);
    }
  },

  /**
   * Tenta configurar o storage automaticamente
   */
  async setupStorage(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
        return { success: false, message: "Supabase não configurado. Verifique as variáveis de ambiente." };
    }

    try {
        // Tenta criar o bucket
        const { error: createError } = await supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
            console.warn("Erro ao criar bucket (pode já existir ou falta permissão):", createError);
            
            // Se o erro for de permissão, sugerimos o SQL
            if (createError.message.includes('permission') || createError.message.includes('Policy')) {
                return { 
                    success: false, 
                    message: "Não temos permissão para criar o bucket automaticamente. Por favor, crie um bucket público chamado 'images' manualmente no painel do Supabase (Storage) ou execute o SQL de migração no Editor SQL do Supabase." 
                };
            }
        }

        return { success: true, message: "Bucket 'images' configurado ou já existente. Verifique se as políticas de acesso público (RLS) também estão configuradas no painel." };
    } catch (error) {
        console.error("Erro no setup do storage:", error);
        return { success: false, message: "Erro inesperado ao tentar configurar o storage." };
    }
  },

  /**
   * Verifica se o bucket existe
   */
  async checkStorage(): Promise<{ exists: boolean; message: string }> {
    if (!supabase) return { exists: false, message: "Supabase não configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." };
    
    try {
        // Tenta listar os buckets para ver se temos acesso ao storage em geral
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error("Erro ao listar buckets:", listError);
            return { exists: false, message: `Erro de conexão/permissão: ${listError.message}. Verifique se sua chave Anon tem permissão de leitura em storage.buckets.` };
        }

        const imagesBucket = buckets?.find(b => b.id === 'images');
        
        if (!imagesBucket) {
            return { exists: false, message: "O bucket 'images' não existe na sua lista de buckets do Supabase." };
        }

        if (!imagesBucket.public) {
            return { exists: false, message: "O bucket 'images' existe, mas NÃO é público. Altere para público no painel do Supabase." };
        }

        return { exists: true, message: "Bucket 'images' encontrado, público e ativo!" };
    } catch (err) {
        console.error("Erro catastrófico ao verificar storage:", err);
        return { exists: false, message: "Erro ao conectar com o Supabase Storage. Verifique sua internet e as chaves do projeto." };
    }
  }
};
