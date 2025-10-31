// hooks/useProductModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const useProductModal = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // Bloquear scroll quando modal abrir
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

  const ProductModal = ({ onStoreClick, showControls = false, renderControls }) => {
    if (!modalAberto || !produtoSelecionado) return null;
    
    const modalContent = (
      <div className="modal-overlay" onClick={fecharModal}>
        <div className="modal-content-products" onClick={(e) => e.stopPropagation()}>
          <button className="modal-fechar" onClick={fecharModal}>×</button>

          <div className="modal-body">
            <div className="modal-imagem">
              <img
                src={produtoSelecionado.imagem || produtoSelecionado.images?.[0]}
                alt={produtoSelecionado.nome}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Sem imagem</text></svg>';
                }}
              />
            </div>

            <div className="modal-info">
              <h2 className="modal-titulo">{produtoSelecionado.nome}</h2>

              <p className="modal-descricao">
                {produtoSelecionado.descricao || 'Descrição não disponível'}
              </p>
              <p className="modal-loja">
                Vendido por: <strong
                  onClick={() => {
                    if (onStoreClick) {
                      onStoreClick(produtoSelecionado.loja || produtoSelecionado.storeName);
                      fecharModal();
                    }
                  }}
                >
                  {produtoSelecionado.loja || produtoSelecionado.storeName}
                </strong>
              </p>

              <p className="modal-preco">
                R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
              </p>


              {showControls && renderControls && (
                <div className="modal-controles">
                  {renderControls(produtoSelecionado)}
                </div>
              )}

              {produtoSelecionado.stock === 0 && (
                <p className="produto-sem-estoque">Sem estoque</p>
              )}

            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  };

  return {
    modalAberto,
    produtoSelecionado,
    abrirModal,
    fecharModal,
    ProductModal
  };
};