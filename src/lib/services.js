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
          vendor_id,
          users!product_listings_vendor_id_fkey ( fullname )
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
          vendor_id,
          users!product_listings_vendor_id_fkey ( fullname )
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
// Serviços de Listings (produtos de vendedores)
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

  // Listar produtos ativos com menor preço
  async getActiveListings() {
    const { data, error } = await supabase
      .from('product_listings')
      .select(`
        *,
        products!product_listings_product_id_fkey (*),
        users!product_listings_vendor_id_fkey ( fullname )
      `)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('price', { ascending: true })
    
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
          price_snapshot,
          product_listings!cart_items_product_listing_id_fkey (
            id,
            price,
            stock,
            products!product_listings_product_id_fkey (
              id,
              name,
              category
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
  async addToCart(cartId, productListingId, quantity, priceSnapshot) {
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
          quantity,
          price_snapshot: priceSnapshot
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