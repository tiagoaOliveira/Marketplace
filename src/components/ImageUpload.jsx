import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import './ImageUpload.css';

const ImageUpload = ({ images = [], onChange, maxImages = 5, storeId }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const validateImage = (file) => {
  const maxSize = 500 * 1024; 
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Apenas JPG, PNG e WebP são permitidos';
  }

  if (file.size > maxSize) {
    return 'Imagem deve ter no máximo 500KB';
  }

  return null;
};

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const validationError = validateImage(file);
        if (validationError) {
          throw new Error(validationError);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (urlToRemove) => {
    try {
      // Extrair path da URL
      const path = urlToRemove.split('/product-images/')[1];
      
      if (path) {
        await supabase.storage
          .from('product-images')
          .remove([path]);
      }

      onChange(images.filter(url => url !== urlToRemove));
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">
        Imagens do Produto (máx. {maxImages})
      </label>

      <div className="images-preview">
        {images.map((url, index) => (
          <div key={url} className="image-preview-item">
            <img src={url} alt={`Produto ${index + 1}`} />
            <button
              type="button"
              className="remove-image-btn"
              onClick={() => handleRemove(url)}
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="upload-box">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <div className="uploading">
                <div className="spinner" />
                <span>Enviando...</span>
              </div>
            ) : (
              <>
                <Upload size={24} />
                <span>Adicionar foto</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}
      <p className="upload-hint">JPG, PNG ou WebP • Máx. 500KB por imagem</p>
    </div>
  );
};

export default ImageUpload;