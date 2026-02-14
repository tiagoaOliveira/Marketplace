import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export const uploadImages = async (pendingFiles, storeId) => {
  const uploadPromises = pendingFiles.map(async (file) => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });

    const fileExt = file.name.split('.').pop();
    const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  });

  return Promise.all(uploadPromises);
};

/**
 * Remove imagens do storage que foram excluídas pelo usuário.
 * Compara as URLs originais com as que sobraram.
 */
export const deleteRemovedImages = async (originalUrls = [], currentUrls = []) => {
  const removed = originalUrls.filter(url => !currentUrls.includes(url));
  if (removed.length === 0) return;

  console.log('Imagens a remover:', removed);

  const paths = removed
    .map(url => {

      let match = url.match(/product-images\/(.+)$/);
      if (match) {
        console.log('Path extraído:', match[1]);
        return match[1];
      }
      
      console.warn('Não foi possível extrair path de:', url);
      return null;
    })
    .filter(Boolean);

  console.log('Paths a deletar:', paths);

  if (paths.length > 0) {
    const { data, error } = await supabase.storage.from('product-images').remove(paths);
    if (error) {
      console.error('Erro ao remover imagens do storage:', error);
    } else {
      console.log('Imagens removidas com sucesso:', data);
    }
  }
};