
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, Alert, TouchableOpacity,
    TextInput, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { Search, Plus, Calendar, User, Store, Trash2, Minus, ShoppingCart, X } from 'lucide-react-native';

const CreateOrderScreen = ({ navigation, route }) => {
    const orderId = route.params?.orderId;
    const isEdit = !!orderId;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);

    // Data
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);

    // Selection
    const [selectedShop, setSelectedShop] = useState(null);
    const [cart, setCart] = useState([]);

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('products'); // 'products' or 'cart'

    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [qty, setQty] = useState('1');

    // Order Details
    const [paidAmount, setPaidAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Ordered');
    const [showStatusModal, setShowStatusModal] = useState(false);

    const STATUS_OPTIONS = ['Ordered', 'Dispatched', 'Delivered', 'Completed', 'Cancelled'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shopRes, prodRes] = await Promise.all([
                api.get('/shops'),
                api.get('/stock')
            ]);
            setShops(shopRes.data || []);
            setProducts(prodRes.data || []);

            // If Edit Mode, load order details
            if (isEdit) {
                await loadOrderDetails(shopRes.data, prodRes.data);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadOrderDetails = async (allShops, allProducts) => {
        try {
            const res = await api.get(`/sales/${orderId}`);
            const itemsRes = await api.get(`/sales/items/${orderId}`);
            const sale = res.data;
            const items = itemsRes.data;

            // Pre-select Shop
            const shop = allShops.find(s => s.id === sale.shop_id);
            if (shop) setSelectedShop(shop);

            // Pre-fill Cart
            const cartItems = items.map(i => {
                // Find original product to check stock ?? 
                // For edit, we just trust the item data or find match
                const prod = allProducts.find(p => p.id === i.stock_id);
                return {
                    id: i.stock_id,
                    name: i.name || i.item_name || 'Unknown',
                    price: i.price,
                    qty: i.quantity,
                    stock: prod ? prod.quantity : 0
                };
            });
            setCart(cartItems);
            setPaidAmount(sale.paid_amount ? String(sale.paid_amount) : '');
            setNotes(sale.notes || '');
            setStatus(sale.status || 'Ordered');

            // Jump to Review
            setStep(3);
        } catch (e) {
            console.error("Load order error", e);
        }
    };

    // --- Helpers ---

    const getFilteredShops = () => {
        const q = search.toLowerCase();
        return shops.filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(q))
        );
    };

    const getFilteredProducts = () => {
        const q = search.toLowerCase();
        return products.filter(p => {
            const name = p.name || p.item_name || '';
            const sku = p.sku || '';
            return name.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
        });
    };

    const addToCart = () => {
        const quantity = parseInt(qty);
        if (isNaN(quantity) || quantity <= 0) {
            Alert.alert('Invalid Quantity');
            return;
        }
        if (selectedProduct.quantity < quantity) {
            Alert.alert('Stock Error', `Only ${selectedProduct.quantity} available`);
            return;
        }

        const newItem = {
            id: selectedProduct.id,
            name: selectedProduct.name || selectedProduct.item_name,
            price: selectedProduct.selling_price || selectedProduct.price,
            stock: selectedProduct.quantity,
            qty: quantity
        };

        const existing = cart.find(c => c.id === newItem.id);
        if (existing) {
            const newQty = existing.qty + quantity;
            if (newQty > newItem.stock) {
                Alert.alert('Stock Error', 'Total quantity exceeds stock');
                return;
            }
            setCart(cart.map(c => c.id === newItem.id ? { ...c, qty: newQty } : c));
        } else {
            setCart([...cart, newItem]);
        }
        setModalVisible(false);
        setQty('1');
        setSelectedProduct(null);
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, parseInt(item.qty) + delta);
                return { ...item, qty: newQty.toString() };
            }
            return item;
        }).filter(item => parseInt(item.qty) > 0)); // Remove if 0
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!selectedShop) {
            Alert.alert('Error', 'Please select a shop');
            return;
        }
        if (cart.length === 0) {
            Alert.alert('Error', 'Cart is empty');
            return;
        }

        setSubmitting(true);

        const total = calculateTotal();
        const paid = parseFloat(paidAmount) || 0;

        // Status Logic:
        // Create -> Always 'Ordered'
        // Edit -> User selected status
        const finalStatus = isEdit ? status : 'Ordered';

        const payload = {
            shop_id: selectedShop.id,
            customer_id: selectedShop.customer_id, // backend might need this or not
            items: cart.map(i => ({
                stock_id: i.id,
                quantity: i.qty,
                price: i.price,
                // store item_name if needed
            })),
            total_amount: total,
            paid_amount: paid,
            notes: notes,
            type: 'order',
            paid_amount: paid,
            notes: notes,
            type: 'order',
            status: finalStatus
        };

        try {
            if (isEdit) {
                await api.put(`/sales/${orderId}`, payload);
                Alert.alert('Success', 'Order Updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else {
                await api.post('/sales', payload);
                Alert.alert('Success', 'Order Created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to submit order');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Renders ---

    const renderShop = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, selectedShop?.id === item.id && styles.selected]}
            onPress={() => setSelectedShop(item)}
        >
            <View style={styles.row}>
                <Store size={18} color="#059669" />
                <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <Text style={styles.subText}>{item.customer_name} • {item.address}</Text>
        </TouchableOpacity>
    );

    const renderProduct = ({ item }) => {
        if (!item) return null;
        const name = item.name || item.item_name || 'Unknown';
        const price = item.selling_price || item.price || 0;
        const stock = item.quantity || 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    setSelectedProduct(item);
                    setQty('1');
                    setModalVisible(true);
                }}
            >
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{name}</Text>
                        <Text style={styles.subText}>Stock: {stock}</Text>
                    </View>
                    <Text style={styles.price}>₹{price}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItemCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>₹{item.price}</Text>
            </View>
            <View style={styles.qtyControls}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                    <Minus size={16} color="white" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                    <Plus size={16} color="white" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

    return (
        <View style={styles.container}>
            {/* Stepper */}
            <View style={styles.stepper}>
                {[1, 2, 3].map(s => (
                    <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.stepCircle, step >= s && styles.stepActive]}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{s}</Text>
                        </View>
                        {s < 3 && <View style={styles.line} />}
                    </View>
                ))}
            </View>

            <View style={styles.content}>
                {step === 1 && (
                    <>
                        <Text style={styles.header}>Select Shop</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Search Shops..."
                            value={search} onChangeText={setSearch}
                        />
                        <FlatList
                            data={getFilteredShops()}
                            renderItem={renderShop}
                            keyExtractor={i => i.id.toString()}
                            ListEmptyComponent={<Text style={styles.empty}>No shops found</Text>}
                        />
                        <TouchableOpacity
                            style={[styles.btn, !selectedShop && styles.disabled]}
                            disabled={!selectedShop}
                            onPress={() => { setSearch(''); setStep(2); }}
                        >
                            <Text style={styles.btnText}>Next</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, viewMode === 'products' && styles.activeTab]}
                                onPress={() => setViewMode('products')}
                            >
                                <Text style={[styles.tabText, viewMode === 'products' && styles.activeTabText]}>Add Products</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, viewMode === 'cart' && styles.activeTab]}
                                onPress={() => setViewMode('cart')}
                            >
                                <Text style={[styles.tabText, viewMode === 'cart' && styles.activeTabText]}>View Cart ({cart.length})</Text>
                            </TouchableOpacity>
                        </View>

                        {viewMode === 'products' ? (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search Products..."
                                    value={search} onChangeText={setSearch}
                                    placeholderTextColor="#9ca3af"
                                />
                                <FlatList
                                    data={getFilteredProducts()}
                                    renderItem={renderProduct}
                                    keyExtractor={i => i.id.toString()}
                                    ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
                                />
                            </>
                        ) : (
                            <FlatList
                                data={cart}
                                renderItem={renderCartItem}
                                keyExtractor={i => i.id.toString()}
                                ListEmptyComponent={<Text style={styles.empty}>Cart is empty</Text>}
                            />
                        )}

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btnOutline} onPress={() => { setSearch(''); setStep(1); }}>
                                <Text style={styles.btnOutlineText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, cart.length === 0 && styles.disabled]}
                                disabled={cart.length === 0}
                                onPress={() => setStep(3)}
                            >
                                <Text style={styles.btnText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Text style={styles.header}>Review Order</Text>
                        <ScrollView style={styles.summary}>
                            <Text style={styles.label}>Shop: {selectedShop?.name}</Text>
                            <View style={styles.divider} />
                            {cart.map(c => (
                                <View key={c.id} style={styles.cartItem}>
                                    <View>
                                        <Text style={{ fontWeight: 'bold' }}>{c.name}</Text>
                                        <Text style={{ color: '#6b7280' }}>{c.qty} x ₹{c.price}</Text>
                                    </View>
                                    <Text style={{ fontWeight: 'bold' }}>₹{c.qty * c.price}</Text>
                                    <TouchableOpacity onPress={() => removeFromCart(c.id)} style={{ marginLeft: 10 }}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={styles.divider} />

                            {/* Summary Card */}
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.totalText}>Total Amount</Text>
                                    <Text style={[styles.totalText, { color: '#000000' }]}>₹{calculateTotal()}</Text>
                                </View>

                                <Text style={[styles.label, { marginTop: 10 }]}>Paid Amount (₹)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={paidAmount}
                                    onChangeText={setPaidAmount}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#9ca3af"
                                />

                                <View style={[styles.summaryRow, { marginTop: 10 }]}>
                                    {(() => {
                                        const tot = calculateTotal();
                                        const pd = parseFloat(paidAmount) || 0;
                                        const diff = tot - pd;
                                        const isChange = diff < 0;
                                        return (
                                            <>
                                                <Text style={[styles.totalText, { color: isChange ? '#059669' : '#ef4444' }]}>
                                                    {isChange ? 'Change/Return:' : 'Due Amount:'}
                                                </Text>
                                                <Text style={[styles.totalText, { color: isChange ? '#059669' : '#ef4444' }]}>
                                                    ₹{Math.abs(diff)}
                                                </Text>
                                            </>
                                        );
                                    })()}
                                </View>
                            </View>

                            <TextInput
                                style={styles.input}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add notes..."
                                placeholderTextColor="#9ca3af"
                            />

                            {/* Status Dropdown (Edit Mode Only) */}
                            {isEdit && (
                                <View style={{ marginTop: 20 }}>
                                    <Text style={styles.label}>Order Status</Text>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setShowStatusModal(true)}
                                    >
                                        <Text style={{ color: '#000000' }}>{status}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Print Invoice Button (Edit Mode Only) */}
                            {isEdit && (
                                <TouchableOpacity
                                    style={[styles.btnOutline, { marginTop: 20, borderColor: '#374151' }]}
                                    onPress={() => navigation.navigate('Invoice', { orderId: orderId })}
                                >
                                    <Text style={[styles.btnOutlineText, { color: '#374151' }]}>View Invoice</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Status Modal */}
                        <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
                            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatusModal(false)}>
                                <View style={styles.modalContent}>
                                    <Text style={[styles.modalTitle, { marginBottom: 16 }]}>Select Status</Text>
                                    {STATUS_OPTIONS.map(opt => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }}
                                            onPress={() => { setStatus(opt); setShowStatusModal(false); }}
                                        >
                                            <Text style={{ fontSize: 16, color: status === opt ? '#059669' : '#1f2937', fontWeight: status === opt ? 'bold' : 'normal' }}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btnOutline} onPress={() => setStep(2)}>
                                <Text style={styles.btnOutlineText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, submitting && { opacity: 0.5 }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                <Text style={styles.btnText}>{submitting ? 'Submitting...' : (isEdit ? 'Update Order' : 'Submit Order')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Qty Modal */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.row}>
                            <Text style={styles.header}>{selectedProduct?.name || selectedProduct?.item_name}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} /></TouchableOpacity>
                        </View>
                        <Text style={{ marginBottom: 10 }}>Available Stock: {selectedProduct?.quantity}</Text>
                        <TextInput
                            style={[styles.input, { textAlign: 'center', fontSize: 24 }]}
                            value={qty}
                            onChangeText={setQty}
                            keyboardType="number-pad"
                            autoFocus
                        />
                        <TouchableOpacity style={styles.btn} onPress={addToCart}>
                            <Text style={styles.btnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    stepper: { flexDirection: 'row', justifyContent: 'center', padding: 16, backgroundColor: 'white', elevation: 2 },
    stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: '#059669' },
    line: { width: 40, height: 2, backgroundColor: '#d1d5db', marginHorizontal: 4 },
    content: { flex: 1, padding: 16 },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 12, fontSize: 16 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 1 },
    selected: { borderColor: '#059669', borderWidth: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    subText: { color: '#6b7280', fontSize: 14, marginTop: 4 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
    btn: { backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', flex: 1, height: 50, justifyContent: 'center' },
    disabled: { backgroundColor: '#9ca3af' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    btnOutline: { borderWidth: 1, borderColor: '#059669', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', flex: 1, marginRight: 10, height: 50, justifyContent: 'center' },
    btnOutlineText: { color: '#059669', fontWeight: 'bold', fontSize: 16 },
    btnRow: { flexDirection: 'row', marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderColor: '#f3f4f6' },

    // TAB STYLES
    tabContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#e5e7eb', borderRadius: 8, padding: 4 },
    tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: 'white', elevation: 2 },
    tabText: { fontWeight: '600', color: '#6b7280' },
    activeTabText: { color: '#059669' },

    // CART ITEM STYLES
    cartItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1, justifyContent: 'space-between' },
    cartItemName: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
    cartItemPrice: { color: '#059669', fontWeight: 'bold' },
    qtyControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
    qtyBtn: { backgroundColor: '#059669', padding: 8, borderRadius: 20, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 12, fontWeight: 'bold', fontSize: 16, color: '#111827' },
    removeBtn: { padding: 8 },
    empty: { textAlign: 'center', marginTop: 30, color: '#9ca3af' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
    summary: { backgroundColor: 'white', padding: 16, borderRadius: 12, flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: '#000000' },
    summaryCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    total: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginTop: 10, color: '#059669' }
});

export default CreateOrderScreen;
