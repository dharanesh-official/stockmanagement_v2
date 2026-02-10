'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { api, Brand, Product } from '@/services/api';

export default function ShopUnifiedOrderPage() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shopId as string;

    const [brands, setBrands] = useState<Brand[]>([]);
    const [productsByBrand, setProductsByBrand] = useState<Record<string, Product[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cart, setCart] = useState<Map<string, number>>(new Map()); // productId -> quantity
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (shopId) {
            fetchData();
        }
    }, [shopId]);

    async function fetchData() {
        try {
            setLoading(true);
            // 1. Fetch Brands
            const brandsData = await api.get<Brand[]>(`/salespersons/shops/${shopId}/brands`);
            setBrands(brandsData);

            // 2. Fetch Products for each brand
            const productsMap: Record<string, Product[]> = {};
            await Promise.all(brandsData.map(async (brand) => {
                try {
                    const products = await api.get<Product[]>(`/salespersons/brands/${brand.id}/products`);
                    productsMap[brand.id] = products;
                } catch (e) {
                    console.error(`Failed to fetch products for brand ${brand.name}`, e);
                    productsMap[brand.id] = [];
                }
            }));
            setProductsByBrand(productsMap);

        } catch (err: any) {
            setError(err.message || 'Failed to fetch shop data');
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

    // Helper to find product details from any brand
    const getProduct = (productId: string) => {
        for (const brandId in productsByBrand) {
            const found = productsByBrand[brandId].find(p => p.id === productId);
            if (found) return found;
        }
        return null;
    };

    const totalItems = Array.from(cart.values()).reduce((a, b) => a + b, 0);
    const totalAmount = Array.from(cart.entries()).reduce((sum, [id, qty]) => {
        const product = getProduct(id);
        return sum + (product ? product.basePrice * qty : 0);
    }, 0);

    const handlePlaceOrder = async () => {
        if (cart.size === 0) return;
        if (!confirm(`Place order for ${totalItems} items totaling ₹${totalAmount.toFixed(2)}?`)) return;

        try {
            setSubmitting(true);

            // Group cart items by Brand
            const itemsByBrand: Record<string, { productId: string, quantity: number, unitPrice: number }[]> = {};

            for (const [productId, quantity] of Array.from(cart.entries())) {
                const product = getProduct(productId);
                if (!product) continue;

                if (!itemsByBrand[product.brandId]) {
                    itemsByBrand[product.brandId] = [];
                }
                itemsByBrand[product.brandId].push({
                    productId,
                    quantity,
                    unitPrice: product.basePrice
                });
            }

            // Send order request for each brand
            const promises = Object.entries(itemsByBrand).map(([brandId, items]) => {
                return api.post('/salespersons/orders', {
                    shopId,
                    brandId,
                    items,
                    discountAmount: 0 // Explicitly sending 0 to satisfy DTO
                });
            });

            await Promise.all(promises);

            alert('Orders placed successfully!');
            router.push('/dashboard/orders');
        } catch (err: any) {
            alert(err.message || 'Failed to place orders');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    return (
        <div style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => router.back()}
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={16} />
                    Back to Shops
                </button>
                <h2 className="text-h2">Shop Order</h2>
            </div>

            {brands.map(brand => (
                <div key={brand.id} style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                        {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {brand.name.charAt(0)}
                            </div>
                        )}
                        <h3 className="text-h3" style={{ margin: 0 }}>{brand.name}</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {productsByBrand[brand.id]?.map(product => {
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
                        {(!productsByBrand[brand.id] || productsByBrand[brand.id].length === 0) && (
                            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No products available for this brand.</p>
                        )}
                    </div>
                </div>
            ))}

            {/* Bottom Cart Bar */}
            {totalItems > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0, // Should be adjusted effectively by padding on container if not full width
                    right: 0,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb',
                    padding: '1rem 2rem',
                    boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 50,
                }}>
                    <div style={{ marginLeft: '260px' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{totalItems} items selected</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Total: ₹{totalAmount.toFixed(2)}</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                    >
                        {submitting ? 'Placing Orders...' : (
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
