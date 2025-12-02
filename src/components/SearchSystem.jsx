// SearchSystem.jsx - SIMPLIFICADO
import { Search, X, Loader } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useProductModalContext } from '../contexts/ProductModalContext';
import { listingsService } from '../lib/services';
import './SearchSystem.css';

function SearchSystem({ onStoreSelect }) {
  const { abrirModalProduto } = useProductModalContext();
  const {
    searchTerm,
    produtos,
    lojas,
    loading,
    error,
    showResults,
    recentSearches,
    selectedIndex,
    searchBoxRef,
    setSearchTerm,
    setShowResults,
    handleClear,
    handleSearchClick,
    handleKeyDown,
    selectItem,
    totalResults,
    hasResults
  } = useSearch({ limit: 10 });

  const handleProductClick = async (produto) => {
    selectItem('produto', produto);
    
    try {
      const { data: listings } = await listingsService.getActiveListings();
      const produtoListings = listings?.filter(l => l.products.id === produto.id) || [];
      
      if (produtoListings.length === 0) {
        alert('Produto não disponível');
        return;
      }
      
      const listingMenorPreco = produtoListings.reduce((min, curr) => 
        parseFloat(curr.price) < parseFloat(min.price) ? curr : min
      );
      
      abrirModalProduto({
        id: listingMenorPreco.id,
        productListingId: listingMenorPreco.id,
        nome: produto.name,
        preco: parseFloat(listingMenorPreco.price),
        stock: listingMenorPreco.stock,
        loja: listingMenorPreco.stores.name,
        imagem: produto.images?.[0],
        images: produto.images || []
      }, {
        showControls: true,
        onStoreClick: onStoreSelect
      });
      
    } catch (err) {
      console.error('Erro ao carregar produto:', err);
    }
  };

  const handleStoreClick = (loja) => {
    selectItem('loja', loja);
    onStoreSelect?.(loja);
  };

  const onKeyDown = (e) => {
    const selected = handleKeyDown(e);
    if (selected) {
      selected.type === 'produto' ? handleProductClick(selected.data) : handleStoreClick(selected.data);
    }
  };

  return (
    <div className="search-system">
      <div className="search-container" ref={searchBoxRef}>
        <div className="search-input-wrapper">
          {!searchTerm && <Search className="search-icon" size={20} />}
          <input
            type="text"
            placeholder="Encontre produtos ou lojas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowResults(true)}
            onKeyDown={onKeyDown}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClear} className="clear-btn">
              <X size={18} />
            </button>
          )}
        </div>

        {showResults && (
          <div className="search-results-panel">
            {loading && (
              <div className="loading-state">
                <Loader size={20} className="spinner" />
                <span>Buscando...</span>
              </div>
            )}

            {error && !loading && <div className="error-state"><p>{error}</p></div>}

            {!loading && !hasResults && searchTerm.trim().length >= 2 && (
              <div className="empty-state">
                <Search size={32} />
                <p>Nenhum resultado encontrado para "{searchTerm}"</p>
              </div>
            )}

            {!loading && hasResults && (
              <>
                {produtos.length > 0 && (
                  <div className="results-section">
                    <h4 className="results-title">Produtos ({produtos.length})</h4>
                    <ul className="results-list">
                      {produtos.map((p, idx) => (
                        <li 
                          key={p.id} 
                          className={`result-item ${selectedIndex === idx ? 'selected' : ''}`}
                          onClick={() => handleProductClick(p)}
                        >
                          <div className="result-content">
                            <span className="result-name">{p.name}</span>
                            {p.precoMinimo > 0 && (
                              <span className="result-price">
                                R$ {p.precoMinimo.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lojas.length > 0 && (
                  <div className="results-section">
                    <h4 className="results-title">Lojas ({lojas.length})</h4>
                    <ul className="results-list">
                      {lojas.map((l, idx) => (
                        <li 
                          key={l.id} 
                          className={`result-item ${selectedIndex === produtos.length + idx ? 'selected' : ''}`}
                          onClick={() => handleStoreClick(l)}
                        >
                          <div className="result-content">
                            <span className="result-name">{l.name}</span>
                            <span className="result-category">{l.category}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="results-footer">
                  <p className="results-count">
                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}

            {!searchTerm && recentSearches.length > 0 && (
              <div className="recent-searches">
                <h4 className="results-title">Buscas Recentes</h4>
                <ul className="results-list">
                  {recentSearches.map((term, idx) => (
                    <li key={idx} className="recent-item">
                      <Search size={16} />
                      <button onClick={() => handleSearchClick(term)} className="recent-btn">
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchSystem;