// ProductModal.jsx
import React, { useState } from 'react';

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    price: product.price?.toString() || '',
    stock: product.stock?.toString() || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const updateData = {
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0
    };

    const success = await onSave(product.id, updateData);
    
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const productName = product.products?.name || 
                      product.product?.name || 
                      product.name || 
                      'Produto sem nome';

  return (
    <div className="modal-overlay-loja" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Produto</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group-loja">
            <label>Produto</label>
            <input 
              type="text" 
              value={productName} 
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
              {isSubmitting ? 'Salvando...' : 'Atualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;