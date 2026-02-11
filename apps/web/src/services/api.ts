// API Service for making authenticated requests to the backend

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

class ApiService {
    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token');
        }
        return null;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        // Ensure we're on the client side
        if (typeof window === 'undefined') {
            console.warn('API calls can only be made from the client side');
            return Promise.reject(new Error('API calls can only be made from the client side'));
        }

        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                // Token expired or invalid
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('access_token');
                    window.location.href = '/';
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || 'Request failed');
            }

            return response.json();
        } catch (error: any) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get<T = any>(endpoint: string): Promise<T> {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // PATCH request
    async patch<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    // DELETE request
    async delete<T = any>(endpoint: string): Promise<T> {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiService();

// Type definitions for API responses
export interface Brand {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
    _count?: {
        products: number;
        warehouses: number;
        users: number;
    };
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    categoryId?: string;
    brandId: string;
    basePrice: number;
    costPrice?: number;
    imageUrl?: string;
    unit: string;
    barcode?: string;
    minStockLevel: number;
    createdAt: string;
    updatedAt: string;
    brand?: {
        id: string;
        name: string;
        slug: string;
    };
}

export interface Warehouse {
    id: string;
    name: string;
    location?: string;
    brandId: string;
    createdAt: string;
    updatedAt: string;
    brand?: {
        id: string;
        name: string;
        slug: string;
    };
    _count?: {
        stocks: number;
        managers: number;
    };
}

export interface Shop {
    id: string;
    name: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    managerName?: string;
    brands: Brand[];
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    fullName: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    brandId: string;
    createdAt: string;
    brand?: {
        id: string;
        name: string;
    };
    _count?: {
        orders: number;
    };
}

export interface Order {
    id: string;
    orderNumber: string;
    brandId: string;
    customerId: string;
    salesPersonId: string;
    status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
    totalAmount: number;
    discountAmount: number;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: string;
        fullName: string;
        phoneNumber?: string;
    };
    salesPerson?: {
        id: string;
        fullName: string;
    };
    _count?: {
        items: number;
    };
}

export interface Stock {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
    updatedAt: string;
    product?: {
        id: string;
        name: string;
        sku: string;
        basePrice: number;
    };
    warehouse?: {
        id: string;
        name: string;
        location?: string;
    };
}
