// src/lib/services.js
import { supabase } from './supabase'


export const productsService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
      *,
      product_listings!product_listings_product_id_fkey (
        id,
        price,
        stock,
        store_id,
        stores!product_listings_store_id_fkey ( name, is_approved )
      )
    `)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Buscar produto por ID
  async getProduct(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_listings!product_listings_product_id_fkey (
          id,
          price,
          stock,
          store_id,
          stores!product_listings_store_id_fkey ( name, is_approved )
        )
      `)
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Criar novo produto
  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()

    return { data, error }
  },
  async searchProducts(searchTerm, limit = 50) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(limit)

    return { data, error }
  }
}

export const geoService = {
  // Buscar coordenadas por CEP
  async getCoordinatesFromCEP(cep) {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { cep: cep.replace(/\D/g, '') }
      });

      if (error) {
        console.error('Erro da Edge Function:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      return null;
    }
  },

  // Salvar localização do usuário
  async updateUserLocation(userId, cep) {
    console.log('updateUserLocation chamado:', { userId, cep });

    const coords = await this.getCoordinatesFromCEP(cep);
    if (!coords) {
      console.error('Não foi possível obter coordenadas');
      return { error: 'Não foi possível obter as coordenadas' };
    }

    console.log('Coordenadas obtidas:', coords);

    const { data, error } = await supabase.rpc('update_user_location', {
      p_user_id: userId,
      p_longitude: coords.longitude,
      p_latitude: coords.latitude
    });

    console.log('Resultado update location:', error ? error : 'sucesso', data);

    return { error: error?.message, coords, data };
  },

  // Salvar localização da loja usando CEP do endereço
  async updateStoreLocation(storeId, address) {
    console.log('updateStoreLocation chamado:', { storeId, address });

    if (address.zip_code) {
      const coords = await this.getCoordinatesFromCEP(address.zip_code);

      if (!coords) {
        console.error('Não foi possível obter coordenadas');
        return { error: 'Não foi possível obter as coordenadas' };
      }

      console.log('Coordenadas obtidas:', coords);

      const { data, error } = await supabase.rpc('update_store_location', {
        p_store_id: storeId,
        p_longitude: coords.longitude,
        p_latitude: coords.latitude
      });

      console.log('Resultado update location:', error ? error : 'sucesso', data);
      console.log('Data completo:', JSON.stringify(data, null, 2));

      return { error: error?.message, coords, data };
    }

    return { error: 'CEP não fornecido' };
  }
};

// ========================
// Serviços de Listings (produtos de lojas)
// ========================
export const listingsService = {
  // Criar listing
  async createListing(listingData) {
    const { data, error } = await supabase
      .from('product_listings')
      .insert(listingData)
      .select()

    return { data, error }
  },

  // Listar produtos ativos com menor preço (apenas de lojas aprovadas)
  async getActiveListings() {
    const { data, error } = await supabase
      .from('product_listings')
      .select(`
      *,
      products!product_listings_product_id_fkey (
        id,
        name,
        description,
        category,
        subcategory,
        images
      ),
      stores!product_listings_store_id_fkey ( name, is_approved )
    `)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('price', { ascending: true })

    return { data, error }
  },

  // Listar produtos de uma loja específica
  async getStoreListings(storeId) {
    const { data, error } = await supabase
      .from('product_listings')
      .select(`
        *,
        products!product_listings_product_id_fkey (*)
      `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }
}

// ========================
// Serviços de Carrinho
// ========================
export const cartService = {
  // Obter carrinho ativo do usuário
  async getActiveCart(userId) {
    const { data, error } = await supabase
      .from('carts')
      .select(`
      *,
      cart_items!cart_items_cart_id_fkey (
        id,
        quantity,
        product_listing_id,
        product_listings!cart_items_product_listing_id_fkey (
          id,
          price,
          stock,
          store_id,
          products!product_listings_product_id_fkey (
            id,
            name,
            description,
            category,
            images
          ),
          stores!product_listings_store_id_fkey (
            id,
            name
          )
        )
      )
    `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    return { data, error }
  },

  // Criar novo carrinho
  async createCart(userId) {
    const { data, error } = await supabase
      .from('carts')
      .insert({ user_id: userId, status: 'active' })
      .select()

    return { data, error }
  },

  // Adicionar item ao carrinho
  async addToCart(cartId, productListingId, quantity) {
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_listing_id', productListingId)
      .maybeSingle()

    if (existingItem) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()

      return { data, error }
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_listing_id: productListingId,
          quantity
        })
        .select()

      return { data, error }
    }
  },

  // Atualizar quantidade do item
  async updateCartItem(itemId, quantity) {
    if (quantity <= 0) {
      return this.removeCartItem(itemId)
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()

    return { data, error }
  },

  // Remover item do carrinho
  async removeCartItem(itemId) {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    return { data, error }
  },

  // Limpar carrinho
  async clearCart(cartId) {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)

    return { data, error }
  }
}

// ========================
// Serviços de Lojas
// ========================
export const storesService = {
  // Buscar lojas do usuário
  async getUserStores(userId) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return { data, error: error?.message }
  },

  // Buscar lojas aprovadas
  async getApprovedStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    return { data, error: error?.message }
  },

  // Buscar loja por ID
  async getStoreById(storeId) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    return { data, error: error?.message }
  },

  // Buscar loja por slug
  async getStoreBySlug(slug) {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('is_approved', true)

    if (error) return { data: null, error: error?.message }

    const store = stores?.find(s => {
      const storeSlug = s.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      return storeSlug === slug
    })

    return { data: store || null, error: store ? null : 'Loja não encontrada' }
  },

  // Criar nova loja
  async createStore(storeData) {
    const { data, error } = await supabase
      .from('stores')
      .insert([storeData])
      .select()

    return { data, error: error?.message }
  },

  async updateStore(storeId, updates) {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()

    return { data, error: error?.message }
  },

  // Deletar loja
  async deleteStore(storeId) {
    const { data, error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    return { data, error: error?.message }
  },

  // Buscar lojas por categoria
  async getStoresByCategory(category) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('category', category)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    return { data, error: error?.message }
  },

  // Buscar produtos de uma loja
  async getStoreProducts(storeId) {
    const { data, error } = await supabase
      .from('product_listings')
      .select(`
      *,
      products (
        id,
        name,
        description,
        category,
        images
      )
    `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { data, error: error?.message }
  },

  // Atualizar product listing (preço e estoque)
  async updateProductListing(listingId, updateData) {
    const { data, error } = await supabase
      .from('product_listings')
      .update({
        price: updateData.price,
        stock: updateData.stock
      })
      .eq('id', listingId)
      .select()

    return { data, error: error?.message }
  },

  // Deletar product listing
  async deleteProductListing(listingId) {
    const { data, error } = await supabase
      .from('product_listings')
      .delete()
      .eq('id', listingId)

    return { data, error: error?.message }
  },

  // Buscar product listing por ID
  async getProductListing(listingId) {
    const { data, error } = await supabase
      .from('product_listings')
      .select(`
      *,
      products (
        id,
        name,
        description,
        category,
        images
      ),
      stores (
        id,
        name,
        user_id
      )
    `)
      .eq('id', listingId)
      .single()

    return { data, error: error?.message }
  },

  // Ativar/desativar product listing
  async toggleProductListing(listingId, isActive) {
    const { data, error } = await supabase
      .from('product_listings')
      .update({ is_active: isActive })
      .eq('id', listingId)
      .select()

    return { data, error: error?.message }
  },

  // Criar product listing
  async createProductListing(listingData) {

    const { data, error } = await supabase
      .from('product_listings')
      .insert([{
        product_id: listingData.product_id,
        store_id: listingData.store_id,
        price: listingData.price,
        stock: listingData.stock,
        is_active: listingData.is_active ?? true
      }])
      .select(`
      *,
      products (
        id,
        name,
        description,
        category,
        images
      )
    `)

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
    }

    return { data, error: error?.message }
  }
}