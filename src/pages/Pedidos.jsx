import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Pedidos.css'
import { Eye, EyeOff } from 'lucide-react'

const Pedidos = ({ user, userProfile, isVendor: isVendorProp }) => {
    const navigate = useNavigate()
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('pendente')
    const [expandidos, setExpandidos] = useState({})
    const [isVendor, setIsVendor] = useState(isVendorProp || false)
    const [visao, setVisao] = useState('comprador')
    const [modalAjuda, setModalAjuda] = useState(false)
    const [modalCancelar, setModalCancelar] = useState({ aberto: false, itemId: null })
    const [modalEntregar, setModalEntregar] = useState({ aberto: false, pedidoId: null })
    const [pedidosPendentes, setPedidosPendentes] = useState(0)
    const [enderecoExpandido, setEnderecoExpandido] = useState({})

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

            const { data: stores } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)

            const ehVendedor = stores && stores.length > 0
            setIsVendor(ehVendedor)

            const { data: result, error } = await supabase.functions.invoke('get-orders', {
                body: { view: visao }
            })

            if (error) {
                console.error('Erro ao chamar Edge Function:', error)
                setPedidos([])
            } else {
                setPedidos(result?.data || [])
            }

            if (ehVendedor && visao === 'comprador') {
                const storeIds = stores.map(s => s.id)
                const { data: itemsPendentes } = await supabase
                    .from('order_items')
                    .select('order_id')
                    .in('store_id', storeIds)
                    .eq('status', 'pendente')

                if (itemsPendentes) {
                    const uniqueOrders = [...new Set(itemsPendentes.map(item => item.order_id))]
                    setPedidosPendentes(uniqueOrders.length)
                }
            }
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

    const toggleEnderecoExpanded = (pedidoId) => {
        setEnderecoExpandido(prev => ({
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

            // Recarregar pedidos para atualizar status do pedido se necessário
            await carregarPedidos()
        } catch (error) {
            console.error('Erro ao cancelar item:', error)
        }
    }

    const marcarPedidoEntregue = async () => {
        try {
            if (!modalEntregar.pedidoId) return

            const { data, error } = await supabase.rpc(
                'mark_order_items_delivered',
                { p_order_id: modalEntregar.pedidoId }
            )

            if (error) throw error

            const result = data?.[0]

            if (!result?.success) {
                throw new Error(result?.message || 'Erro ao atualizar pedido')
            }

            setModalEntregar({ aberto: false, pedidoId: null })
            await carregarPedidos()
        } catch (error) {
            console.error(error)
        }
    }


    const pedidosFiltrados = pedidos.filter(pedido => {
        if (filtro === 'pendente') {
            return pedido.status === 'pendente'
        } else if (filtro === 'completo') {
            return pedido.status === 'completo'
        }
        return false
    })

    const agruparItensPorLoja = (orderItems) => {
        if (!orderItems) return {}
        return orderItems.reduce((acc, item) => {
            const loja = item.store_name || 'Loja Desconhecida'
            if (!acc[loja]) {
                acc[loja] = {
                    store_name: loja,
                    items: [],
                    total: 0
                }
            }
            acc[loja].items.push(item)
            acc[loja].total += parseFloat(item.subtotal) || 0
            return acc
        }, {})
    }

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

    const temItensPendentes = (pedido) => {
        return pedido.order_items?.some(item => item.status === 'pendente') || false
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

            {/* Modal Ajuda */}
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

            {/* Modal Cancelamento */}
            {modalCancelar.aberto && (
                <div className="modal-overlay" onClick={() => setModalCancelar({ aberto: false, itemId: null })}>
                    <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirmar Cancelamento</h3>
                        <p>Esta ação não poderá ser desfeita.</p>
                        <p>Envie uma mensagem ao comprador para evitar desentendimentos.</p>
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

            {/* Modal Confirmar Entrega */}
            {modalEntregar.aberto && (
                <div className="modal-overlay" onClick={() => setModalEntregar({ aberto: false, pedidoId: null })}>
                    <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirmar Entrega</h3>
                        <p>
                            {visao === 'vendedor'
                                ? 'Marcar seus itens pendentes como entregues?'
                                : ''
                            }
                        </p>
                        <div className="modal-botoes">
                            <button
                                className="btn-modal btn-modal-fechar"
                                onClick={() => setModalEntregar({ aberto: false, pedidoId: null })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-modal btn-modal-confirmar"
                                onClick={marcarPedidoEntregue}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alternador de Visão */}
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
                        onClick={() => setVisao('vendedor')}>
                        🪟 Minhas Vendas
                        {pedidosPendentes > 0 && (
                            <span className="header-btn-badge3">
                                {pedidosPendentes > 99 ? '99+' : pedidosPendentes}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Filtros */}
            <div className="pedidos-filtros">
                {['pendente', 'completo'].map(status => (
                    <button
                        key={status}
                        className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
                        onClick={() => setFiltro(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Lista de Pedidos */}
            {pedidosFiltrados.length === 0 ? (
                <div className="pedidos-vazio">
                    <div className="pedidos-vazio-icone">📦</div>
                    <p>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="pedidos-lista">
                    {pedidosFiltrados.map(pedido => {
                        const lojasAgrupadas = agruparItensPorLoja(pedido.order_items)
                        const isEnderecoExpanded = enderecoExpandido[pedido.id]
                        const hasPendentes = temItensPendentes(pedido)

                        return (
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
                                        {hasPendentes && (
                                            <button
                                                className="btn-marcar-completo"
                                                onClick={() => setModalEntregar({ aberto: true, pedidoId: pedido.id })}
                                            >
                                                Marcar como Entregue
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Conteúdo expandido do Pedido */}
                                {expandidos[pedido.id] && (
                                    <div className="pedido-expandido">
                                        {/* Dados do Comprador (Endereço Expansível) */}
                                        <div className="pedido-endereco">
                                            <div className='ocultar'>
                                                <h4>Dados do Comprador</h4>
                                                <button
                                                    className="pedido-expandir"
                                                    onClick={() => toggleEnderecoExpanded(pedido.id)}
                                                    title={isEnderecoExpanded ? 'Ocultar Endereço' : 'Mostrar Endereço'}
                                                >
                                                    {isEnderecoExpanded ? <EyeOff size={20} className="arrow" /> : <Eye size={20} className="arrow" />}
                                                </button>
                                            </div>

                                            {isEnderecoExpanded && (
                                                <div>
                                                    <p><strong>Nome:</strong> {pedido.buyer_name}</p>
                                                    <p><strong>Telefone:</strong> {pedido.buyer_phone || 'Não informado'}</p>
                                                    <p>
                                                        <strong>Endereço:</strong> {pedido.buyer_rua}, {pedido.buyer_numero}
                                                        {pedido.buyer_bairro && ` - ${pedido.buyer_bairro}`}
                                                        {pedido.buyer_cidade && ` - ${pedido.buyer_cidade}`}
                                                        {pedido.buyer_cep && ` - ${pedido.buyer_cep}`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Itens do Pedido Agrupados por Loja */}
                                        <div className="pedido-itens">
                                            {Object.values(lojasAgrupadas).map((loja, index) => (
                                                <div className='pedido-produtos' key={loja.store_name} >
                                                    <h5
                                                        onClick={() => irParaLoja(loja.store_name)}
                                                        title={`Ir para a loja ${loja.store_name}`}
                                                    >
                                                        {loja.store_name} ({loja.items.length} item{loja.items.length > 1 ? 's' : ''})
                                                    </h5>

                                                    {loja.items.map(item => (
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

                                                    <div className='subtotal'>
                                                        <span>
                                                            Subtotal:
                                                        </span>
                                                        <span className="item-subtotal">
                                                            R$ {loja.total.toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pedido-total-expandido">
                                            <span>Total do Pedido:</span>
                                            <span>
                                                R$ {pedido.order_items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default Pedidos