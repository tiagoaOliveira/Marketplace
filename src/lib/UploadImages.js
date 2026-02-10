import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export const uploadImages = async (pendingFiles, storeId) => {
  // Função interna para redimensionar para 512x512
  const resizeTo512 = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        const ratio = Math.max(size / img.width, size / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        const x = (size - newWidth) / 2;
        const y = (size - newHeight) / 2;

        ctx.drawImage(img, x, y, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            const newFile = new File([blob], file.name, {
              type: 'image/webp',
            });
            resolve(newFile);
          },
          'image/webp',
          0.85
        );
      };

      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadPromises = pendingFiles.map(async (file) => {
    // 1. Redimensiona para 512x512
    let processedFile = await resizeTo512(file);

    // 2. Compressão extra se ainda estiver grande
    if (processedFile.size > 500 * 1024) {
      processedFile = await imageCompression(processedFile, {
        maxSizeMB: 0.5,
        initialQuality: 0.85,
        useWebWorker: true,
      });
    }

    const fileName = `${storeId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.webp`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  });

  return Promise.all(uploadPromises);
};
