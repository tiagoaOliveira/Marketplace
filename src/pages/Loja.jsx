import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storesService, geoService } from '../lib/services';
import { supabase } from '../lib/supabase';
import { useSearch } from '../hooks/useSearch';
import { useCatalogSearch } from '../hooks/useCatalogSearch';
import { RxArrowLeft } from "react-icons/rx";
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useSlug } from '../hooks/useSlug';
import StoreForm from './StoreForm';
import StoreCard from '../components/StoreCard';
import ProductModal from '../components/ProductModal';
import AddProductModal from '../components/AddProductModal';
import StoreProductsSection from '../components/StoreProductsSection';
import CatalogSection from '../components/CatalogSelection';
import './Loja.css';

const Stores = () => {
  const { notification, showNotification, hideNotification } = useNotification();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { createSlug } = useSlug();

  // Estados principais
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState(null);
  const [creatingStore, setCreatingStore] = useState(false);

  // Estados de produtos
  const [expandedProducts, setExpandedProducts] = useState(null);
  const [expandedCatalog, setExpandedCatalog] = useState(null);
  const [storeProducts, setStoreProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // Estados de modais
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(null);

  // Hooks de busca
  const searchProductsInStore = useSearch({ autoSearch: false, limit: 50 });
  const searchCatalog = useCatalogSearch({ autoSearch: true, limit: 20, minChars: 2 });

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '', business_name: '', description: '', category: '', cnpj: '', 
    email: '', phone: '',
    address: { street: '', number: '', complement: '', neighborhood: '', 
               city: '', state: '', zip_code: '' },
    business_hours: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Mercearia', 'Açougue', 'Padaria', 'Farmácia', 'Construção', 
    'Eletrônicos', 'Roupas', 'Casa e Decoração', 'Outros'
  ];

  // Effects
  useEffect(() => {
    if (isAuthenticated && user?.id) loadUserStores();
    else setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (stores.length > 0) stores.forEach(store => loadStoreProducts(store.id));
  }, [stores]);

  // Funções de carregamento
  const loadUserStores = async () => {
    try {
      const { data, error } = await storesService.getUserStores(user.id);
      if (!error) setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreProducts = async (storeId) => {
    if (storeProducts[storeId]) return;
    setLoadingProducts(prev => ({ ...prev, [storeId]: true }));
    try {
      const { data, error } = await supabase
        .from('product_listings')
        .select(`*, products (id, name, description, category, images)`)
        .eq('store_id', storeId);

      if (!error) {
        const allProducts = data || [];
        const activeProducts = allProducts.filter(p => p.is_active !== false);
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: activeProducts,
          [`${storeId}_all`]: allProducts
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProducts(prev => ({ ...prev, [storeId]: false }));
    }
  };

  // Handlers de navegação
  const handleVoltar = () => {
    if (editingStore || creatingStore) resetForm();
    else window.history.back();
  };

  const irParaLoja = (nomeLoja) => {
    const slug = createSlug(nomeLoja);
    navigate(`/loja/${slug}`);
  };

  // Handlers de toggle
  const handleToggleProducts = async (store) => {
    if (expandedProducts === store.id) {
      setExpandedProducts(null);
      searchProductsInStore.handleClear();
    } else {
      setExpandedProducts(store.id);
      await loadStoreProducts(store.id);
    }
  };

  const handleToggleCatalog = async (store) => {
    if (expandedCatalog === store.id) {
      setExpandedCatalog(null);
      searchCatalog.handleClear();
    } else {
      setExpandedCatalog(store.id);
      await loadStoreProducts(store.id);
    }
  };

  // Funções de filtro
  const getFilteredStoreProducts = (storeId) => {
    const products = storeProducts[storeId] || [];
    const term = searchProductsInStore.searchTerm.toLowerCase().trim();
    if (!term) return products;

    return products.filter(listing => {
      const name = (listing.products?.name || listing.product?.name || listing.name || '').toLowerCase();
      const category = (listing.products?.category || listing.product?.category || '').toLowerCase();
      return name.includes(term) || category.includes(term);
    });
  };

  // Handlers de formulário de loja
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'business_hours') {
      setFormData(prev => ({ ...prev, business_hours: value }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nome da loja é obrigatório';
    if (!formData.category) errors.category = 'Categoria é obrigatória';
    if (formData.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) 
      errors.cnpj = 'CNPJ inválido';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) 
      errors.email = 'Email inválido';
    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) 
      errors.phone = 'Formato: (11) 99999-9999';
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
      if (editingStore) {
        await updateStore();
      } else {
        await createStore();
      }
      await loadUserStores();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      setFormErrors({ submit: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStore = async () => {
    const updates = {};
    let hasChanges = false;
    let addressChanged = false;

    // Verificar mudanças nos campos
    Object.keys(formData).forEach(key => {
      if (key === 'address') {
        const oldAddress = editingStore.address || {};
        const newAddress = formData.address;
        if (JSON.stringify(oldAddress) !== JSON.stringify(newAddress)) {
          updates.address = newAddress.street ? newAddress : null;
          hasChanges = true;
          addressChanged = newAddress.zip_code !== (oldAddress.zip_code || '');
        }
      } else if (formData[key] !== (editingStore[key] || '')) {
        updates[key] = formData[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    const result = await storesService.updateStore(editingStore.id, updates);
    if (result.error) {
      setFormErrors({ submit: result.error });
      return;
    }

    if (addressChanged && formData.address.zip_code) {
      await geoService.updateStoreLocation(editingStore.id, formData.address);
    }
  };

  const createStore = async () => {
    const storeData = {
      ...formData,
      user_id: user.id,
      address: formData.address.street ? formData.address : null,
      business_hours: formData.business_hours
    };

    const result = await storesService.createStore(storeData);
    if (result.error) {
      setFormErrors({ submit: result.error });
      return;
    }

    if (result.data && formData.address.zip_code) {
      const storeId = result.data[0]?.id;
      await geoService.updateStoreLocation(storeId, formData.address);
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
        street: '', number: '', complement: '', neighborhood: '', 
        city: '', state: '', zip_code: '' 
      },
      business_hours: store.business_hours || []
    });
  };

  const handleCreateNew = () => {
    setCreatingStore(true);
    setFormData({
      name: '', business_name: '', description: '', category: '', 
      cnpj: '', email: '', phone: '',
      address: { street: '', number: '', complement: '', neighborhood: '', 
                 city: '', state: '', zip_code: '' },
      business_hours: []
    });
  };

  const resetForm = () => {
    setFormData({
      name: '', business_name: '', description: '', category: '', 
      cnpj: '', email: '', phone: '',
      address: { street: '', number: '', complement: '', neighborhood: '', 
                 city: '', state: '', zip_code: '' },
      business_hours: []
    });
    setFormErrors({});
    setEditingStore(null);
    setCreatingStore(false);
  };

  const handleSaveBusinessHours = async (horariosAtualizados) => {
    if (!editingStore?.id) return;
    try {
      const { error } = await storesService.updateStore(editingStore.id, {
        business_hours: horariosAtualizados
      });

      if (error) {
        showNotification('Erro ao salvar horários: ' + error, 'error');
      } else {
        showNotification('Horários salvos com sucesso!', 'success');
        setStores(prev => prev.map(s =>
          s.id === editingStore.id ? { ...s, business_hours: horariosAtualizados } : s
        ));
        setEditingStore(prev => ({ ...prev, business_hours: horariosAtualizados }));
      }
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      showNotification('Erro inesperado ao salvar horários', 'error');
    }
  };

  // Handlers de produtos
  const handleDeleteProduct = async (product) => {
    try {
      const { data, error } = await supabase
        .from('product_listings')
        .update({ is_active: false })
        .eq('id', product.id)
        .select(`*, products (id, name, description, category, images)`);

      if (error) {
        showNotification('Erro ao remover produto. Tente novamente.', 'error');
        return;
      }

      const storeId = product.store_id || Object.keys(storeProducts).find(id =>
        storeProducts[id].some(p => p.id === product.id)
      );

      if (storeId) {
        const inactiveListing = data[0];
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: prev[storeId].filter(p => p.id !== product.id),
          [`${storeId}_all`]: [
            ...(prev[`${storeId}_all`] || []).filter(p => p.id !== product.id),
            inactiveListing
          ]
        }));
        showNotification('Produto removido com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showNotification('Erro ao remover produto. Tente novamente.', 'error');
    }
  };

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      const { error } = await storesService.updateProductListing(productId, updateData);
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        return false;
      }

      const storeId = Object.keys(storeProducts).find(id => 
        storeProducts[id].some(p => p.id === productId)
      );

      if (storeId) {
        setStoreProducts(prev => ({
          ...prev,
          [storeId]: prev[storeId].map(p => 
            p.id === productId ? { ...p, ...updateData } : p
          )
        }));
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return false;
    }
  };

  const handleAddNewProduct = async (product, store, productData) => {
    try {
      const allProducts = storeProducts[`${store.id}_all`] || [];
      const existingListing = allProducts.find(
        listing => (listing.products?.id === product.id || listing.product_id === product.id)
      );

      if (existingListing) {
        // Reativar produto
        const { data, error } = await supabase
          .from('product_listings')
          .update({ ...productData, is_active: true })
          .eq('id', existingListing.id)
          .select(`*, products (id, name, description, category, images)`);

        if (error) {
          showNotification('Erro ao reativar produto.', 'error');
          return false;
        }

        const updatedListing = data[0];
        setStoreProducts(prev => ({
          ...prev,
          [store.id]: [
            ...(prev[store.id] || []).filter(p => p.id !== existingListing.id),
            updatedListing
          ],
          [`${store.id}_all`]: [
            ...(prev[`${store.id}_all`] || []).filter(p => p.id !== existingListing.id),
            updatedListing
          ]
        }));
        showNotification('Produto reativado com sucesso!', 'success');
      } else {
        // Criar novo produto
        const listingData = {
          product_id: product.id,
          store_id: store.id,
          ...productData,
          is_active: true
        };

        const { data, error } = await storesService.createProductListing(listingData);
        if (error) {
          showNotification('Erro ao adicionar produto.', 'error');
          return false;
        }

        const newListing = { ...data[0], products: product };
        setStoreProducts(prev => ({
          ...prev,
          [store.id]: [...(prev[store.id] || []), newListing],
          [`${store.id}_all`]: [...(prev[`${store.id}_all`] || []), newListing]
        }));
        showNotification('Produto adicionado com sucesso!', 'success');
      }
      return true;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      showNotification('Erro ao adicionar produto.', 'error');
      return false;
    }
  };

  // Renderização condicional
  if (!isAuthenticated) {
    return (
      <div className="stores-container">
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={hideNotification}
          />
        )}
        <div className="stores-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            <RxArrowLeft />
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
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={hideNotification}
          />
        )}
        <div className="stores-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            <RxArrowLeft />
          </button>
          <h1>Minha Loja</h1>
        </div>
        <div className="loading-message">Carregando lojas...</div>
      </div>
    );
  }

  return (
    <div className="stores-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {(editingStore || creatingStore) ? (
        <StoreForm
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          categories={categories}
          editingStore={editingStore}
          creatingStore={creatingStore}
          handleVoltar={handleVoltar}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          handleSaveBusinessHours={handleSaveBusinessHours}
        />
      ) : (
        <div className="stores-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            <RxArrowLeft />
          </button>
          <h1>Minha Loja</h1>
        </div>
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdateProduct}
        />
      )}

      {addingProduct && (
        <AddProductModal
          productInfo={addingProduct}
          onClose={() => setAddingProduct(null)}
          onAdd={handleAddNewProduct}
        />
      )}

      {!editingStore && !creatingStore && (
        <div className="stores-list">
          {stores.length === 0 ? (
            <div className="empty-state">
              <h3>Você ainda não tem lojas criadas</h3>
              <p>Crie sua primeira loja para começar a vender seus produtos</p>
              <button className="btn btn-primary" onClick={handleCreateNew}>
                Criar Nova Loja
              </button>
            </div>
          ) : (
            stores.map(store => (
              <React.Fragment key={store.id}>
                <StoreCard
                  store={store}
                  onEdit={handleEdit}
                  onVisit={irParaLoja}
                />

                <StoreProductsSection
                  store={store}
                  expanded={expandedProducts === store.id}
                  onToggle={handleToggleProducts}
                  products={getFilteredStoreProducts(store.id)}
                  loading={loadingProducts[store.id]}
                  searchTerm={searchProductsInStore.searchTerm}
                  onSearchChange={searchProductsInStore.setSearchTerm}
                  onClearSearch={searchProductsInStore.handleClear}
                  onEditProduct={setEditingProduct}
                  onDeleteProduct={handleDeleteProduct}
                  confirmingDelete={confirmingDelete}
                  setConfirmingDelete={setConfirmingDelete}
                />

                <CatalogSection
                  store={store}
                  expanded={expandedCatalog === store.id}
                  onToggle={handleToggleCatalog}
                  catalogProducts={searchCatalog.produtos}
                  loading={searchCatalog.loading}
                  searchTerm={searchCatalog.searchTerm}
                  onSearchChange={searchCatalog.setSearchTerm}
                  onClearSearch={searchCatalog.handleClear}
                  storeProducts={storeProducts[`${store.id}_all`] || []}
                  onAddProduct={(product) => setAddingProduct({ product, store })}
                />
              </React.Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Stores;