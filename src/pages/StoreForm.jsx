import React from 'react';
import { RxArrowLeft } from "react-icons/rx";
import { BusinessHours } from './BusinessHours.jsx';
import './StoreForm.css';


const StoreForm = ({
  formData,
  formErrors,
  isSubmitting,
  categories,
  editingStore,
  creatingStore,
  handleVoltar,
  handleInputChange,
  handleSubmit,
  resetForm,
  handleSaveBusinessHours
}) => {

  const formatCEP = (value) => {
    const onlyNumbers = value.replace(/\D/g, '');      // remove tudo que não é número
    if (onlyNumbers.length <= 5) {
      return onlyNumbers;                              // até 5 dígitos, só números
    }
    return onlyNumbers.replace(/(\d{5})(\d{1,3})/, "$1-$2"); // insere hífen
  };

  const handleCEPChange = (e) => {
    const formatted = formatCEP(e.target.value);

    handleInputChange({
      target: {
        name: "address.zip_code",
        value: formatted
      }
    });
  };

  return (
    <>
      <div className="stores-header">
        <button className="btn-voltar" onClick={handleVoltar}><RxArrowLeft /></button>
        <h1>{editingStore ? 'Editar Loja' : creatingStore ? 'Nova Loja' : 'Minha Loja'}</h1>
      </div>

      <form className="store-form" onSubmit={handleSubmit}>
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        <div className="form-section">
          <div className="form-group-loja">
            <label>Nome da Loja *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome fantasia da loja" />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </div>
          <div className="form-group-loja">
            <label>Razão Social</label>
            <input type="text" name="business_name" value={formData.business_name} onChange={handleInputChange} placeholder="Razão social completa" />
          </div>
          <div className="form-group-loja">
            <label>Categoria *</label>
            <select name="category" value={formData.category} onChange={handleInputChange}>
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {formErrors.category && <span className="field-error">{formErrors.category}</span>}
          </div>
          <div className="form-group-loja">
            <label>Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descreva sua loja e produtos" rows="3" />
          </div>
          <div className="form-group-loja">
            <label>CNPJ</label>
            <input type="text" name="cnpj" value={formData.cnpj} onChange={handleInputChange} placeholder="00.000.000/0001-00" />
            {formErrors.cnpj && <span className="field-error">{formErrors.cnpj}</span>}
          </div>
          <div className="form-group-loja">
            <label>Taxa de Entrega (R$)</label>
            <input 
              type="number" 
              name="shipping_fee" 
              value={formData.shipping_fee || ''} 
              onChange={handleInputChange} 
              placeholder="0.00" 
              step="0.01"
              min="0"
            />
            <small className="field-hint">Deixe vazio ou zero para frete grátis</small>
          </div>
        </div>
        <div className="form-section">
          <h3>Horário de Funcionamento</h3>
          <BusinessHours
            value={formData.business_hours}
            onChange={(newHours) => handleInputChange({ target: { name: 'business_hours', value: newHours } })}
            onSave={handleSaveBusinessHours}
          />
          <h3>Contato</h3>
          <div className="form-group-loja">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="contato@loja.com" />
            {formErrors.email && <span className="field-error">{formErrors.email}</span>}
          </div>
          <div className="form-group-loja">
            <label>Telefone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" />
            {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
          </div>
        </div>
        <div className="form-section">
          <div className="form-group-loja">
            <label>CEP</label>
            <input
              type="text"
              name="address.zip_code"
              value={formData.address.zip_code}
              onChange={handleCEPChange}
              placeholder="00000-000"
              maxLength={9}   // evita ultrapassar 00000-000
            />
          </div>
          <h3>Endereço</h3>
          <div className="form-row">
            <div className="form-group-loja">
              <label>Rua</label>
              <input type="text" name="address.street" value={formData.address.street} onChange={handleInputChange} placeholder="Nome da rua" />
            </div>
            <div className="form-group-loja">
              <label>Número</label>
              <input type="text" name="address.number" value={formData.address.number} onChange={handleInputChange} placeholder="123" />
            </div>
          </div>
          <div className="form-group-loja">
            <label>Complemento</label>
            <input type="text" name="address.complement" value={formData.address.complement} onChange={handleInputChange} placeholder="Sala, andar, etc." />
          </div>
          <div className="form-row">
            <div className="form-group-loja">
              <label>Bairro</label>
              <input type="text" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleInputChange} placeholder="Nome do bairro" />
            </div>
            <div className="form-group-loja">
              <label>Cidade</label>
              <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} placeholder="Nome da cidade" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group-loja">
              <label>Estado</label>
              <input type="text" name="address.state" value={formData.address.state} onChange={handleInputChange} placeholder="SP" maxLength="2" />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : (editingStore ? 'Atualizar' : 'Criar Loja')}
          </button>
        </div>
      </form>
    </>
  );
};

export default StoreForm;