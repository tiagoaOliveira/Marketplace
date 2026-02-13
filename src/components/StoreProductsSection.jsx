// StoreProductsSection.jsx
import React from 'react';
import { X } from 'lucide-react';

const StoreProductsSection = ({
  store,
  expanded,
  onToggle,
  products,
  loading,
  searchTerm,
  onSearchChange,
  onClearSearch,
  onEditProduct,
  onDeleteProduct,
  confirmingDelete,
  setConfirmingDelete,
  onEditOwnProduct // Nova prop para edição completa de produtos próprios
}) => {
  return (
    <div className="store-products-container">
      <div 
        className="store-products-header" 
        onClick={() => onToggle(store)}
      >
        <h3 className="store-products-title">Produtos Cadastrados</h3>
        <button 
          className={`products-expand-btn ${expanded ? 'expanded' : ''}`} 
          type="button"
        >
          ▼
        </button>
      </div>

      {expanded && (
        <div className="store-products-content">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-btn" 
                  onClick={onClearSearch}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="store-products">
            {loading ? (
              <p className="loading-products"></p>
            ) : products.length > 0 ? (
              <div className="products-list">
                {products.map(listing => {
                  const productName = listing.products?.name || 
                                    listing.product?.name || 
                                    listing.name || 
                                    'Produto sem nome';
                  const productCategory = listing.products?.category || 
                                         listing.product?.category || 
                                         '';
                  const productDescription = listing.products?.description || 
                                            listing.product?.description || 
                                            '';
                  const priceFormatted = (typeof listing.price === 'number') 
                    ? listing.price.toFixed(2) 
                    : '—';

                  // Verificar se é produto próprio da loja
                  const isOwnProduct = listing.products?.store_id === store.id;

                  return (
                    <div 
                      key={listing.id} 
                      className={`product-item ${isOwnProduct ? 'own-product' : ''}`}
                    >
                      <div className="product-info">
                        <h5>
                          {productName}
                        </h5>
                        {productCategory && (
                          <p className="product-category">{productCategory}</p>
                        )}
                        {productDescription && (
                          <p className="product-description">{productDescription}</p>
                        )}
                      </div>
                      <div className="product-details">
                        <div className='product-bottom'>
                          <span className="product-price">R$ {priceFormatted}</span>
                          <span className="product-stock">
                            Estoque: {listing.stock ?? '—'}
                          </span>
                        </div>

                        <div className="product-actions">
                          <button 
                            className="btn-edit-product" 
                            onClick={() => {
                              if (isOwnProduct && onEditOwnProduct) {
                                onEditOwnProduct(listing);
                              } else {
                                onEditProduct(listing);
                              }
                            }}
                            title={isOwnProduct 
                              ? 'Editar produto completo' 
                              : 'Editar apenas preço e estoque'}
                          >
                            Editar
                          </button>
                          {confirmingDelete === listing.id ? (
                            <button
                              className="btn-delete-product"
                              onClick={() => {
                                // Passa o listing com store_id garantido
                                onDeleteProduct({ ...listing, store_id: store.id });
                                setConfirmingDelete(null);
                              }}
                            >
                              Certeza?
                            </button>
                          ) : (
                            <button
                              className="btn-delete-product"
                              onClick={() => setConfirmingDelete(listing.id)}
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-products">
                {searchTerm
                  ? `Nenhum produto encontrado para "${searchTerm}"`
                  : 'Nenhum produto cadastrado nesta loja.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreProductsSection;