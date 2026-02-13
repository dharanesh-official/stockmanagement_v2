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

    async get<T = any>(endpoint: string): Promise<T> {
        return this.request(endpoint, { method: 'GET' });
    }

    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = any>(endpoint: string): Promise<T> {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiService();

export interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    basePrice: number;
    costPrice?: number;
    imageUrl?: string;
    unit: string;
    barcode?: string;
    minStockLevel: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    fullName: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    isLocked: boolean;
    createdAt: string;
    _count?: {
        orders: number;
    };
}

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    salesPersonId: string;
    type: 'ORDER' | 'SALES' | 'CREDIT_NOTE';
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
    invoice?: {
        id: string;
        invoiceNumber: string;
        amount: number;
        paidAmount: number;
        status: string;
    };
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'SALES_PERSON';
    isActive: boolean;
}
