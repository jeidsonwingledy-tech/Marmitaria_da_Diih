export const processImage = async (file: File): Promise<string> => {
  // 1. Validate MIME Type and Extension (Security Check)
  const allowedTypes = [
    { mime: 'image/jpeg', ext: ['jpg', 'jpeg'] },
    { mime: 'image/png', ext: ['png'] },
    { mime: 'image/webp', ext: ['webp'] }
  ];

  const isValidType = allowedTypes.some(type => type.mime === file.type);
  
  // Basic extension check to prevent simple spoofing (e.g. malare.exe renamed to image.jpg)
  // In a real backend, checking magic numbers (file signature) is better.
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const isValidExt = allowedTypes.some(type => type.ext.includes(fileExt));

  if (!isValidType) {
    throw new Error('Formato de arquivo inválido. Apenas JPG, PNG e WEBP são permitidos.');
  }

  if (!isValidExt) {
    throw new Error('A extensão do arquivo não corresponde a um tipo de imagem válido.');
  }

  // 2. Validate Size (Max 20MB)
  // Modern phones take photos > 5MB. We allow up to 20MB input, 
  // knowing we will compress it down significantly in the browser before upload.
  const maxSize = 20 * 1024 * 1024; 
  if (file.size > maxSize) {
    throw new Error('A imagem é muito grande. O tamanho máximo permitido é 20MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 3. Resize (Max 800px for ideal quality/size balance in mobile apps)
        const MAX_DIMENSION = 800;

        if (width > height) {
            if (width > MAX_DIMENSION) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
            }
        } else {
            if (height > MAX_DIMENSION) {
                width = Math.round((width * MAX_DIMENSION) / height);
                width = width; // keeping it clear
                height = MAX_DIMENSION;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Erro interno ao processar imagem.'));
            return;
        }

        // WebP supports transparency, so no need for white background fill
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Compress and Standardize (Always output WebP for smallest file sizes)
        // 0.7 quality provides excellent compression with minimal visual loss for food
        const dataUrl = canvas.toDataURL('image/webp', 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('O arquivo selecionado está corrompido ou não é uma imagem válida.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro de leitura do arquivo. Tente novamente.'));
    reader.readAsDataURL(file);
  });
};