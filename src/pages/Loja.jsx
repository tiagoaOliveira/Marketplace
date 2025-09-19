import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storesService } from '../lib/services';
import { LiaEdit } from "react-icons/lia";
import './Loja.css';

const Stores = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState(null);
  const [storeProducts, setStoreProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  
  // Product editing state
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    price: '',
    stock: ''
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    description: '',
    category: '',
    cnpj: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Mercearia',
    'Açougue',
    'Padaria',
    'Farmácia',
    'Construção',
    'Eletrônicos',
    'Roupas',
    'Casa e Decoração',
    'Outros'
  ];

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserStores();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Carregar produtos de todas as lojas quando as lojas são carregadas
  useEffect(() => {
    if (stores.length > 0) {
      stores.forEach(store => {
        loadStoreProducts(store.id);
      });
    }
  }, [stores]);

  const handleVoltar = () => {
    if (editingStore) {
      resetForm();
    } else {
      window.history.back();
    }
  };

  const loadUserStores = async () => {
    try {
      const { data, error } = await storesService.getUserStores(user.id);
      if (error) {
        console.error('Erro ao carregar lojas:', error);
        return;
      }
      setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreProducts = async (storeId) => {
    if (storeProducts[storeId]) {
      return; // Já carregou os produtos desta loja
    }

    setLoadingProducts(prev => ({ ...prev, [storeId]: true }));
    
    try {
      const { data, error } = await storesService.getStoreProducts(storeId);
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }
      
      // Limitar a 10 produtos
      const limitedProducts = (data || []).slice(0, 10);
      setStoreProducts(prev => ({
        ...prev,
        [storeId]: limitedProducts
      }));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProducts(prev => ({ ...prev, [storeId]: false }));
    }
  };

  // Função corrigida: alterna a exibição dos produtos e carrega quando necessário
  const handleToggleProducts = async (store) => {
    if (expandedProducts === store.id) {
      setExpandedProducts(null);
    } else {
      setExpandedProducts(store.id);
      await loadStoreProducts(store.id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Nome da loja é obrigatório';
    if (!formData.category) errors.category = 'Categoria é obrigatória';
    if (formData.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      errors.cnpj = 'CNPJ inválido (formato: 00.000.000/0001-00)';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      errors.phone = 'Formato: (11) 99999-9999';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const storeData = {
        ...formData,
        user_id: user.id,
        address: formData.address.street ? formData.address : null
      };

      const result = await storesService.updateStore(editingStore.id, storeData);

      if (result.error) {
        setFormErrors({ submit: result.error });
        return;
      }

      // Recarregar lojas
      await loadUserStores();
      
      // Resetar formulário
      resetForm();
      
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      setFormErrors({ submit: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      business_name: store.business_name || '',
      description: store.description || '',
      category: store.category || '',
      cnpj: store.cnpj || '',
      email: store.email || '',
      phone: store.phone || '',
      address: store.address || {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: ''
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      business_name: '',
      description: '',
      category: '',
      cnpj: '',
      email: '',
      phone: '',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: ''
      }
    });
    setFormErrors({});
    setEditingStore(null);
  };

  // Product editing functions
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormData({
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || ''
    });
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    setIsSubmittingProduct(true);

    try {
      const updateData = {
        price: parseFloat(productFormData.price) || 0,
        stock: parseInt(productFormData.stock) || 0
      };

      // Call the update service
      const { error } = await storesService.updateProductListing(editingProduct.id, updateData);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        return;
      }

      // Update local state
      const storeId = editingProduct.store_id || 
        Object.keys(storeProducts).find(id => 
          storeProducts[id].some(p => p.id === editingProduct.id)
        );

      if (storeId) {
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: prev[storeId].map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...updateData }
              : p
          )
        }));
      }

      // Close modal
      setEditingProduct(null);
      setProductFormData({ price: '', stock: '' });

    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const { error } = await storesService.deleteProductListing(product.id);

      if (error) {
        console.error('Erro ao excluir produto:', error);
        return;
      }

      // Update local state
      const storeId = product.store_id || 
        Object.keys(storeProducts).find(id => 
          storeProducts[id].some(p => p.id === product.id)
        );

      if (storeId) {
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: prev[storeId].filter(p => p.id !== product.id)
        }));
      }

    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="stores-container">
        <div className="stores-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            ←
          </button>
          <h1>Minha Loja</h1>
        </div>
        <div className="auth-required">
          <p>Você precisa estar logado para gerenciar lojas.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stores-container">
        <div className="stores-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            ←
          </button>
          <h1>Minha Loja</h1>
        </div>
        <div className="loading-message">Carregando lojas...</div>
      </div>
    );
  }

  return (
    <div className="stores-container">
      <div className="stores-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          ←
        </button>
        <h1>{editingStore ? 'Editar Loja' : 'Minha Loja'}</h1>
      </div>

      {editingStore && (
        <form className="store-form" onSubmit={handleSubmit}>          
          {formErrors.submit && (
            <div className="error-message">{formErrors.submit}</div>
          )}

          <div className="form-section">            
            <div className="form-group">
              <label>Nome da Loja *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome fantasia da loja"
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label>Razão Social</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                placeholder="Razão social completa"
              />
            </div>

            <div className="form-group">
              <label>Categoria *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {formErrors.category && <span className="field-error">{formErrors.category}</span>}
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva sua loja e produtos"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0001-00"
              />
              {formErrors.cnpj && <span className="field-error">{formErrors.cnpj}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Contato</h3>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@loja.com"
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Endereço</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Rua</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="form-group">
                <label>Número</label>
                <input
                  type="text"
                  name="address.number"
                  value={formData.address.number}
                  onChange={handleInputChange}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Complemento</label>
              <input
                type="text"
                name="address.complement"
                value={formData.address.complement}
                onChange={handleInputChange}
                placeholder="Sala, andar, etc."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bairro</label>
                <input
                  type="text"
                  name="address.neighborhood"
                  value={formData.address.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Nome do bairro"
                />
              </div>
              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  placeholder="Nome da cidade"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  placeholder="SP"
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>CEP</label>
                <input
                  type="text"
                  name="address.zip_code"
                  value={formData.address.zip_code}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
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
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Produto</h3>
              <button
                className="modal-close"
                onClick={() => setEditingProduct(null)}
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Produto</label>
                <input
                  type="text"
                  value={editingProduct.products?.name || editingProduct.product?.name || editingProduct.name || 'Produto sem nome'}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Preço (R$)</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  value={productFormData.price}
                  onChange={handleProductInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Estoque</label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={productFormData.stock}
                  onChange={handleProductInputChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingProduct}
                >
                  {isSubmittingProduct ? 'Salvando...' : 'Atualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!editingStore && (
        <div className="stores-list">
          {stores.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não tem lojas criadas.</p>
            </div>
          ) : (
            stores.map(store => (
              <React.Fragment key={store.id}>
                <div className="store-card">
                  <div className="store-card-header">
                    <div className="store-info">
                      <div className="store-details">
                        <h3>{store.name}</h3>
                        {store.business_name && (
                          <p className="business-name">{store.business_name}</p>
                        )}
                        <p className="category">{store.category}</p>
                        
                        <div className="store-status">
                          {store.is_approved ? (
                            <span className="status approved">✓ Aprovada</span>
                          ) : (
                            <span className="status pending">⏳ Aguardando aprovação</span>
                          )}
                        </div>
                      </div>

                      <div className="store-card-controls">
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(store);
                          }}
                        >
                          <LiaEdit size={28} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="store-products-container">
                  <div 
                    className="store-products-header"
                    onClick={() => handleToggleProducts(store)}
                  >
                    <h3 className="store-products-title">
                      Produtos - {store.name}
                    </h3>
                    <button
                      className={`products-expand-btn ${expandedProducts === store.id ? 'expanded' : ''}`}
                      type="button"
                    >
                      ▼
                    </button>
                  </div>

                  {expandedProducts === store.id && (
                    <div className="store-products-content">
                      {store.description && (
                        <div className="store-description">
                          <p>{store.description}</p>
                        </div>
                      )}

                      {(store.email || store.phone) && (
                        <div className="store-contact">
                          {store.email && <span>📧 {store.email}</span>}
                          {store.phone && <span>📞 {store.phone}</span>}
                        </div>
                      )}

                      <div className="store-products">
                        {loadingProducts[store.id] ? (
                          <p className="loading-products">Carregando produtos...</p>
                        ) : storeProducts[store.id]?.length > 0 ? (
                          <div className="products-list">
                            {storeProducts[store.id].map(listing => {
                              const productName = listing.products?.name || listing.product?.name || listing.name || 'Produto sem nome';
                              const productCategory = listing.products?.category || listing.product?.category || '';
                              const productDescription = listing.products?.description || listing.product?.description || '';
                              const priceFormatted = (typeof listing.price === 'number') ? listing.price.toFixed(2) : '—';
                              return (
                                <div key={listing.id} className="product-item">
                                  <div className="product-info">
                                    <h5>{productName}</h5>
                                    {productCategory && <p className="product-category">{productCategory}</p>}
                                    {productDescription && (
                                      <p className="product-description">{productDescription}</p>
                                    )}
                                  </div>
                                  <div className="product-details">
                                    <span className="product-price">R$ {priceFormatted}</span>
                                    <span className="product-stock">Estoque: {listing.stock ?? '—'}</span>
                                    <div className="product-actions">
                                      <button
                                        className="btn-edit-product"
                                        onClick={() => handleEditProduct(listing)}
                                      >
                                        Editar
                                      </button>
                                      <button
                                        className="btn-delete-product"
                                        onClick={() => handleDeleteProduct(listing)}
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="no-products">Nenhum produto cadastrado nesta loja.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Stores;