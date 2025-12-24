// AddProductModal.jsx
import React, { useState } from 'react';

const AddProductModal = ({ productInfo, onClose, onAdd }) => {
  const { product, store } = productInfo;
  const [formData, setFormData] = useState({
    price: '',
    stock: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const productData = {
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0
    };

    const success = await onAdd(product, store, productData);
    
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay-loja" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adicionar Produto</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group-loja">
            <label>Produto</label>
            <input 
              type="text" 
              value={product.name || 'Produto sem nome'} 
              disabled 
            />
          </div>
          <div className="form-group-loja">
            <label>Categoria</label>
            <input 
              type="text" 
              value={product.category || ''} 
              disabled 
            />
          </div>
          <div className="form-group-loja">
            <label>Preço (R$)</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>
          <div className="form-group-loja">
            <label>Estoque</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="0"
              required
            />
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;