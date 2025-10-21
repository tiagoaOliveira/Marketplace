// src/hooks/useSearch.js
import { useEffect, useState, useRef } from 'react';
import { searchService } from '../lib/searchService';

export function useSearch(options = {}) {
  const {
    debounceMs = 300,
    minChars = 2,
    limit = 10,
    autoSearch = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [lojas, setLojas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchBoxRef = useRef(null);

  // Carregar buscas recentes
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved);
  }, []);

  // Debounce para busca automática
  useEffect(() => {
    if (!autoSearch) return;

    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= minChars) {
        performSearch();
      } else {
        setProdutos([]);
        setLojas([]);
        setShowResults(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, autoSearch, minChars, debounceMs]);

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
    if (searchTerm.trim().length < minChars) return;

    setLoading(true);
    setError('');
    setSelectedIndex(-1);

    try {
      const { produtos: produtosData, lojas: lojasData, error: searchError } = 
        await searchService.search(searchTerm, { limit });

      if (searchError) {
        setError(searchError);
      } else {
        setProdutos(produtosData || []);
        setLojas(lojasData || []);
      }

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
    setSelectedIndex(-1);
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
      const selected = selectedIndex < produtos.length 
        ? { type: 'produto', data: produtos[selectedIndex] }
        : { type: 'loja', data: lojas[selectedIndex - produtos.length] };
      return selected;
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const selectItem = (type, item) => {
    setShowResults(false);
    setSearchTerm('');
    return { type, data: item };
  };

  return {
    // Estado
    searchTerm,
    produtos,
    lojas,
    loading,
    error,
    showResults,
    recentSearches,
    selectedIndex,
    
    // Refs
    searchBoxRef,
    
    // Ações
    setSearchTerm,
    setShowResults,
    performSearch,
    handleClear,
    handleSearchClick,
    handleKeyDown,
    selectItem,
    
    // Helpers
    totalResults: produtos.length + lojas.length,
    hasResults: produtos.length + lojas.length > 0
  };
}