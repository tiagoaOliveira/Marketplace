import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Upload } from 'lucide-react';
import './ImageUpload.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve(image);
    image.onerror = reject;
  });

const getCroppedImg = async (imageSrc, crop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], 'cropped.webp', { type: 'image/webp' })),
      'image/webp',
      0.9
    );
  });
};

const ImageUpload = ({
  previews = [],           // URLs já salvas no banco
  pendingFiles = [],       // Arquivos novos aguardando upload
  onPreviewsChange,
  onPendingFilesChange,
  maxImages = 5,
}) => {
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const totalImages = previews.length + pendingFiles.length;

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError('Apenas JPG, PNG e WebP são permitidos');
      return;
    }
    if (totalImages >= maxImages) {
      setError(`Máximo de ${maxImages} imagens`);
      return;
    }

    setError('');
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropSave = async () => {
    const croppedFile = await getCroppedImg(cropSrc, croppedAreaPixels);
    onPendingFilesChange([...pendingFiles, croppedFile]);
    setCropSrc(null);
  };

  const handleRemovePending = (index) => {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  // Remove imagem salva — o modal cuida de deletar do storage no submit
  const handleRemovePreview = (url) => {
    onPreviewsChange(previews.filter(u => u !== url));
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">
        Imagens do Produto (máx. {maxImages})
      </label>

      <div className="images-preview">
        {/* Imagens já salvas no banco */}
        {previews.map((url) => (
          <div key={url} className="image-preview-item">
            <img src={url} alt="Imagem salva" />
            <button type="button" className="remove-image-btn" onClick={() => handleRemovePreview(url)}>
              <X size={16} />
            </button>
          </div>
        ))}

        {/* Arquivos novos com preview local */}
        {pendingFiles.map((file, index) => (
          <div key={index} className="image-preview-item pending">
            <img src={URL.createObjectURL(file)} alt="Preview" />
            <button type="button" className="remove-image-btn" onClick={() => handleRemovePending(index)}>
              <X size={16} />
            </button>
            <span className="pending-badge">Pendente</span>
          </div>
        ))}

        {totalImages < maxImages && (
          <label className="upload-box">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSelect}
              style={{ display: 'none' }}
            />
            <Upload size={24} />
            <span>Adicionar foto</span>
          </label>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      {cropSrc && (
        <div className="crop-modal">
          <div className="crop-container">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="crop-actions">
            <button type="button" onClick={() => setCropSrc(null)}>Cancelar</button>
            <button type="button" onClick={handleCropSave}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;