// src/hooks/useCatalogSearch.js
import { useEffect, useState, useRef } from 'react';
import { searchService } from '../lib/searchService';

export function useCatalogSearch(options = {}) {
  const {
    debounceMs = 300,
    minChars = 2,
    limit = 20,
    autoSearch = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce para busca automática
  useEffect(() => {
    if (!autoSearch) return;

    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= minChars) {
        performSearch();
      } else {
        setProdutos([]);
        setShowResults(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, autoSearch, minChars, debounceMs]);

  const performSearch = async () => {
    if (searchTerm.trim().length < minChars) return;

    setLoading(true);
    setError('');
    setSelectedIndex(-1);

    try {
      const { produtos: produtosData, error: searchError } = 
        await searchService.searchCatalog(searchTerm, { limit });

      if (searchError) {
        setError(searchError);
      } else {
        setProdutos(produtosData || []);
      }

      setShowResults(true);
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
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const total = produtos.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      return produtos[selectedIndex];
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return {
    // Estado
    searchTerm,
    produtos,
    loading,
    error,
    showResults,
    selectedIndex,
    
    // Ações
    setSearchTerm,
    setShowResults,
    performSearch,
    handleClear,
    handleKeyDown,
    
    // Helpers
    totalResults: produtos.length,
    hasResults: produtos.length > 0
  };
}