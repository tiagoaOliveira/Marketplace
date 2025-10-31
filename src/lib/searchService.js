// src/lib/searchService.js
import { supabase } from './supabase';

export const searchService = {
  /**
   * Busca otimizada para grandes volumes usando Full Text Search
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
      // ✅ CORRIGIDO - Adicionar subcategory E remover do OR
      const { data: produtosData, error: erroProdutos } = await supabase
        .from('products')
        .select(`
        id,
        name,
        description,
        category,
        subcategory,
        images,
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
        .or(`name.ilike.%${termo}%,category.ilike.%${termo}%,description.ilike.%${termo}%`)
        .limit(limit);

      if (produtosData && produtosData.length > 0) {
      }

      // Buscar lojas
      const { data: lojasData, error: erroLojas } = await supabase
        .from('stores')
        .select('id, name, category, description, email, phone')
        .eq('is_approved', true)
        .or(`name.ilike.%${termo}%,category.ilike.%${termo}%`)
        .limit(limit);

      if (erroProdutos) console.error('Erro busca produtos:', erroProdutos);
      if (erroLojas) console.error('Erro busca lojas:', erroLojas);

      let produtos = this._formatarProdutos(produtosData || []);
      let lojas = lojasData || [];

      produtos = produtos.slice(offset, offset + limit);
      lojas = lojas.slice(offset, offset + limit);

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
      const { data, error } = await supabase
        .from('products')
        .select(`
        id,
        name,
        description,
        category,
        subcategory,
        images,
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
        .or(`name.ilike.%${termo}%,category.ilike.%${termo}%,description.ilike.%${termo}%`)
        .limit(limit);

      if (error) throw error;

      let produtos = this._formatarProdutos(data || []);

      if (inStock) {
        produtos = produtos.filter(p => p.emEstoque);
      }

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
        .or(`name.ilike.%${termo}%,category.ilike.%${termo}%`);

      const { data, error } = await query.limit(20);

      if (error) throw error;

      return { lojas: data || [], error: null };
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
      const { data, error } = await supabase
        .from('products')
        .select(`
        id,
        name,
        description,
        category,
        subcategory,
        images,
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
        .ilike('category', `%${category}%`)
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
   * Autocomplete - sugestões enquanto digita
   */
  async getSearchSuggestions(termo, limit = 8) {
    if (!termo || termo.length < 2) {
      return { suggestions: [], error: null };
    }

    try {
      const { data: produtosSugg } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${termo}%`)
        .limit(Math.ceil(limit * 0.7));

      const { data: lojasSugg } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_approved', true)
        .ilike('name', `%${termo}%`)
        .limit(Math.ceil(limit * 0.3));

      const suggestions = [
        ...(produtosSugg || []).map(p => ({
          id: p.id,
          text: p.name,
          type: 'produto'
        })),
        ...(lojasSugg || []).map(l => ({
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

        const listingsAtivos = listings.filter(l =>
          l.is_active && l.stores?.is_approved
        );

        if (listingsAtivos.length === 0) {
          return null;
        }

        const precos = listingsAtivos
          .map(l => l.price)
          .filter(p => p > 0)
          .sort((a, b) => a - b);

        const estoques = listingsAtivos.map(l => l.stock || 0);

        const produtoFormatado = {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          subcategory: p.subcategory,
          images: p.images,  // ✅ CRÍTICO
          precoMinimo: precos[0] || 0,
          precoMaximo: precos[precos.length - 1] || 0,
          emEstoque: estoques.some(e => e > 0),
          totalEstoque: estoques.reduce((a, b) => a + b, 0),
          totalLojas: listingsAtivos.length,
          listings: listingsAtivos
        };

        return produtoFormatado;
      })
      .filter(p => p !== null);
  }
};