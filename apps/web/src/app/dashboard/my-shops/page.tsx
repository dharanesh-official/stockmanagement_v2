'use client';

import { useState, useEffect } from 'react';
import { Store, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api, Shop, Brand } from '@/services/api';

export default function MyShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssignedShops();
    }, []);

    async function fetchAssignedShops() {
        try {
            setLoading(true);
            const data = await api.get<Shop[]>('/salespersons/assigned-shops');
            setShops(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch assigned shops');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading assigned shops...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h2 className="text-h2">My Assigned Shops</h2>
                    <p className="text-sm text-gray-500">Select a shop to view supplied brands and place orders.</p>
                </div>
            </div>

            {shops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                    <Store size={48} color="#e5e7eb" style={{ marginBottom: '1rem' }} />
                    <p>No shops assigned to you yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map(shop => (
                        <Link
                            key={shop.id}
                            href={`/dashboard/my-shops/${shop.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="card hover-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ padding: '10px', backgroundColor: '#e0e7ff', borderRadius: '12px', color: '#4338ca' }}>
                                        <Store size={24} />
                                    </div>
                                    <ChevronRight size={20} color="#9ca3af" />
                                </div>

                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{shop.name}</h3>

                                {shop.address && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        <MapPin size={16} />
                                        <span>{shop.address}</span>
                                    </div>
                                )}

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        <span style={{ fontWeight: 600, color: '#111827' }}>{shop.brands?.length || 0}</span> Supplied Brands
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
