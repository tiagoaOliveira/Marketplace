import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Pedidos.css'

const Pedidos = ({ user, userProfile, isVendor: isVendorProp }) => {
    const navigate = useNavigate()
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [expandidos, setExpandidos] = useState({})
    const [isVendor, setIsVendor] = useState(isVendorProp || false)
    const [visao, setVisao] = useState('comprador')
    const [modalAjuda, setModalAjuda] = useState(false)
    const [modalCancelar, setModalCancelar] = useState({ aberto: false, itemId: null })
    const [pedidosPendentes, setPedidosPendentes] = useState(0)

    useEffect(() => {
        if (user) {
            verificarVendedor()
        }
    }, [user])

    useEffect(() => {
        if (user && isVendor !== null) {
            carregarPedidos()
        }
    }, [user, visao, isVendor])

    useEffect(() => {
        if (isVendor && pedidos.length > 0) {
            const ordersPendentes = pedidos.filter(pedido => 
                pedido.order_items?.some(item => item.status === 'pendente')
            )
            setPedidosPendentes(ordersPendentes.length)
        }
    }, [pedidos, isVendor])

    const verificarVendedor = async () => {
        try {
            const { data: stores } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)

            const ehVendedor = stores && stores.length > 0
            setIsVendor(ehVendedor)
        } catch (error) {
            console.error('Erro ao verificar vendedor:', error)
        }
    }

    const carregarPedidos = async () => {
        try {
            setLoading(true)

            // Sempre carregar pedidos de vendedor se for vendedor
            const { data: stores } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)

            const ehVendedor = stores && stores.length > 0
            setIsVendor(ehVendedor)

            if (ehVendedor) {
                const storeIds = stores.map(s => s.id)

                const { data: items } = await supabase
                    .from('order_items')
                    .select('*, product_listings(products(images))')
                    .in('store_id', storeIds)
                    .order('created_at', { ascending: false })

                if (items?.length) {
                    const orderIds = [...new Set(items.map(item => item.order_id))]

                    const { data: orders } = await supabase
                        .from('orders')
                        .select('*')
                        .in('id', orderIds)
                        .order('created_at', { ascending: false })

                    const pedidosVendedor = orders?.map(order => ({
                        ...order,
                        order_items: items.filter(item => item.order_id === order.id)
                    })) || []

                    // Sempre carregar pedidos do vendedor independente da visão
                    if (visao === 'vendedor') {
                        setPedidos(pedidosVendedor)
                        setLoading(false)
                        return
                    }
                    
                    // Se estiver na visão comprador, carregar pedidos de comprador mas manter contagem
                    if (visao === 'comprador') {
                        const { data: pedidosComprador } = await supabase
                            .from('orders')
                            .select('*, order_items(*, product_listings(products(images)))')
                            .eq('user_id', user.id)
                            .order('created_at', { ascending: false })

                        setPedidos(pedidosComprador || [])
                        
                        // Contar pedidos pendentes dos pedidos de vendedor
                        const ordersPendentes = pedidosVendedor.filter(pedido => 
                            pedido.order_items?.some(item => item.status === 'pendente')
                        )
                        setPedidosPendentes(ordersPendentes.length)
                        setLoading(false)
                        return
                    }
                }
            }

            // Se não for vendedor, carregar como comprador
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(*, product_listings(products(images)))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setPedidos(data || [])
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpanded = (pedidoId) => {
        setExpandidos(prev => ({
            ...prev,
            [pedidoId]: !prev[pedidoId]
        }))
    }

    const confirmarCancelamento = async () => {
        try {
            if (!isVendor || visao !== 'vendedor' || !modalCancelar.itemId) {
                return
            }

            const { error } = await supabase
                .from('order_items')
                .update({
                    status: 'cancelado',
                    status_updated_at: new Date().toISOString(),
                    status_updated_by: user.id
                })
                .eq('id', modalCancelar.itemId)

            if (error) throw error

            setPedidos(prev =>
                prev.map(pedido => ({
                    ...pedido,
                    order_items: pedido.order_items?.map(item =>
                        item.id === modalCancelar.itemId
                            ? {
                                ...item,
                                status: 'cancelado',
                                status_updated_at: new Date().toISOString(),
                                status_updated_by: user.id
                            }
                            : item
                    ) || []
                }))
            )

            setModalCancelar({ aberto: false, itemId: null })
        } catch (error) {
            console.error('Erro ao cancelar item:', error)
        }
    }

    const marcarPedidoCompleto = async (pedidoId) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'completo' })
                .eq('id', pedidoId)

            if (error) throw error

            setPedidos(prev =>
                prev.map(pedido =>
                    pedido.id === pedidoId
                        ? { ...pedido, status: 'completo' }
                        : pedido
                )
            )
        } catch (error) {
            console.error('Erro ao marcar pedido como entregue:', error)
        }
    }

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (filtro === 'todos') return true

        if (visao === 'vendedor') {
            return pedido.status === filtro
        } else {
            if (filtro === 'pendente') {
                return pedido.status === 'pendente'
            } else if (filtro === 'completo') {
                return pedido.status === 'completo'
            }
            return false
        }
    })

    const formatarData = (data) => {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const createSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const irParaLoja = (nomeLoja) => {
        const slug = createSlug(nomeLoja)
        navigate(`/loja/${slug}`)
    }

    if (loading) {
        return <div className="pedidos-loading">Carregando pedidos...</div>
    }

    return (
        <div className="pedidos-container">
            <div className="pedidos-header">
                <button className="btn-ajuda" onClick={() => setModalAjuda(true)}>
                    ?
                </button>
            </div>

            {modalAjuda && (
                <div className="modal-overlay" onClick={() => setModalAjuda(false)}>
                    <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                        <h3>Como funciona?</h3>
                        <p><strong>Visão Comprador:</strong> Veja seus pedidos e marque como entregue quando receber.</p>
                        <p><strong>Visão Vendedor:</strong> Gerencie os produtos vendidos e atualize o status dos itens.</p>
                        <p><strong>Status dos itens:</strong> Pendente (aguardando), Entregue (concluído) ou Cancelado.</p>
                        <div className="modal-botoes">
                            <button className="btn-modal btn-modal-fechar" onClick={() => setModalAjuda(false)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalCancelar.aberto && (
                <div className="modal-overlay" onClick={() => setModalCancelar({ aberto: false, itemId: null })}>
                    <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirmar Cancelamento</h3>
                        <p>Tem certeza que deseja cancelar este item?</p>
                        <p>Esta ação não poderá ser desfeita.</p>
                        <div className="modal-botoes">
                            <button 
                                className="btn-modal btn-modal-fechar" 
                                onClick={() => setModalCancelar({ aberto: false, itemId: null })}
                            >
                                Não, voltar
                            </button>
                            <button 
                                className="btn-modal btn-modal-confirmar" 
                                onClick={confirmarCancelamento}
                            >
                                Sim, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isVendor && (
                <div className="visao-alternador">
                    <button
                        className={`visao-btn ${visao === 'comprador' ? 'ativo' : ''}`}
                        onClick={() => setVisao('comprador')}
                    >
                        🛒 Minhas Compras
                    </button>
                    <button
                        className={`visao-btn ${visao === 'vendedor' ? 'ativo' : ''}`}
                        onClick={() => setVisao('vendedor')}
                        style={{ position: 'relative' }}
                    >
                        🪟 Minhas Vendas
                        {pedidosPendentes > 0 && (
                            <span className="header-btn-badge3">
                                {pedidosPendentes > 99 ? '99+' : pedidosPendentes}
                            </span>
                        )}
                    </button>
                </div>
            )}

            <div className="pedidos-filtros">
                {visao === 'comprador'
                    ? ['todos', 'pendente', 'completo'].map(status => (
                        <button
                            key={status}
                            className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
                            onClick={() => setFiltro(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))
                    : ['todos', 'pendente', 'completo'].map(status => (
                        <button
                            key={status}
                            className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
                            onClick={() => setFiltro(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))
                }
            </div>

            {pedidosFiltrados.length === 0 ? (
                <div className="pedidos-vazio">
                    <div className="pedidos-vazio-icone">📦</div>
                    <p>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="pedidos-lista">
                    {pedidosFiltrados.map(pedido => (
                        <div key={pedido.id} className="pedido-card">
                            <div className="pedido-header">
                                <button
                                    className="pedido-expandir"
                                    onClick={() => toggleExpanded(pedido.id)}
                                >
                                    <span className={`arrow ${expandidos[pedido.id] ? 'ativo' : ''}`}>▼</span>
                                </button>

                                <div className="pedido-info">
                                    <h3>Pedido #{pedido.id.slice(0, 6)}</h3>
                                    <p className="pedido-data">
                                        {formatarData(pedido.created_at)}
                                    </p>
                                </div>

                                <div className="pedido-acoes">
                                    {visao === 'comprador' && pedido.status === 'pendente' && (
                                        <button
                                            className="btn-marcar-completo"
                                            onClick={() => marcarPedidoCompleto(pedido.id)}
                                        >
                                             Marcar como Entregue
                                        </button>
                                    )}
                                </div>
                            </div>

                            {expandidos[pedido.id] && (
                                <div className="pedido-expandido">
                                    <div className="pedido-endereco">
                                        <h4>Dados do Comprador</h4>
                                        <p><strong>Nome:</strong> {pedido.buyer_name}</p>
                                        <p><strong>Telefone:</strong> {pedido.buyer_phone || 'Não informado'}</p>
                                        <p>
                                            <strong>Endereço:</strong> {pedido.buyer_rua}, {pedido.buyer_numero}
                                            {pedido.buyer_bairro && ` - ${pedido.buyer_bairro}`}
                                            {pedido.buyer_cidade && ` - ${pedido.buyer_cidade}`}
                                            {pedido.buyer_cep && ` - ${pedido.buyer_cep}`}
                                        </p>
                                    </div>

                                    <div className="pedido-itens">
                                        <h4>{visao === 'vendedor' ? 'Seus Produtos neste Pedido' : 'Itens do Pedido'}
                                        </h4>
                                        {pedido.order_items?.map(item => (
                                            <div key={item.id} className="item-expandido">
                                                <div className='item-top'>
                                                    {item.product_listings?.products?.images?.[0] && (
                                                        <img
                                                            src={item.product_listings.products.images[0]}
                                                            alt={item.product_name}
                                                            className="item-imagem"
                                                        />
                                                    )}
                                                    <span className="item-nome">{item.product_name}</span>
                                                </div>

                                                <div className="item-info">
                                                    <div className="item-status-container">
                                                        <span
                                                            className={`item-status item-status-${item.status}`}
                                                        >
                                                            {item.status.toUpperCase()}
                                                        </span>
                                                        <span
                                                            className="item-loja item-loja-clicavel"
                                                            onClick={() => irParaLoja(item.store_name)}
                                                        >
                                                            {item.store_name}
                                                        </span>
                                                        {item.status_updated_at && (
                                                            <span className="item-status-data">
                                                                {new Date(item.status_updated_at).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="item-dados">
                                                    <span>{item.quantity}x</span>
                                                    <span>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</span>
                                                    <span className="item-subtotal">
                                                        R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                                {visao === 'vendedor' && item.status === 'pendente' && (
                                                    <button
                                                        className="btn-status-cancelado"
                                                        onClick={() => setModalCancelar({ aberto: true, itemId: item.id })}
                                                    >
                                                        ✕ Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pedido-total-expandido">
                                        <span>{visao === 'vendedor' ? 'Total da compra:' : 'Total do Pedido:'}</span>
                                        <span>
                                            R$ {pedido.order_items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Pedidos