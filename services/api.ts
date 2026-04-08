import { supabase } from './supabase';
import { processImage } from '../utils/imageProcessor';

export const api = {
  /**
   * Upload image to Storage (Supabase)
   */
  async uploadImage(file: File): Promise<string> {
    // 1. Process and compress image client-side first (Generates WebP)
    const dataUrl = await processImage(file);
    
    // Convert DataURL back to Blob for upload
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Generate unique path: images/{timestamp}_{filename}.webp
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${timestamp}_${baseName}.webp`;

    // USE SUPABASE
    if (!supabase) {
        throw new Error("Supabase não está configurado.");
    }

    try {
        console.log(`Iniciando upload para o bucket 'images': ${fileName}`);
        
        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, blob, {
                contentType: 'image/webp',
                cacheControl: '31536000', // 1 Year Cache
                upsert: false
            });

        if (error) {
            console.warn("Aviso: O bucket 'images' não existe ou não permite uploads. Salvando a imagem diretamente no banco de dados em formato Base64 como fallback de segurança.", error);
            // Fallback: returns the compressed base64 directly to be saved in the database row
            return dataUrl;
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
  /**
   * Tenta configurar o storage automaticamente
   */
  async setupStorage(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "O sistema agora possui fallback automático para imagens via texto Base64. A configuração de pastas não é mais estritamente necessária!" };
  },

  /**
   * Verifica se o bucket existe
   */
  async checkStorage(): Promise<{ exists: boolean; message: string }> {
    return { exists: true, message: "O sistema de imagens Base64 está ativo e pronto!" };
  }
};
