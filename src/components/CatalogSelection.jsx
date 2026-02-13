import React from 'react';
import { X, Plus } from 'lucide-react';

const CatalogSection = ({
  store,
  expanded,
  onToggle,
  catalogProducts,
  loading,
  searchTerm,
  onSearchChange,
  onClearSearch,
  storeProducts,
  onAddProduct,
  onCreateProduct // Nova prop
}) => {
  return (
    <div className="store-products-container">
      <div
        className="store-products-header catalog-header"
        onClick={() => onToggle(store)}
      >
        <h3 className="store-products-title">Adicionar Produtos</h3>
        <button
          className={`products-expand-btn ${expanded ? 'expanded' : ''}`}
          type="button"
        >
          ▼
        </button>
      </div>

      {expanded && (
        <div className="store-products-content">
          {/* Botão criar produto */}
          <button
            className="btn-create-own-product"
            onClick={(e) => {
              e.stopPropagation();
              onCreateProduct();
            }}
          >
            <Plus size={20} />
            Criar Meu Próprio Produto
          </button>

          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar produtos existentes..."
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
            ) : catalogProducts.length > 0 ? (
              <>
                {searchTerm && (
                  <p className="search-results-count">
                    {catalogProducts.length} produto{catalogProducts.length !== 1 ? 's' : ''} encontrado{catalogProducts.length !== 1 ? 's' : ''}
                  </p>
                )}
                <div className="products-list">
                  {catalogProducts.map(product => {
                    const existingListing = storeProducts.find(
                      listing => (listing.products?.id === product.id ||
                        listing.product_id === product.id)
                    );
                    const alreadyAdded = existingListing &&
                      existingListing.is_active !== false;
                    const canReactivate = existingListing &&
                      existingListing.is_active === false;

                    return (
                      <div
                        key={product.id}
                        className={`product-item ${canReactivate ? 'inactive-product' : ''}`}
                      >
                        <div className="product-info">
                          <h5>
                            {product.name}
                            {canReactivate && (
                              <span className="inactive-badge">⚠️ Desativado</span>
                            )}
                          </h5>
                          {product.category && (
                            <p className="product-category">{product.subcategory}</p>
                          )}
                          {product.description && (
                            <p className="product-description">{product.description}</p>
                          )}
                          {canReactivate && (
                            <p className="reactivate-hint">
                              Este produto foi removido da sua loja. Clique em "Reativar"
                              para adicioná-lo novamente.
                            </p>
                          )}
                        </div>
                        <div className="product-details">
                          {alreadyAdded ? (
                            <span className="product-status">✓ Ativo na loja</span>
                          ) : canReactivate ? (
                            <button
                              className="btn-reactivate-product"
                              onClick={() => onAddProduct(product)}
                            >
                              🔄 Reativar Produto
                            </button>
                          ) : (
                            <button
                              className="btn-add-product"
                              onClick={() => onAddProduct(product)}
                            >
                              + Adicionar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : searchTerm ? (
              <p className="no-products">
                Nenhum produto encontrado para "{searchTerm}"
              </p>
            ) : (
              <p className="no-products">Pesquise para adicionar produtos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogSection;