// src/lib/searchService.js
import { supabase } from './supabase';

export const searchService = {
  /**
   * Busca combinada de produtos e lojas com consultas reais
   * @param {string} termo - Termo de busca
   * @param {object} options - Opções de filtro
   * @returns {object} { produtos, lojas, error }
   */
  async search(termo, options = {}) {
    const { limit = 10, offset = 0 } = options;

    if (!termo || termo.trim().length < 2) {
      return { 
        produtos: [], 
        lojas: [], 
        error: 'Termo deve ter no mínimo 2 caracteres' 
      };
    }

    try {
      const searchPattern = `%${termo}%`;

      // Busca de PRODUTOS diretos
      const produtosPromise = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          product_listings (
            id,
            price,
            stock,
            is_active,
            store_id,
            stores (
              id,
              name,
              is_approved
            )
          )
        `)
        .ilike('name', searchPattern);

      // Busca de LOJAS aprovadas
      const lojasPromise = supabase
        .from('stores')
        .select('id, name, category, description, email, phone')
        .eq('is_approved', true)
        .ilike('name', searchPattern);

      // Executar ambas em paralelo
      const [produtosResult, lojasResult] = await Promise.all([
        produtosPromise,
        lojasPromise
      ]);

      if (produtosResult.error) {
        console.error('Erro busca produtos:', produtosResult.error);
      }

      if (lojasResult.error) {
        console.error('Erro busca lojas:', lojasResult.error);
      }

      // Formatar resultados
      let produtos = this._formatarProdutos(produtosResult.data || []);
      let lojas = lojasResult.data || [];

      // Aplicar paginação
      produtos = produtos.slice(offset, offset + limit);
      lojas = lojas.slice(offset, offset + limit);

      // Filtrar apenas lojas de produtos que encontramos
      const lojasFiltered = lojas.filter(loja => 
        !produtos.some(p => p.name.toLowerCase() === loja.name.toLowerCase())
      );

      return {
        produtos,
        lojas: lojasFiltered,
        total: produtos.length + lojasFiltered.length,
        error: null
      };
    } catch (error) {
      console.error('Erro geral na busca:', error);
      return {
        produtos: [],
        lojas: [],
        error: 'Erro ao realizar busca'
      };
    }
  },

  /**
   * Busca apenas produtos por nome (mais específica)
   */
  async searchProducts(termo, filters = {}) {
    const { limit = 20, minPrice = null, maxPrice = null, inStock = false } = filters;

    if (!termo || termo.trim().length < 2) {
      return { produtos: [], error: null };
    }

    try {
      const searchPattern = `%${termo}%`;

      const result = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          subcategory,
          created_at,
          product_listings (
            id,
            price,
            stock,
            is_active,
            stores (
              id,
              name,
              is_approved
            )
          )
        `)
        .ilike('name', searchPattern);

      if (result.error) {
        console.error('Erro:', result.error);
        throw result.error;
      }

      let produtos = this._formatarProdutos(result.data || []);

      // Filtrar por estoque
      if (inStock) {
        produtos = produtos.filter(p => p.emEstoque);
      }

      // Filtrar por preço
      if (minPrice || maxPrice) {
        produtos = produtos.filter(p => {
          if (minPrice && p.precoMinimo > 0 && p.precoMinimo < minPrice) return false;
          if (maxPrice && p.precoMinimo > maxPrice) return false;
          return true;
        });
      }

      return { produtos: produtos.slice(0, limit), error: null };
    } catch (error) {
      console.error('Erro busca produtos:', error);
      return { produtos: [], error: 'Erro ao buscar produtos' };
    }
  },

  /**
   * Busca apenas lojas
   */
  async searchStores(termo, category = null) {
    if (!termo || termo.trim().length < 2) {
      return { lojas: [], error: null };
    }

    try {
      let query = supabase
        .from('stores')
        .select('id, name, category, description, email, phone, is_approved')
        .eq('is_approved', true)
        .ilike('name', `%${termo}%`);

      const result = await query;

      if (result.error) throw result.error;

      return { lojas: result.data || [], error: null };
    } catch (error) {
      console.error('Erro busca lojas:', error);
      return { lojas: [], error: 'Erro ao buscar lojas' };
    }
  },

  /**
   * Busca por categoria específica
   */
  async searchByCategory(category, limit = 20) {
    try {
      const result = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          product_listings (
            price,
            stock,
            is_active,
            stores (
              id,
              name,
              is_approved
            )
          )
        `)
        .ilike('category', `%${category}%`);

      if (result.error) throw result.error;

      return {
        produtos: this._formatarProdutos(result.data || []).slice(0, limit),
        error: null
      };
    } catch (error) {
      console.error('Erro busca por categoria:', error);
      return { produtos: [], error: 'Erro ao buscar por categoria' };
    }
  },

  /**
   * Autocomplete - sugestões enquanto digita
   */
  async getSearchSuggestions(termo, limit = 8) {
    if (!termo || termo.length < 2) {
      return { suggestions: [], error: null };
    }

    try {
      const searchPattern = `%${termo}%`;

      // Buscar nomes de produtos
      const produtoResult = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', searchPattern)
        .limit(Math.ceil(limit * 0.7));

      // Buscar nomes de lojas
      const lojaResult = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_approved', true)
        .ilike('name', searchPattern)
        .limit(Math.ceil(limit * 0.3));

      const suggestions = [
        ...(produtoResult.data || []).map(p => ({
          id: p.id,
          text: p.name,
          type: 'produto'
        })),
        ...(lojaResult.data || []).map(l => ({
          id: l.id,
          text: l.name,
          type: 'loja'
        }))
      ];

      return {
        suggestions: suggestions.slice(0, limit),
        error: null
      };
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      return { suggestions: [], error: null };
    }
  },

  /**
   * Formatar dados de produtos com informações de preço e estoque
   */
  _formatarProdutos(produtos) {
    return produtos
      .map(p => {
        const listings = p.product_listings || [];
        
        // Filtrar apenas listings de lojas aprovadas e ativas
        const listingsAtivos = listings.filter(l => 
          l.is_active && l.stores?.is_approved
        );

        if (listingsAtivos.length === 0) {
          return null; // Descartar produtos sem listings ativos
        }

        const precos = listingsAtivos
          .map(l => l.price)
          .filter(p => p > 0)
          .sort((a, b) => a - b);
        
        const estoques = listingsAtivos.map(l => l.stock || 0);

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          subcategory: p.subcategory,
          precoMinimo: precos[0] || 0,
          precoMaximo: precos[precos.length - 1] || 0,
          emEstoque: estoques.some(e => e > 0),
          totalEstoque: estoques.reduce((a, b) => a + b, 0),
          totalLojas: listingsAtivos.length,
          listings: listingsAtivos
        };
      })
      .filter(p => p !== null); // Remover produtos sem listings
  }
};