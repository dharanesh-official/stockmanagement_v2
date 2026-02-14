import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Alert } from 'react-native';
import axios from 'axios';

// Replace with your local IP address for physical device testing
const API_URL = 'http://192.168.1.5:5000/api';

export default function App() {
    const [token, setToken] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [stock, setStock] = useState([]);

    const login = async () => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            setToken(res.data.token);
            fetchStock(res.data.token);
        } catch (err) {
            Alert.alert('Login Failed', 'Invalid credentials');
        }
    };

    const fetchStock = async (authToken) => {
        try {
            const res = await axios.get(`${API_URL}/stock`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setStock(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!token) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Stock Manager Mobile</Text>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                />
                <TextInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                />
                <Button title="Login" onPress={login} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Inventory List</Text>
            <FlatList
                data={stock}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>{item.item_name}</Text>
                        <Text>Qty: {item.quantity} | Price: ${item.price}</Text>
                    </View>
                )}
            />
            <Button title="Logout" onPress={() => setToken(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    item: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        width: '100%',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
});
