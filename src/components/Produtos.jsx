import React, { useState, useEffect } from 'react';
import { listingsService, cartService } from '../lib/services';
import { auth } from '../lib/supabase';
import './produtos.css';

const ProdutosShowcase = ({ categoriaFiltro }) => {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [quantidades, setQuantidades] = useState({});

  useEffect(() => {
    const initialize = async () => {
      try {
        // Carregar usuário
        const currentUser = await auth.getUser();
        setUser(currentUser);

        // Carregar produtos
        await carregarProdutos();
        
        if (currentUser) {
          await carregarQuantidadesCarrinho(currentUser.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Efeito para filtrar produtos quando a categoria muda
  useEffect(() => {
    filtrarProdutos();
  }, [produtos, categoriaFiltro]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await listingsService.getActiveListings();
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

      // Agrupar por produto (pegar menor preço)
      const produtosMap = {};
      data.forEach(listing => {
        const productId = listing.products.id;
        if (!produtosMap[productId] || listing.price < produtosMap[productId].price) {
          produtosMap[productId] = {
            id: listing.id, // ID do listing
            productId: productId,
            nome: listing.products.name,
            preco: parseFloat(listing.price),
            stock: listing.stock,
            categoria: listing.products.category,
            subcategoria: listing.products.subcategory,
            imagem: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center`
          };
        }
      });

      const produtosArray = Object.values(produtosMap);
      setProdutos(produtosArray);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const filtrarProdutos = () => {
    let produtosFiltrados = [...produtos];

    // Aplicar filtro de categoria se existe
    if (categoriaFiltro) {
      produtosFiltrados = produtos.filter(produto => 
        produto.categoria === categoriaFiltro || 
        produto.subcategoria === categoriaFiltro
      );
    }

    // Se não há filtro, mostrar no máximo 30 produtos aleatórios
    if (!categoriaFiltro && produtosFiltrados.length > 30) {
      // Embaralhar array e pegar os primeiros 30
      const shuffled = [...produtosFiltrados].sort(() => 0.5 - Math.random());
      produtosFiltrados = shuffled.slice(0, 30);
    }

    setProdutosFiltrados(produtosFiltrados);
  };

  const carregarQuantidadesCarrinho = async (userId) => {
    try {
      const { data: cart, error } = await cartService.getActiveCart(userId);
      
      if (error && error.code !== 'PGRST116') return;

      if (cart && cart.cart_items) {
        const qtds = {};
        cart.cart_items.forEach(item => {
          qtds[item.product_listing_id] = item.quantity;
        });
        setQuantidades(qtds);
      }
    } catch (error) {
      console.error('Erro ao carregar quantidades:', error);
    }
  };

  const adicionarAoCarrinho = async (listing) => {
    if (!user) {
      alert('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      // Verificar se existe carrinho ativo
      let { data: cart, error } = await cartService.getActiveCart(user.id);
      
      if (error || !cart) {
        // Criar novo carrinho se não existir
        const { data: newCart, error: createError } = await cartService.createCart(user.id);
        if (createError) {
          console.error('Erro ao criar carrinho:', createError);
          return;
        }
        cart = newCart[0];
      }

      // Adicionar item ao carrinho
      const { error: addError } = await cartService.addToCart(
        cart.id,
        listing.id,
        1,
        listing.preco
      );

      if (addError) {
        console.error('Erro ao adicionar ao carrinho:', addError);
        return;
      }

      // Atualizar quantidade local
      setQuantidades(prev => ({
        ...prev,
        [listing.id]: (prev[listing.id] || 0) + 1
      }));

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };

  const removerDoCarrinho = async (listing) => {
    if (!user) return;

    try {
      const { data: cart } = await cartService.getActiveCart(user.id);
      if (!cart || !cart.cart_items) return;

      const item = cart.cart_items.find(item => 
        item.product_listing_id === listing.id
      );

      if (!item) return;

      const novaQuantidade = item.quantity - 1;
      const { error: updateError } = await cartService.updateCartItem(
        item.id,
        novaQuantidade
      );

      if (updateError) {
        console.error('Erro ao remover do carrinho:', updateError);
        return;
      }

      // Atualizar quantidade local
      setQuantidades(prev => ({
        ...prev,
        [listing.id]: Math.max(0, (prev[listing.id] || 0) - 1)
      }));

    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
    }
  };

  if (loading) {
    return (
      <div className="produtos-container">
        <p>Carregando produtos...</p>
      </div>
    );
  }

  if (produtosFiltrados.length === 0) {
    return (
      <div className="produtos-container">
        <div className="produtos-vazio">
          <p>
            {categoriaFiltro 
              ? `Nenhum produto encontrado na categoria "${categoriaFiltro}"` 
              : 'Nenhum produto disponível'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="produtos-container">      
      <div className="produtos-grid">
        {produtosFiltrados.map(produto => (
          <div key={produto.id} className="produto-card">
            <img 
              src={produto.imagem} 
              alt={produto.nome}
              className="produto-imagem"
            />
            <h3 className="produto-nome">{produto.nome}</h3>
            <p className="produto-preco">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </p>
            
            <div className="produto-controles">
              <button 
                className="btn-carrinho btn-menos"
                onClick={() => removerDoCarrinho(produto)}
                disabled={!quantidades[produto.id] || quantidades[produto.id] === 0}
              >
                -
              </button>
              
              <span className="quantidade-produto">
                {quantidades[produto.id] || 0}
              </span>
              
              <button 
                className="btn-carrinho btn-mais"
                onClick={() => adicionarAoCarrinho(produto)}
                disabled={produto.stock === 0 || (quantidades[produto.id] >= produto.stock)}
              >
                +
              </button>
            </div>

            {produto.stock === 0 && (
              <p className="produto-sem-estoque">Sem estoque</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProdutosShowcase;