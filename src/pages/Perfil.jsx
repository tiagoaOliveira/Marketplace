import React, { useState } from 'react';
import './Perfil.css';

const PerfilUsuario = () => {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('menu'); // menu, cadastro, login, dados, loja

  const handleVoltar = () => {
    if (telaAtiva === 'menu') {
      window.history.back();
    } else {
      setTelaAtiva('menu');
    }
  };

  const handleLogin = () => {
    setUsuarioLogado(true);
    setTelaAtiva('menu');
  };

  const handleLogout = () => {
    setUsuarioLogado(false);
    setTelaAtiva('menu');
  };

  const renderMenu = () => (
    <div className="conta-menu">
      {!usuarioLogado ? (
        <>
          <div className="conta-opcao" onClick={() => setTelaAtiva('login')}>
            <span className="opcao-icone">🔑</span>
            <div>
              <h3>Entrar</h3>
              <p>Acesse sua conta</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={() => setTelaAtiva('cadastro')}>
            <span className="opcao-icone">👤</span>
            <div>
              <h3>Cadastrar</h3>
              <p>Crie sua conta</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="conta-opcao" onClick={() => setTelaAtiva('dados')}>
            <span className="opcao-icone">⚙️</span>
            <div>
              <h3>Meus Dados</h3>
              <p>Edite suas informações</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={() => setTelaAtiva('loja')}>
            <span className="opcao-icone">🏪</span>
            <div>
              <h3>Criar Loja</h3>
              <p>Venda seus produtos</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={handleLogout}>
            <span className="opcao-icone">🚪</span>
            <div>
              <h3>Sair</h3>
              <p>Fazer logout</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCadastro = () => (
    <form className="conta-form">
      <h2>Criar Conta</h2>
      <div className="form-group">
        <label>Nome Completo</label>
        <input type="text" placeholder="Digite seu nome completo" />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" placeholder="Digite seu email" />
      </div>
      <div className="form-group">
        <label>Senha</label>
        <input type="password" placeholder="Digite sua senha" />
      </div>
      <div className="form-group">
        <label>Confirmar Senha</label>
        <input type="password" placeholder="Confirme sua senha" />
      </div>
      <button type="button" className="btn btn-primary btn-lg" onClick={handleLogin}>
        Criar Conta
      </button>
    </form>
  );

  const renderLogin = () => (
    <form className="conta-form">
      <h2>Entrar</h2>
      <div className="form-group">
        <label>Email</label>
        <input type="email" placeholder="Digite seu email" />
      </div>
      <div className="form-group">
        <label>Senha</label>
        <input type="password" placeholder="Digite sua senha" />
      </div>
      <button type="button" className="btn btn-primary btn-lg" onClick={handleLogin}>
        Entrar
      </button>
      <button type="button" className="btn-link" onClick={() => setTelaAtiva('cadastro')}>
        Não tem conta? Cadastre-se
      </button>
    </form>
  );

  const renderDados = () => (
    <form className="conta-form">
      <h2>Meus Dados</h2>
      <div className="form-group">
        <label>Nome Completo</label>
        <input type="text" defaultValue="João Silva" />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" defaultValue="joao@email.com" />
      </div>
      <div className="form-group">
        <label>Telefone</label>
        <input type="tel" placeholder="(11) 99999-9999" />
      </div>
      <div className="form-group">
        <label>CPF</label>
        <input type="text" placeholder="000.000.000-00" />
      </div>
      <button type="button" className="btn btn-primary btn-lg">
        Salvar Alterações
      </button>
    </form>
  );

  const renderLoja = () => (
    <form className="conta-form">
      <h2>Criar Loja</h2>
      <div className="form-group">
        <label>Nome da Loja</label>
        <input type="text" placeholder="Digite o nome da sua loja" />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea placeholder="Descreva sua loja" rows="3"></textarea>
      </div>
      <div className="form-group">
        <label>Categoria</label>
        <select>
          <option>Selecione uma categoria</option>
          <option>Eletrônicos</option>
          <option>Roupas</option>
          <option>Casa e Jardim</option>
          <option>Esportes</option>
        </select>
      </div>
      <div className="form-group">
        <label>CNPJ</label>
        <input type="text" placeholder="00.000.000/0001-00" />
      </div>
      <button type="button" className="btn btn-primary btn-lg">
        Criar Loja
      </button>
    </form>
  );

  const renderConteudo = () => {
    switch (telaAtiva) {
      case 'cadastro':
        return renderCadastro();
      case 'login':
        return renderLogin();
      case 'dados':
        return renderDados();
      case 'loja':
        return renderLoja();
      default:
        return renderMenu();
    }
  };

  const getTitulo = () => {
    switch (telaAtiva) {
      case 'cadastro':
        return 'Criar Conta';
      case 'login':
        return 'Entrar';
      case 'dados':
        return 'Meus Dados';
      case 'loja':
        return 'Criar Loja';
      default:
        return usuarioLogado ? 'Minha Conta' : 'Conta';
    }
  };

  return (
    <div className="conta-container">
      <div className="conta-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          ←
        </button>
        <h1>{getTitulo()}</h1>
      </div>

      <div className="conta-conteudo">
        {renderConteudo()}
      </div>
    </div>
  );
};

export default PerfilUsuario;