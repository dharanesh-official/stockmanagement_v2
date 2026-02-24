/**
 * Utility functions to transform API response data
 * Ensures boolean string values are converted to actual booleans
 */

export const normalizeBooleanFields = (data, booleanFields = []) => {
    if (!data) return data;
    
    const transform = (item) => {
        const transformed = { ...item };
        booleanFields.forEach(field => {
            if (field in transformed) {
                const value = transformed[field];
                // Convert string representations to actual booleans
                if (typeof value === 'string') {
                    transformed[field] = value === 'true' || value === '1' || value === 1 || value === true;
                } else {
                    transformed[field] = !!value;
                }
            }
        });
        return transformed;
    };
    
    return Array.isArray(data) ? data.map(transform) : transform(data);
};

// Recursively normalize all boolean-like fields in an object
export const normalizeAllBooleans = (data) => {
    if (!data) return data;
    
    if (typeof data === 'string') {
        if (data === 'true') return true;
        if (data === 'false') return false;
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => normalizeAllBooleans(item));
    }
    
    if (typeof data === 'object') {
        const normalized = {};
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                // Check if the key suggests it should be a boolean
                if (key.startsWith('is_') || 
                    key.endsWith('_enabled') || 
                    key.endsWith('_disabled') || 
                    key.endsWith('_archived') || 
                    key.endsWith('_active') ||
                    key.endsWith('_locked')) {
                    if (typeof value === 'string') {
                        normalized[key] = value === 'true' || value === '1' || value === 1 || value === true;
                    } else {
                        normalized[key] = !!value;
                    }
                } else {
                    normalized[key] = normalizeAllBooleans(value);
                }
            }
        }
        return normalized;
    }
    
    return data;
};

// Common boolean fields by entity
export const BOOLEAN_FIELDS = {
    customers: ['is_locked'],
    stock: ['is_archived'],
    users: [],
    sales: [],
    shops: []
};

export const transformCustomers = (data) => normalizeAllBooleans(data);
export const transformStock = (data) => normalizeAllBooleans(data);
export const transformUsers = (data) => normalizeAllBooleans(data);
export const transformSales = (data) => normalizeAllBooleans(data);
export const transformShops = (data) => normalizeAllBooleans(data);
