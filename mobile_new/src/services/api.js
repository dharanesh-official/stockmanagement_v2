
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REPLACE WITH YOUR BACKEND IP ADDRESS
const API_URL = 'https://stockmanager-server.vercel.app/api';

// Utility function to recursively convert string booleans to actual booleans
const normalizeBooleansInObject = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        if (obj === 'true') return true;
        if (obj === 'false') return false;
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => normalizeBooleansInObject(item));
    }

    if (typeof obj === 'object') {
        const normalized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                // Check if the key suggests it should be a boolean
                if (key.startsWith('is_') || key.endsWith('_enabled') || key.endsWith('_disabled') || key.endsWith('_archived') || key.endsWith('_active')) {
                    if (typeof value === 'string') {
                        normalized[key] = value === 'true' || value === true || value === '1' || value === 1;
                    } else {
                        normalized[key] = !!value;
                    }
                } else {
                    normalized[key] = normalizeBooleansInObject(value);
                }
            }
        }
        return normalized;
    }

    return obj;
};

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to normalize boolean values
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = normalizeBooleansInObject(response.data);
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
