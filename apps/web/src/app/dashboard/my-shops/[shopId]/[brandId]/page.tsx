'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, Package } from 'lucide-react';
import { api, Product } from '@/services/api';

interface CartItem {
    product: Product;
    quantity: number;
}

export default function OrderPage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shopId as string;
    const brandId = params.brandId as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<Map<string, number>>(new Map()); // productId -> quantity
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (brandId) fetchProducts();
    }, [brandId]);

    async function fetchProducts() {
        try {
            setLoading(true);
            const data = await api.get<Product[]>(`/salespersons/brands/${brandId}/products`);
            setProducts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            const newCart = new Map(prev);
            const currentQty = newCart.get(productId) || 0;
            const newQty = Math.max(0, currentQty + delta);

            if (newQty === 0) newCart.delete(productId);
            else newCart.set(productId, newQty);

            return newCart;
        });
    };

    const totalItems = Array.from(cart.values()).reduce((a, b) => a + b, 0);
    const totalAmount = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
        const product = products.find(p => p.id === id);
        return sum + (product ? product.basePrice * qty : 0);
    }, 0);

    const handlePlaceOrder = async () => {
        if (cart.size === 0) return;
        if (!confirm(`Place order for ${totalItems} items totaling ₹${totalAmount.toFixed(2)}?`)) return;

        try {
            setSubmitting(true);
            const items = Array.from(cart.entries()).map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return {
                    productId,
                    quantity,
                    unitPrice: product?.basePrice || 0
                };
            });

            await api.post('/salespersons/orders', {
                shopId,
                brandId,
                items,
                discountAmount: 0 // Explicitly sending 0 to satisfy DTO
            });

            alert('Order placed successfully!');
            router.push('/dashboard/orders');
        } catch (err: any) {
            alert(err.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading products...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button onClick={() => router.back()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-h3">Place Order</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {products.map(product => {
                        const quantity = cart.get(product.id) || 0;
                        return (
                            <div key={product.id} className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package color="#9ca3af" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{product.name}</h4>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>SKU: {product.sku}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 600, color: '#4338ca' }}>₹{product.basePrice}</span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f9fafb', padding: '4px', borderRadius: '6px' }}>
                                            <button
                                                onClick={() => updateQuantity(product.id, -1)}
                                                disabled={quantity === 0}
                                                style={{ border: 'none', background: 'white', borderRadius: '4px', padding: '4px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(product.id, 1)}
                                                style={{ border: 'none', background: 'white', borderRadius: '4px', padding: '4px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Cart Bar */}
            {totalItems > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb',
                    padding: '1rem 2rem',
                    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 50,
                    // If sidebar is persistent, left might need adjustment, but for mobile/responsive it's safer to full width or match layout.
                    // Assuming layout handles main content area correctly. For fixed, explicit left might be needed if sidebar pushes content.
                }}>
                    <div style={{ marginLeft: '260px' }}> {/* Quick fix for sidebar offset if desktop */}
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{totalItems} items selected</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total: ₹{totalAmount.toFixed(2)}</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                    >
                        {submitting ? 'Placing Order...' : (
                            <>
                                <ShoppingCart size={20} />
                                Place Order
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
