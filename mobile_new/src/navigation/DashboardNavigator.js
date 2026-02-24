import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Home, Package, Users, ShoppingCart, DollarSign, Briefcase, Settings, ShoppingBag, LogOut, FileText } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

// Screens
import StockListScreen from '../screens/StockListScreen';
import DashboardHomeScreen from '../screens/DashboardHomeScreen';
import CustomersScreen from '../screens/CustomersScreen';
import SalesScreen from '../screens/SalesScreen';
import FinanceScreen from '../screens/FinanceScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import ShopsScreen from '../screens/ShopsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import OrdersScreen from '../screens/OrdersScreen';
import InvoiceScreen from '../screens/InvoiceScreen';

const DashboardMenu = ({ navigation }) => {
    const { logout } = useAuth();

    const MenuItem = ({ title, icon: Icon, target }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(target)}
        >
            <Icon color="#059669" size={24} />
            <Text style={styles.menuItemText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <Text style={styles.headerSubtitle}>Welcome back</Text>
            </View>

            <View style={styles.grid}>
                <MenuItem title="Home" icon={Home} target="Home" />
                <MenuItem title="Stock List" icon={Package} target="Stock" />
                <MenuItem title="Customers" icon={Users} target="Customers" />
                <MenuItem title="Sales" icon={ShoppingCart} target="Sales" />
                <MenuItem title="Orders" icon={FileText} target="Orders" />
                <MenuItem title="Finance" icon={DollarSign} target="Finance" />
                <MenuItem title="Employees" icon={Briefcase} target="Employees" />
                <MenuItem title="Shops" icon={ShoppingBag} target="Shops" />
                <MenuItem title="Settings" icon={Settings} target="Settings" />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <LogOut color="#fff" size={20} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const Stack = createNativeStackNavigator();

const DashboardNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#fff' },
                headerTintColor: '#111827',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="Menu"
                component={DashboardMenu}
                options={{ title: 'Stock Manager App' }}
            />
            <Stack.Screen name="Home" component={DashboardHomeScreen} options={{ title: 'Overview' }} />
            <Stack.Screen name="Stock" component={StockListScreen} />
            <Stack.Screen name="Customers" component={CustomersScreen} />
            <Stack.Screen name="Sales" component={SalesScreen} />
            <Stack.Screen name="Finance" component={FinanceScreen} />
            <Stack.Screen name="Employees" component={EmployeesScreen} />
            <Stack.Screen name="Shops" component={ShopsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: 'Invoice' }} />
            <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: 'New Order' }} />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuItem: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItemText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40,
        gap: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DashboardNavigator;
