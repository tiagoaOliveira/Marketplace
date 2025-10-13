// src/lib/services.js
import { supabase } from './supabase'

// ========================
// Serviços de Produtos
// ========================
export const productsService = {
  // Listar todos os produtos ativos
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
  }
}

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
        products!product_listings_product_id_fkey (*),
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
            category
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

  // Atualizar loja
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
          category
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
          category
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
    console.log('Dados sendo enviados:', listingData);

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
          category
        )
      `)

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
    }

    return { data, error: error?.message }
  }
}