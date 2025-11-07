import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ProductModalComponent = ({ produto, onClose, onStoreClick, showControls, renderControls }) => {
  const [imagemAtual, setImagemAtual] = useState(0);

  useEffect(() => {
    setImagemAtual(0);
  }, [produto?.id]);

  if (!produto) return null;

  const imagens = (produto.images && produto.images.length > 0) 
    ? produto.images 
    : [produto.imagem];
  
  const temMultiplasImagens = imagens.length > 1;

  const proximaImagem = () => {
    setImagemAtual((prev) => (prev + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-products" onClick={(e) => e.stopPropagation()}>
        <button className="modal-fechar" onClick={onClose}>×</button>

        <div className="modal-body">
          <div className="modal-imagem">
            <img
              src={imagens[imagemAtual]}
              alt={`${produto.nome} - ${imagemAtual + 1}`}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Sem imagem</text></svg>';
              }}
            />
            
            {temMultiplasImagens && (
              <>
                <button 
                  className="modal-img-nav modal-img-prev" 
                  onClick={(e) => {
                    e.stopPropagation();
                    imagemAnterior();
                  }}
                >
                  ‹
                </button>
                <button 
                  className="modal-img-nav modal-img-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    proximaImagem();
                  }}
                >
                  ›
                </button>
                <div className="modal-img-indicators">
                  {imagens.map((_, index) => (
                    <button
                      key={index}
                      className={`modal-img-dot ${index === imagemAtual ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagemAtual(index);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="modal-info">
            <h2 className="modal-titulo">{produto.nome}</h2>

            <p className="modal-descricao">
              {produto.descricao || 'Descrição não disponível'}
            </p>
            <p className="modal-loja">
              Vendido por: <strong
                onClick={() => {
                  if (onStoreClick) {
                    onStoreClick(produto.loja || produto.storeName);
                    onClose();
                  }
                }}
              >
                {produto.loja || produto.storeName}
              </strong>
            </p>

            <p className="modal-preco">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </p>

            {showControls && renderControls && (
              <div className="modal-controles">
                {renderControls(produto)}
              </div>
            )}

            {produto.stock === 0 && (
              <p className="produto-sem-estoque">Sem estoque</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export const useProductModal = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    if (modalAberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [modalAberto]);

  const abrirModal = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
  };

  const ProductModal = (props) => {
    if (!modalAberto || !produtoSelecionado) return null;
    
    return (
      <ProductModalComponent
        produto={produtoSelecionado}
        onClose={fecharModal}
        {...props}
      />
    );
  };

  return {
    modalAberto,
    produtoSelecionado,
    abrirModal,
    fecharModal,
    ProductModal
  };
};