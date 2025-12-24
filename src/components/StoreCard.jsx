// StoreCard.jsx
import React from 'react';
import { LiaEdit } from "react-icons/lia";

const StoreCard = ({ store, onEdit, onVisit }) => {
  return (
    <div className="store-card">
      <div className="store-card-header">
        <div className="store-info">
          <div className="store-details">
            <h3>{store.name}</h3>
            {store.business_name && (
              <p className="business-name">{store.business_name}</p>
            )}
            <p className="category">{store.category}</p>
            <div className="store-status">
              {store.is_approved ? (
                <span className="status approved">✓ Aprovada</span>
              ) : (
                <span className="status pending">⏳ Aguardando aprovação</span>
              )}
            </div>
          </div>
          <div className="store-card-controls">
            <button 
              className="btn btn-sm" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(store);
              }}
            >
              <LiaEdit size={28} />
            </button>
            <div
              className="btn-visit-store"
              onClick={() => onVisit(store.name)}
            >
              Visitar Loja
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;