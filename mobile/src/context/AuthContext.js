
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userData = await AsyncStorage.getItem('user');

                if (token && userData) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser(JSON.parse(userData));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const hasPermission = (module, action) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions?.[module]?.[action] === true;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasPermission, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
