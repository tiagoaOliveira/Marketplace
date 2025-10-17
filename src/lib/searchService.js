// src/lib/searchService.js
import { supabase } from './supabase';

export const searchService = {
  /**
   * Busca combinada de produtos e lojas
   * @param {string} termo - Termo de busca
   * @param {object} options - Opções de filtro
   * @returns {object} { produtos, lojas, error }
   */
  async search(termo, options = {}) {
    const {
      limit = 10,
      offset = 0,
      category = null,
      storeId = null
    } = options;

    if (!termo || termo.trim().length < 2) {
      return { produtos: [], lojas: [], error: 'Termo deve ter no mínimo 2 caracteres' };
    }

    try {
      const searchPattern = `%${termo}%`;

      // Busca de produtos em paralelo
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
            store_id,
            stores (
              id,
              name,
              is_approved
            )
          )
        `)
        .ilike('name', searchPattern)
        .limit(limit)
        .offset(offset);

      // Busca de lojas em paralelo
      const lojasPromise = supabase
        .from('stores')
        .select('id, name, category, description, email, phone')
        .eq('is_approved', true)
        .ilike('name', searchPattern)
        .limit(limit)
        .offset(offset);

      const [produtosResult, lojasResult] = await Promise.all([
        produtosPromise,
        lojasPromise
      ]);

      if (produtosResult.error) console.error('Erro produtos:', produtosResult.error);
      if (lojasResult.error) console.error('Erro lojas:', lojasResult.error);

      // Formatar e filtrar resultados
      const produtos = this._formatarProdutos(produtosResult.data || []);
      const lojas = lojasResult.data || [];

      return {
        produtos,
        lojas,
        total: produtos.length + lojas.length,
        error: null
      };
    } catch (error) {
      console.error('Erro na busca:', error);
      return {
        produtos: [],
        lojas: [],
        error: 'Erro ao realizar busca'
      };
    }
  },

  /**
   * Busca avançada com filtros
   */
  async searchAdvanced(termo, filters = {}) {
    const {
      category = null,
      minPrice = null,
      maxPrice = null,
      inStock = false,
      limit = 20
    } = filters;

    try {
      let query = supabase
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
            stores (
              id,
              name,
              is_approved
            )
          )
        `)
        .ilike('name', `%${termo}%`);

      // Aplicar filtros
      if (category) {
        query = query.eq('category', category);
      }

      const result = await query.limit(limit);

      if (result.error) throw result.error;

      // Pós-processar resultados
      let produtos = this._formatarProdutos(result.data || []);

      if (minPrice || maxPrice) {
        produtos = produtos.filter(p => {
          const precoMinimo = p.precoMinimo;
          if (minPrice && precoMinimo < minPrice) return false;
          if (maxPrice && precoMinimo > maxPrice) return false;
          return true;
        });
      }

      if (inStock) {
        produtos = produtos.filter(p => p.emEstoque);
      }

      return { produtos, error: null };
    } catch (error) {
      console.error('Erro busca avançada:', error);
      return { produtos: [], error: 'Erro ao realizar busca avançada' };
    }
  },

  /**
   * Busca por categoria
   */
  async searchByCategory(category, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          product_listings (
            price,
            stock,
            stores (name, is_approved)
          )
        `)
        .eq('category', category)
        .limit(limit);

      if (error) throw error;

      return {
        produtos: this._formatarProdutos(data || []),
        error: null
      };
    } catch (error) {
      console.error('Erro busca por categoria:', error);
      return { produtos: [], error: 'Erro ao buscar por categoria' };
    }
  },

  /**
   * Busca de lojas por nome ou categoria
   */
  async searchStores(termo, category = null) {
    try {
      let query = supabase
        .from('stores')
        .select('id, name, category, description, email, phone, is_approved')
        .eq('is_approved', true);

      if (termo) {
        query = query.ilike('name', `%${termo}%`);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      return { lojas: data || [], error: null };
    } catch (error) {
      console.error('Erro busca lojas:', error);
      return { lojas: [], error: 'Erro ao buscar lojas' };
    }
  },

  /**
   * Busca com sugestões (autocomplete)
   */
  async getSearchSuggestions(termo, limit = 8) {
    try {
      if (!termo || termo.length < 2) {
        return { suggestions: [], error: null };
      }

      // Buscar nomes únicos de produtos
      const { data: produtosSugg } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${termo}%`)
        .limit(limit);

      // Buscar nomes de lojas
      const { data: lojasSugg } = await supabase
        .from('stores')
        .select('name')
        .eq('is_approved', true)
        .ilike('name', `%${termo}%`)
        .limit(Math.ceil(limit / 2));

      const suggestions = [
        ...(produtosSugg || []).map(p => ({
          text: p.name,
          type: 'produto'
        })),
        ...(lojasSugg || []).map(l => ({
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
      return { suggestions: [], error: 'Erro ao obter sugestões' };
    }
  },

  /**
   * Formatar dados de produtos com informações de preço
   */
  _formatarProdutos(produtos) {
    return produtos.map(p => {
      const listings = p.product_listings || [];
      const listingsAtivos = listings.filter(l => 
        l.stores?.is_approved
      );

      const precos = listingsAtivos.map(l => l.price).sort((a, b) => a - b);
      const estoques = listingsAtivos.map(l => l.stock);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        precoMinimo: precos[0] || 0,
        precoMaximo: precos[precos.length - 1] || 0,
        emEstoque: estoques.some(e => e > 0),
        totalEstoque: estoques.reduce((a, b) => a + b, 0),
        lojas: listingsAtivos.length,
        precos: precos
      };
    });
  }
};