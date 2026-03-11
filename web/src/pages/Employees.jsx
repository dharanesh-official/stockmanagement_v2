import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Edit, ShieldCheck, Mail, User, Briefcase, ChevronDown, ChevronRight, Check, Settings2, Store, Phone, TrendingUp, Map, MapPin, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
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
const SETTINGS_ACTIONS = [];

const ROLES = [
    { id: 'super_admin', name: 'Super Admin', color: 'badge-purple' },
    { id: 'admin', name: 'Admin', color: 'badge-green' },
    { id: 'manager', name: 'Manager', color: 'badge-blue' },
    { id: 'salesman', name: 'Salesman', color: 'badge-indigo' },
    { id: 'custom', name: 'Custom Role', color: 'badge-gray' }
];

const STATUSES = ['Active', 'Suspended', 'On Leave', 'Disabled'];

const SALESMAN_PERMISSIONS = {
    stock: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: true, delete: true },
    shops: { view: true, create: true, edit: true, delete: true },
    sales: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, dues: true, credit: true, history: true },
    employees: { view: false, create: false, edit: false, delete: false },
    settings: { view: false }
};

const MANAGER_PERMISSIONS = {
    stock: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: true },
    shops: { view: true, create: true, edit: true, delete: true },
    sales: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, dues: true, credit: true, history: true },
    employees: { view: true, create: false, edit: false, delete: false },
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
        permissions: SALESMAN_PERMISSIONS,
        employee_id: '',
        status: 'Active',
        assigned_areas: []
    });

    // Filter states
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [areaFilter, setAreaFilter] = useState('all');
    const [areas, setAreas] = useState([]);
    const [areaSearch, setAreaSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
        fetchEmployees();
        fetchAreas();
    }, [user.role]);

    const fetchAreas = async () => {
        try {
            const res = await api.get('/areas');
            setAreas(res.data);
        } catch (err) {
            console.error(err);
        }
    };

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
            setSelectedEmployee(emp); 
            setShowProfile(true);
            setProfileLoading(true);

            const res = await api.get(`/users/${emp.id}`);
            setSelectedEmployee(res.data);
            setPerformance(res.data.performance);
            setAssignedShops(res.data.shops || []);

            const shopsRes = await api.get('/shops');
            setAllShops(shopsRes.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load employee profile');
        } finally {
            setProfileLoading(false);
        }
    };
    
    const filteredEmployees = employees.filter(emp => {
        const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
        const matchesArea = areaFilter === 'all' || (emp.assigned_areas && emp.assigned_areas.includes(parseInt(areaFilter)));
        const matchesSearch = 
            emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.employee_id && emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesRole && matchesStatus && matchesArea && matchesSearch;
    });

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
            permissions: SALESMAN_PERMISSIONS,
            employee_id: 'EMP' + (1000 + employees.length),
            status: 'Active',
            assigned_areas: []
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
            permissions: emp.permissions || (emp.role === 'admin' || emp.role === 'super_admin' ? ADMIN_PERMISSIONS : emp.role === 'manager' ? MANAGER_PERMISSIONS : SALESMAN_PERMISSIONS),
            employee_id: emp.employee_id || '',
            status: emp.status || 'Active',
            assigned_areas: emp.assigned_areas || []
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
        if (role === 'admin' || role === 'super_admin') newPermissions = ADMIN_PERMISSIONS;
        else if (role === 'manager') newPermissions = MANAGER_PERMISSIONS;
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
                    <h1>Personnel Ecosystem</h1>
                    <p className="subtitle">Manage access, roles, and performance for your entire workforce.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} /> Add Employee
                    </button>
                </div>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <User size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search by ID, Name or Email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filters-group">
                    <div className="filter-item">
                        <label className="filter-label">Role</label>
                        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">All Roles</option>
                            {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label className="filter-label">Status</label>
                        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label className="filter-label">Area</label>
                        <select className="filter-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                            <option value="all">All Areas</option>
                            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container employees-list">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>E-ID</th>
                            <th>Employee Name</th>
                            <th>Role & Level</th>
                            <th>Shop Load</th>
                            <th>Account Status</th>
                            <th>Recent Activity</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7">
                                    <LoadingSpinner message="Synchronizing workforce data..." />
                                </td>
                            </tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr><td colSpan="7" className="loading-cell">No matching personnel found.</td></tr>
                        ) : filteredEmployees.map(emp => (
                            <tr key={emp.id} onClick={() => openProfile(emp)} className="clickable-row">
                                <td className="font-mono text-xs text-blue-600 font-bold">{emp.employee_id || 'N/A'}</td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            <User size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{emp.full_name}</span>
                                            <span className="text-xs text-gray-400">{emp.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${ROLES.find(r => r.id === emp.role)?.color || 'badge-gray'}`}>
                                        {emp.role.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div className="shops-stat">
                                        <Store size={14} />
                                        <span>{emp.assigned_shops_count || 0} Shops</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${emp.status?.toLowerCase() || 'active'}`}>
                                        {emp.status || 'Active'}
                                    </span>
                                </td>
                                <td className="text-gray-400 text-xs">
                                    {emp.last_login ? new Date(emp.last_login).toLocaleString() : 'Never logged in'}
                                </td>
                                <td className="actions-cell">
                                    <div className="flex gap-1 justify-end">
                                        <button className="icon-btn-sm" onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}>
                                            <Edit size={16} />
                                        </button>
                                        <button className="icon-btn-sm delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
                            <div className="flex items-center gap-3">
                                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowModal(false)}>
                                    <ArrowLeft size={18} />
                                </button>
                                <h2>{editMode ? `Edit Access: ${formData.full_name}` : 'Create New Personnel'}</h2>
                            </div>
                        </div>
                        <form onSubmit={handleCreateOrUpdate} className="modal-body-form">
                            <div className="managed-form">
                                <div className="form-sections-grid">
                                    <div className="info-section">
                                        <h3 className="section-title">Identity & Role</h3>
                                        <div className="form-group-row">
                                            <div className="form-group">
                                                <label>Employee ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.employee_id}
                                                    onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                                    placeholder="E.g. EMP1001"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Account Status</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
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
                                        <div className="form-group-row">
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
                                        </div>
                                        <div className="form-group">
                                            <label>Role Category</label>
                                            <select
                                                value={formData.role}
                                                onChange={e => handleRoleChange(e.target.value)}
                                            >
                                                {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        {(!editMode || formData.password) && (
                                            <div className="form-group">
                                                <label>{editMode ? 'Reset Password' : 'Access Password'}</label>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    required={!editMode}
                                                    placeholder={editMode ? 'Leave blank to keep current' : 'Initialize password'}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="permissions-section">
                                        <h3 className="section-title">Regional Assignment & Access</h3>
                                        <div className="form-group">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="m-0">Assigned Areas</label>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {formData.assigned_areas.length} Selected
                                                </span>
                                            </div>
                                            
                                            <div className="area-search-wrapper">
                                                <input 
                                                    type="text" 
                                                    placeholder="Search areas (e.g. Chennai...)" 
                                                    value={areaSearch}
                                                    onChange={(e) => setAreaSearch(e.target.value)}
                                                    className="area-search-input"
                                                />
                                            </div>

                                            <div className="areas-selection-list">
                                                {areas.filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase())).map(area => (
                                                    <div 
                                                        key={area.id} 
                                                        className={`area-list-item ${formData.assigned_areas.includes(area.id) ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            const newAreas = formData.assigned_areas.includes(area.id)
                                                                ? formData.assigned_areas.filter(id => id !== area.id)
                                                                : [...formData.assigned_areas, area.id];
                                                            setFormData({ ...formData, assigned_areas: newAreas });
                                                        }}
                                                    >
                                                        <div className="check-box-sm">
                                                            {formData.assigned_areas.includes(area.id) && <Check size={10} />}
                                                        </div>
                                                        <span className="truncate">{area.name}</span>
                                                    </div>
                                                ))}
                                                {areas.filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                                                    <div className="text-center py-4 text-gray-400 text-xs italic">
                                                        No areas found matching "{areaSearch}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {formData.role !== 'custom' ? (
                                            <div className="role-preview-card">
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {formData.role === 'admin' || formData.role === 'super_admin'
                                                        ? 'Administrators have full system access including users and settings.'
                                                        : formData.role === 'manager'
                                                        ? 'Managers can manage stock, customers, and view personnel data.'
                                                        : 'Salesmen have standard access to products, customers, and sales.'}
                                                </p>
                                                <div className="preview-detailed-list">
                                                    {MODULES.filter(m => formData.permissions[m.id]?.view).map(m => {
                                                        const p = formData.permissions[m.id];
                                                        const actions = Object.keys(p).filter(k => p[k] === true);
                                                        return (
                                                            <div key={m.id} className="preview-module-detail">
                                                                <span className="module-title-alt">{m.name}</span>
                                                                <div className="module-actions-badges">
                                                                    {actions.map(action => (
                                                                        <span key={action} className="action-tag-sm">
                                                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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

                            <div className="modal-actions-alt">
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
                            <div className="flex items-center gap-3">
                                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowProfile(false)}>
                                    <ArrowLeft size={18} />
                                </button>
                                <h2>Employee Profile</h2>
                            </div>
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
                                        <div className="profile-avatar">
                                            <User size={40} />
                                        </div>
                                        <div className="profile-main-info">
                                            <div className="flex items-center gap-3">
                                                <h3>{selectedEmployee.full_name}</h3>
                                                <span className="text-2xs font-bold tracking-wider font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                    {selectedEmployee.employee_id}
                                                </span>

                                            </div>
                                            <p className="profile-contact-line"><Mail size={14} /> {selectedEmployee.email}</p>
                                            {selectedEmployee.phone && <p className="profile-contact-line"><Phone size={14} /> {selectedEmployee.phone}</p>}
                                            <div className="mt-2">
                                                <span className={`badge ${ROLES.find(r => r.id === selectedEmployee.role)?.color || 'badge-gray'}`}>
                                                    {selectedEmployee.role.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="profile-work-info">
                                            <div className="info-stat">
                                                <span className="info-label">Account Status</span>
                                                <span className={`status-pill ${selectedEmployee.status?.toLowerCase() || 'active'}`}>{selectedEmployee.status || 'Active'}</span>
                                            </div>
                                            <div className="info-stat">
                                                <span className="info-label">Last Activity</span>
                                                <span className="info-val">{selectedEmployee.last_login ? new Date(selectedEmployee.last_login).toLocaleString() : 'Never'}</span>
                                            </div>
                                            <button className="btn btn-secondary btn-sm profile-reset-btn" onClick={() => {
                                                setShowProfile(false);
                                                openEditModal(selectedEmployee);
                                                setFormData(prev => ({ ...prev, password: 'CHANGEME' })); // Visual indicator
                                            }}>
                                                <Settings2 size={14} /> Reset Password
                                            </button>
                                        </div>
                                    </div>


                                    <div className="profile-sections-row">
                                        <div className="profile-section-main">
                                            <h3 className="section-title"><TrendingUp size={16} /> Performance Metrics</h3>
                                            {performance ? (
                                                <div className="performance-stats-grid">
                                                    <div className="p-stat-card">
                                                        <span className="p-stat-label">Sales Volume</span>
                                                        <span className="p-stat-value">₹{Number(performance.total_sales_volume || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-stat-card">
                                                        <span className="p-stat-label">Orders Created</span>
                                                        <span className="p-stat-value">{performance.total_orders}</span>
                                                    </div>
                                                    <div className="p-stat-card">
                                                        <span className="p-stat-label">Collections</span>
                                                        <span className="p-stat-value text-emerald-600">₹{Number(performance.total_collections || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 italic">No activity data found.</p>
                                            )}

                                            <h3 className="section-title"><Map size={16} /> Regional Coverage ({selectedEmployee.areas?.length || 0})</h3>
                                            <div className="assigned-areas-list">
                                                {selectedEmployee.areas?.length > 0 ? (
                                                    selectedEmployee.areas.map(area => (
                                                        <div key={area.id} className="area-tag">
                                                            <MapPin size={12} />
                                                            {area.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No areas assigned.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="section-header-row">
                                        <h3 className="section-title"><Store size={16} /> Managed Shops ({assignedShops.length})</h3>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignmentModal(true)}>
                                            Modify Assignments
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
                                                <span>No shops assigned to this employee.</span>
                                                <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowAssignmentModal(true)}>
                                                    Configure Now
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
                            <div className="flex items-center gap-3">
                                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowAssignmentModal(false)}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h2>Select Targeted Shops</h2>
                                    <p className="text-xs text-gray-500">Pick the shops this salesman will manage.</p>
                                </div>
                            </div>
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
