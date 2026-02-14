import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Edit, ShieldCheck, Mail, User, Briefcase, ChevronDown, ChevronRight, Check, Settings2, Store, Phone } from 'lucide-react';
import './StockList.css'; // Inheriting shared table styles
import './Employees.css'; // Shared styles

const MODULES = [
    { id: 'stock', name: 'Stock Management' },
    { id: 'customers', name: 'Customers' },
    { id: 'shops', name: 'Shops' },
    { id: 'sales', name: 'Sales & Orders' },
    { id: 'finance', name: 'Finance' },
    { id: 'employees', name: 'Employee Management' },
    { id: 'settings', name: 'Settings' }
];

const ACTIONS = ['view', 'create', 'edit', 'delete'];
const FINANCE_ACTIONS = ['dues', 'credit', 'history'];
const SETTINGS_ACTIONS = []; // No sub-actions for settings, just master toggle

const SALESMAN_PERMISSIONS = {
    stock: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: true, delete: true },
    shops: { view: true, create: true, edit: true, delete: true },
    sales: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, dues: true, credit: true, history: true },
    employees: { view: false, create: false, edit: false, delete: false },
    settings: { view: true }
};

const ADMIN_PERMISSIONS = {
    stock: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    shops: { view: true, create: true, edit: true, delete: true },
    sales: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, dues: true, credit: true, history: true },
    employees: { view: true, create: true, edit: true, delete: true },
    settings: { view: true }
};

const EMPTY_PERMISSIONS = {
    stock: { view: false, create: false, edit: false, delete: false },
    customers: { view: false, create: false, edit: false, delete: false },
    shops: { view: false, create: false, edit: false, delete: false },
    sales: { view: false, create: false, edit: false, delete: false },
    finance: { view: false, dues: false, credit: false, history: false },
    employees: { view: false, create: false, edit: false, delete: false },
    settings: { view: false }
};

const Employees = ({ user }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [expandedModule, setExpandedModule] = useState(null);

    // Profile View State
    const [showProfile, setShowProfile] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [assignedShops, setAssignedShops] = useState([]);
    const [allShops, setAllShops] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        id: null,
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'salesman',
        permissions: SALESMAN_PERMISSIONS
    });

    useEffect(() => {
        if (user.role !== 'admin') return;
        fetchEmployees();
    }, [user.role]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/users');
            setEmployees(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const openProfile = async (emp) => {
        try {
            setSelectedEmployee(emp); // Set basic info immediately
            setShowProfile(true); // Open modal immediately
            setProfileLoading(true); // Start loading details

            const res = await api.get(`/users/${emp.id}`);
            setSelectedEmployee(res.data);
            setPerformance(res.data.performance);
            setAssignedShops(res.data.shops || []);

            // Also fetch all shops for assignment modal
            const shopsRes = await api.get('/shops');
            setAllShops(shopsRes.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load employee profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdateShopAssignments = async () => {
        try {
            const shopIds = assignedShops.map(s => s.id);
            await api.put(`/users/${selectedEmployee.id}/shops`, { shopIds });
            setShowAssignmentModal(false);
            // Refresh profile
            openProfile(selectedEmployee);
        } catch (err) {
            alert('Failed to update shop assignments');
        }
    };

    const toggleShopSelection = (shop) => {
        if (assignedShops.find(s => s.id === shop.id)) {
            setAssignedShops(assignedShops.filter(s => s.id !== shop.id));
        } else {
            setAssignedShops([...assignedShops, shop]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will remove the user access.')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data || 'Failed to delete user');
            console.error(err);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/users/${formData.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            resetForm();
            fetchEmployees();
        } catch (err) {
            alert(err.response?.data || 'Failed to save user');
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            full_name: '',
            email: '',
            phone: '',
            password: '',
            role: 'salesman',
            permissions: SALESMAN_PERMISSIONS
        });
        setEditMode(false);
        setExpandedModule(null);
    };

    const openEditModal = (emp) => {
        setFormData({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            phone: emp.phone || '',
            password: '',
            role: emp.role,
            permissions: emp.permissions || (emp.role === 'admin' ? ADMIN_PERMISSIONS : SALESMAN_PERMISSIONS)
        });
        setEditMode(true);
        setShowModal(true);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleRoleChange = (role) => {
        let newPermissions = formData.permissions;
        if (role === 'admin') newPermissions = ADMIN_PERMISSIONS;
        else if (role === 'salesman') newPermissions = SALESMAN_PERMISSIONS;
        else if (role === 'custom' && !editMode) newPermissions = EMPTY_PERMISSIONS;

        setFormData({
            ...formData,
            role,
            permissions: newPermissions
        });
    };

    const togglePermission = (module, action) => {
        if (formData.role !== 'custom') return; // Only custom role can edit permissions

        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [module]: {
                    ...formData.permissions[module],
                    [action]: !formData.permissions[module][action]
                }
            }
        });
    };

    if (user.role !== 'admin') return <div className="p-4 text-red-600 font-bold">Access Denied</div>;

    return (
        <div className="stock-page">
            <div className="page-header">
                <div>
                    <h1>Employee Management</h1>
                    <p className="subtitle">Choose between standard roles or create a custom access profile.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            <div className="table-container employees-list">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Role Category</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="loading-cell">
                                    <div className="loading-container">
                                        <div className="spinner"></div>
                                        <span>Loading personnel database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan="5" className="loading-cell">No employees found. Add one to get started.</td></tr>
                        ) : employees.map(emp => (
                            <tr key={emp.id} onClick={() => openProfile(emp)} className="clickable-row">
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            <User size={16} />
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {emp.full_name}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-1">
                                        <div className="email-cell text-gray-500"><Mail size={14} /> {emp.email}</div>
                                        {emp.phone && <div className="email-cell text-gray-400"><Phone size={14} /> {emp.phone}</div>}
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col gap-1">
                                        <span className={`badge ${emp.role === 'admin' ? 'badge-green' : emp.role === 'custom' ? 'badge-gray' : 'badge-blue'}`}>
                                            {emp.role === 'admin' ? <ShieldCheck size={12} /> : emp.role === 'custom' ? <Settings2 size={12} /> : <Briefcase size={12} />}
                                            {emp.role.toUpperCase()}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-gray-400 text-sm">{new Date(emp.created_at).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}>
                                        <Edit size={18} />
                                    </button>
                                    <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simplified Role Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content permissions-modal-content">
                        <div className="modal-header">
                            <h2>{editMode ? `Edit Access: ${formData.full_name}` : 'Create New Personnel'}</h2>
                        </div>
                        <form onSubmit={handleCreateOrUpdate} className="personnel-form">
                            <div className="managed-form">
                                <div className="form-sections-grid">
                                    <div className="info-section">
                                        <h3 className="section-title">Identity & Role</h3>
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                placeholder="email@company.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Role</label>
                                            <select
                                                value={formData.role}
                                                onChange={e => handleRoleChange(e.target.value)}
                                            >
                                                <option value="salesman">Salesman</option>
                                                <option value="admin">Admin</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        {!editMode && (
                                            <div className="form-group">
                                                <label>Access Password</label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    placeholder="Initialize password"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="permissions-section">
                                        <h3 className="section-title">Access Configuration</h3>
                                        {formData.role !== 'custom' ? (
                                            <div className="role-preview-card">
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {formData.role === 'admin'
                                                        ? 'Administrators have full access to all modules and settings.'
                                                        : 'Salesmen have standard access to stock, customers, and sales creation.'}
                                                </p>
                                                <div className="preview-badges">
                                                    {MODULES.filter(m => formData.permissions[m.id]?.view).map(m => (
                                                        <div key={m.id} className="preview-badge">
                                                            <Check size={10} color="#10b981" />
                                                            {m.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="section-desc">Choose which modules this custom user can access.</p>
                                                <div className="modules-permissions-list">
                                                    {MODULES.map(module => {
                                                        const isModuleOn = formData.permissions[module.id]?.view;
                                                        return (
                                                            <div key={module.id} className={`module-item ${!isModuleOn ? 'module-off' : ''}`}>
                                                                <div className="module-header-container">
                                                                    <div
                                                                        className={`module-header ${expandedModule === module.id ? 'active' : ''}`}
                                                                        onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            {expandedModule === module.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                            <span className="font-medium">{module.name}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="module-toggle-wrapper">
                                                                        <div
                                                                            className={`master-toggle ${isModuleOn ? 'on' : ''}`}
                                                                            onClick={() => togglePermission(module.id, 'view')}
                                                                        >
                                                                            <div className="toggle-dot"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {expandedModule === module.id && (
                                                                    <div className={`module-actions-grid ${!isModuleOn ? 'disabled-grid' : ''}`}>
                                                                        {(() => {
                                                                            let subActions = ACTIONS.filter(a => a !== 'view');
                                                                            if (module.id === 'finance') subActions = FINANCE_ACTIONS;
                                                                            if (module.id === 'settings') subActions = SETTINGS_ACTIONS;

                                                                            if (subActions.length === 0) return <p className="text-xs text-gray-400 italic p-2">Full access granted by master toggle.</p>;

                                                                            return subActions.map(action => (
                                                                                <div
                                                                                    key={action}
                                                                                    className={`action-toggle ${formData.permissions[module.id]?.[action] ? 'checked' : ''} ${!isModuleOn ? 'disabled' : ''}`}
                                                                                    onClick={() => isModuleOn && togglePermission(module.id, action)}
                                                                                >
                                                                                    <div className="checkbox">
                                                                                        {formData.permissions[module.id]?.[action] && <Check size={12} />}
                                                                                    </div>
                                                                                    <span className="capitalize">{action.replace('_', ' ')}</span>
                                                                                </div>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editMode ? 'Update Employee' : 'Create Employee'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Employee Profile Modal */}
            {showProfile && selectedEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content permissions-modal-content">
                        <div className="modal-header flex justify-between items-center">
                            <h2>Employee Profile</h2>
                            <button className="icon-btn" onClick={() => setShowProfile(false)}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <div className="managed-form profile-view-content">
                            {profileLoading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <span>Loading details...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="profile-header-grid">
                                        <div className="profile-identity">
                                            <div className="profile-avatar">
                                                <User size={40} />
                                            </div>
                                            <div className="profile-main-info">
                                                <h3>{selectedEmployee.full_name}</h3>
                                                <p className="text-gray-500 flex items-center gap-2"><Mail size={14} /> {selectedEmployee.email}</p>
                                                {selectedEmployee.phone && <p className="text-gray-500 flex items-center gap-2"><Phone size={14} /> {selectedEmployee.phone}</p>}
                                                <span className={`badge mt-2 ${selectedEmployee.role === 'admin' ? 'badge-green' : 'badge-blue'}`}>
                                                    {selectedEmployee.role.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="profile-work-info">
                                            <div className="info-stat">
                                                <span className="info-label">Joined On</span>
                                                <span className="info-val">{new Date(selectedEmployee.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="info-stat">
                                                <span className="info-label">Account Status</span>
                                                <span className="info-val text-green-600 font-bold">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="section-title"><Briefcase size={16} /> Sales Performance</h3>
                                    {performance ? (
                                        <div className="performance-stats-grid">
                                            <div className="p-stat-card">
                                                <span className="p-stat-label">Total Revenue</span>
                                                <span className="p-stat-value">₹{Number(performance.total_revenue || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="p-stat-card">
                                                <span className="p-stat-label">Total Orders</span>
                                                <span className="p-stat-value">{performance.total_orders}</span>
                                            </div>
                                            <div className="p-stat-card">
                                                <span className="p-stat-label">Active Customers</span>
                                                <span className="p-stat-value">{performance.total_customers}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">Calculating performance data...</p>
                                    )}

                                    <div className="section-header-row">
                                        <h3 className="section-title"><Check size={16} /> Assigned Shops ({assignedShops.length})</h3>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignmentModal(true)}>
                                            Manage Assignments
                                        </button>
                                    </div>
                                    <div className="assigned-shops-list">
                                        {assignedShops.length > 0 ? (
                                            assignedShops.map(shop => (
                                                <div key={shop.id} className="assigned-shop-item">
                                                    <div className="shop-info">
                                                        <span className="shop-name">{shop.name}</span>
                                                        <span className="shop-addr">{shop.address}</span>
                                                    </div>
                                                    <span className="shop-phone">{shop.phone}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-shops-state">
                                                <Store size={32} />
                                                <span>No shops assigned to this employee yet.</span>
                                                <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowAssignmentModal(true)}>
                                                    Assign Now
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Assignment Modal */}
            {showAssignmentModal && (
                <div className="modal-overlay assignment-overlay">
                    <div className="modal-content shop-select-modal">
                        <div className="modal-header">
                            <h2>Select Targeted Shops</h2>
                            <p className="text-xs text-gray-500">Pick the shops this salesman will manage.</p>
                        </div>
                        <div className="managed-form shop-selection-grid">
                            {allShops.map(shop => (
                                <div
                                    key={shop.id}
                                    className={`shop-option-item ${assignedShops.find(s => s.id === shop.id) ? 'selected' : ''}`}
                                    onClick={() => toggleShopSelection(shop)}
                                >
                                    <div className="selection-indicator">
                                        {assignedShops.find(s => s.id === shop.id) && <Check size={14} />}
                                    </div>
                                    <div className="shop-option-details">
                                        <span className="opt-name">{shop.name}</span>
                                        <span className="opt-customer text-xs text-gray-400">{shop.customer_name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpdateShopAssignments}>Update Assignments</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
