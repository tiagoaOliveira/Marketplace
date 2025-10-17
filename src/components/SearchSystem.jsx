import { useEffect, useState, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import './SearchSystem.css';

function SearchSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchBoxRef = useRef(null);

  // Carregar buscas recentes do localStorage (simulado com state)
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved);
  }, []);

  // Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setProdutos([]);
        setLojas([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setSelectedIndex(-1);

    try {
      // Simular busca - substituir pela sua API real
      await new Promise(r => setTimeout(r, 500));
      
      // Dados simulados
      setProdutos([
        { id: 1, name: 'Smartphone ' + searchTerm, category: 'Eletrônicos' },
        { id: 2, name: 'Case ' + searchTerm, category: 'Acessórios' },
      ]);
      
      setLojas([
        { id: 1, name: 'Loja ' + searchTerm, category: 'Eletrônicos' },
      ]);

      setShowResults(true);

      // Salvar busca recente
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      sessionStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (err) {
      setError('Erro ao buscar. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setProdutos([]);
    setLojas([]);
    setShowResults(false);
  };

  const handleSearchClick = (term) => {
    setSearchTerm(term);
  };

  const handleKeyDown = (e) => {
    const total = produtos.length + lojas.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      // Lógica para selecionar item
    }
  };

  const totalResults = produtos.length + lojas.length;
  const hasResults = totalResults > 0;

  return (
    <div className="search-system">
      <div className="search-container" ref={searchBoxRef}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos ou lojas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => showResults && setShowResults(true)}
            onKeyDown={handleKeyDown}
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

            {error && (
              <div className="error-state">
                <p>{error}</p>
              </div>
            )}

            {!loading && !hasResults && searchTerm.trim() && (
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
                      {produtos.map((p) => (
                        <li key={p.id} className="result-item">
                          <div className="result-content">
                            <span className="result-name">{p.name}</span>
                            <span className="result-category">{p.category}</span>
                          </div>
                          <span className="result-badge">Produto</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lojas.length > 0 && (
                  <div className="results-section">
                    <h4 className="results-title">Lojas ({lojas.length})</h4>
                    <ul className="results-list">
                      {lojas.map((l) => (
                        <li key={l.id} className="result-item">
                          <div className="result-content">
                            <span className="result-name">{l.name}</span>
                            <span className="result-category">{l.category}</span>
                          </div>
                          <span className="result-badge store">Loja</span>
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
                      <button
                        onClick={() => handleSearchClick(term)}
                        className="recent-btn"
                      >
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