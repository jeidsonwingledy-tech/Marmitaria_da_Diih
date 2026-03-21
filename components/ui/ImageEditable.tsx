import React, { useRef, useState } from 'react';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';

interface ImageEditableProps {
  src: string;
  alt: string;
  className?: string;
  onUpdate: (newSrc: string) => void;
  overlayText?: string;
  editable?: boolean;
}

export const ImageEditable: React.FC<ImageEditableProps> = ({ src, alt, className, onUpdate, overlayText = "Alterar Foto", editable }) => {
  const { isAdminMode, notify } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isEditable = editable !== undefined ? editable : isAdminMode;

  const handleClick = () => {
    if (isEditable && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        // Call the backend endpoint to upload the image
        const uploadedImageUrl = await api.uploadImage(file);
        
        // Update the frontend state with the new image URL
        onUpdate(uploadedImageUrl);
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Erro ao realizar upload da imagem', 'error');
      } finally {
        setIsUploading(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className={`relative group ${className} ${isEditable ? 'cursor-pointer' : ''}`} onClick={handleClick}>
      <img 
        src={src || 'https://via.placeholder.com/150?text=Sem+Imagem'} 
        alt={alt} 
        className={`w-full h-full object-contain transition-opacity duration-300 ${isUploading ? 'opacity-50 blur-sm' : 'opacity-100'}`} 
        referrerPolicy="no-referrer"
      />
      
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-20">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
            <span className="text-white text-xs font-bold shadow-sm">Enviando...</span>
        </div>
      )}

      {isEditable && !isUploading && (
        <>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleFileChange}
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="text-white flex flex-col items-center">
              <UploadCloud className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">{overlayText}</span>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-primary text-white text-[10px] px-2 py-1 rounded-full shadow-md z-10 md:hidden flex items-center gap-1">
             <Camera size={10} /> Editar
          </div>
        </>
      )}
    </div>
  );
};