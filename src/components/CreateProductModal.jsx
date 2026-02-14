import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { uploadImages } from '../lib/UploadImages';
import { supabase } from '../lib/supabase';
import './CreateProductModal.css';

const CreateProductModal = ({ store, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    stock: ''
  });
  const [previews, setPreviews] = useState([]);       
  const [pendingFiles, setPendingFiles] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Alimentos e Bebidas', 'Roupas e Acessórios', 'Eletrônicos',
    'Casa e Decoração', 'Beleza e Cuidados', 'Esportes e Lazer',
    'Livros e Papelaria', 'Outros'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) { setError('Nome do produto é obrigatório'); return; }
    if (pendingFiles.length === 0 && previews.length === 0) { setError('Adicione pelo menos uma imagem'); return; }
    if (!formData.price || parseFloat(formData.price) <= 0) { setError('Preço deve ser maior que zero'); return; }
    if (formData.stock === '' || parseInt(formData.stock) < 0) { setError('Estoque inválido'); return; }

    setLoading(true);
    setError('');

    try {
      // Só faz upload aqui, no submit
      const uploadedUrls = await uploadImages(pendingFiles, store.id);
      const allImages = [...previews, ...uploadedUrls];

      // Cria o produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          images: allImages,
          store_id: store.id
        })
        .select()
        .single();

      if (productError) throw productError;

      // Cria o listing
      const { error: listingError } = await supabase
        .from('product_listings')
        .insert({
          product_id: product.id,
          store_id: store.id,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          is_active: true
        });

      if (listingError) throw listingError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      setError(err.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-loja" onClick={onClose}>
      <div className="modal-content create-product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Criar Novo Produto</h3>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <ImageUpload
            previews={previews}
            pendingFiles={pendingFiles}
            onPreviewsChange={setPreviews}
            onPendingFilesChange={setPendingFiles}
          />

          <div className="form-group-loja">
            <label>Nome do Produto *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder=""
              maxLength={100}
              required
            />
          </div>

          <div className="form-group-loja">
            <label>Descrição</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva seu produto..."
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="form-row">
            <div className="form-group-loja">
              <label>Categoria</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group-loja">
              <label>Subcategoria</label>
              <input
                type="text"
                className="form-input"
                value={formData.subcategory}
                onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="Não obrigatório"
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group-loja">
              <label>Preço (R$) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div className="form-group-loja">
              <label>Estoque *</label>
              <input
                type="number"
                className="form-input"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;