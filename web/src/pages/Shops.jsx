import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Store,
  User,
  Phone,
  MapPin,
  Navigation,
  Map,
  ArrowLeft,
  X,
  CreditCard,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Briefcase,
  ShoppingCart
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import "./StockList.css"; // Reusing common table/page styles
import "./Shops.css";

const Shops = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAreaName, setEditAreaName] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [historyTab, setHistoryTab] = useState("orders");
  const [allTransactions, setAllTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    address: "",
    phone: "",
    email: "",
    customer_id: "",
    salesman_id: "",
    location: "",
    area_id: "",
    shop_code: "",
    shop_type: "Retail",
    city: "",
    state: "",
    pincode: "",
    credit_limit: 0,
    notes: "",
    status: "Active",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.role === "admin") {
        fetchEmployees();
      }
    }
    fetchAreas();
    fetchShops();
    fetchCustomers();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await api.get("/areas");
      setAreas(response.data);
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await api.get("/shops");
      setShops(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching shops:", error);
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/users");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const hasPermission = (module, action) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const permissions = user.permissions || {};
    return permissions[module]?.[action] === true;
  };

  const openHistory = async (shop) => {
    try {
      setSelectedShop(shop);
      setHistoryLoading(true);
      const res = await api.get("/sales"); // This will be filtered by salesman if applicable
      const shopSales = res.data.filter((t) => t.shop_id === shop.id);
      setAllTransactions(shopSales);
      setShowHistory(true);
      setHistoryTab("orders");
    } catch (err) {
      console.error(err);
      alert("Failed to load shop history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateOrUpdateShop = async (e) => {
    e.preventDefault();

    // Validation: All fields mandatory
    if (!formData.name || !formData.address || !formData.phone || !formData.email || !formData.area_id || !formData.city || !formData.state || !formData.pincode) {
        alert("All fields are mandatory (Name, Address, Phone, Email, Area, City, State, Pincode)");
        return;
    }

    // Phone validation: should be exactly 10 digits
    const phoneDigits = formData.phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!formData.shop_code) {
      alert("Shop Code is mandatory");
      return;
    }

    const finalData = {
      ...formData,
      phone: `+91 ${phoneDigits}`,
    };

    try {
      if (formData.id) {
        await api.put(`/shops/${formData.id}`, finalData);
      } else {
        await api.post("/shops", finalData);
      }
      setShowModal(false);
      resetForm();
      fetchShops();
    } catch (error) {
      alert("Failed to save shop");
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      address: "",
      phone: "",
      email: "",
      customer_id: "",
      salesman_id: "",
      location: "",
      area_id: selectedArea ? selectedArea.id : "",
      shop_code: "",
      shop_type: "Retail",
      city: "",
      state: "",
      pincode: "",
      credit_limit: 0,
      notes: "",
      status: "Active",
    });
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      await api.post('/areas', { name: newAreaName.trim() });
      setNewAreaName('');
      fetchAreas();
    } catch (err) {
      alert('Failed to save Area. It might already exist.');
    }
  };

  const handleUpdateArea = async (areaId) => {
    if (!editAreaName.trim()) return;
    try {
      await api.put(`/areas/${areaId}`, { name: editAreaName.trim() });
      setEditingAreaId(null);
      fetchAreas();
      fetchShops();
    } catch (err) {
      alert('Failed to update Area. Name might exist.');
    }
  };

  const handleDeleteArea = async (areaId, areaName) => {
    if (!window.confirm(`Are you sure you want to delete the Area "${areaName}"? Shops in this area will lose their area assignment.`)) return;
    try {
      await api.delete(`/areas/${areaId}`);
      fetchAreas();
      fetchShops();
      if (selectedArea && selectedArea.id === areaId) setSelectedArea(null);
    } catch (err) {
      alert('Failed to delete Area.');
    }
  };

  const openEditShop = (shop) => {
    // Strip prefix for editing
    const rawPhone = shop.phone ? shop.phone.replace("+91 ", "") : "";
    setFormData({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      phone: rawPhone,
      email: shop.email || "",
      customer_id: shop.customer_id,
      salesman_id: shop.salesman_id || "",
      location: shop.location || "",
      area_id: shop.area_id || "",
      shop_code: shop.shop_code || "",
      shop_type: shop.shop_type || "Retail",
      city: shop.city || "",
      state: shop.state || "",
      pincode: shop.pincode || "",
      credit_limit: shop.credit_limit || 0,
      notes: shop.notes || "",
      status: shop.status || "Active",
    });
    setShowModal(true);
  };

  const handleGetDirections = (location) => {
    if (!location) return;
    if (location.startsWith("http://") || location.startsWith("https://")) {
      window.open(location, "_blank");
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, "_blank");
    }
  };

  const handleDeleteShop = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shop?")) return;
    try {
      await api.delete(`/shops/${id}`);
      fetchShops();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredShops = shops.filter((shop) => {
    const matchesArea = selectedArea ? shop.area_id === selectedArea.id : true;
    const matchesStatus = statusFilter === "All" ? true : shop.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      (shop.name || "").toLowerCase().includes(query) ||
      (shop.shop_code || "").toLowerCase().includes(query) ||
      (shop.phone || "").includes(search);
    return matchesArea && matchesSearch && matchesStatus;
  });

  const getAreaShopCount = (areaId) => {
    return shops.filter((s) => s.area_id === areaId).length;
  };

  return (
    <div className="stock-page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {selectedArea && (
            <button
              className="icon-btn"
              onClick={() => setSelectedArea(null)}
              style={{
                padding: "8px",
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1>
              {selectedArea
                ? `${selectedArea.name} - Shops`
                : "Shop Management"}
            </h1>
            <p className="subtitle">
              {selectedArea
                ? "Manage branches in this area."
                : "Select an area to view shops or manage branches."}
            </p>
          </div>
        </div>
        <div className="header-actions">
          {!selectedArea && (user?.role === 'admin' || user?.role === 'super_admin') && (
            <button className="btn btn-secondary" onClick={() => setShowAreaModal(true)}>
              <Map size={18} /> Manage Areas
            </button>
          )}   {hasPermission("shops", "create") && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus size={18} /> Add Shop
            </button>
          )}
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-box">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by Shop Name, Code or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <div className="filter-item">
            <label className="filter-label">Status</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Temporarily Closed">Temporarily Closed</option>
            </select>
          </div>
        </div>
      </div>
      {!selectedArea ? (
        <div className="area-grid">
          {areas.map((area) => (
            <div
              key={area.id}
              className="area-card"
              onClick={() => setSelectedArea(area)}
            >
              <div className="area-card-header">
                <div className="area-icon-wrap">
                  <Map size={24} color="#059669" />
                </div>
                <div>
                  <h3 className="area-title">{area.name}</h3>
                  <p className="area-meta">{area.total_shops} Registered Shops</p>
                </div>
              </div>
              <div className="area-metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Total Sales</span>
                  <span className="metric-value positive">₹{Number(area.total_sales || 0).toLocaleString()}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Dues</span>
                  <span className="metric-value negative">₹{Number(area.pending_payments || 0).toLocaleString()}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Low Stock</span>
                  <span className="metric-value warning">{area.low_stock_shops || 0} Shops</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Orders</span>
                  <span className="metric-value">{area.total_shops > 0 ? 'Managed' : 'Empty'}</span>
                </div>
              </div>
            </div>
          ))}
          {areas.length === 0 && (
            <div className="placeholder-view">
              No areas found. Add an area to get started.
            </div>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>S.No</th>
                <th>SHOP DETAILS</th>
                <th>STATUS</th>
                <th>FINANCE</th>
                <th>ACTIVITY</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    Loading shops...
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop, index) => (
                  <tr
                    key={shop.id}
                    onClick={() => openHistory(shop)}
                    className="clickable-row"
                  >
                    <td className="sno-cell">{index + 1}</td>
                    <td className="product-cell">
                      <div className="flex flex-col gap-1">
                        <span className="product-name font-bold text-gray-900">
                          {shop.name}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">ID: {shop.shop_code || (shop.id ? String(shop.id).slice(0, 8).toUpperCase() : '')}</span>
                           <span className="text-xs text-blue-600 font-semibold">{shop.shop_type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <User size={10} /> {shop.customer_name}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${shop.status.toLowerCase().replace(/ /g, '-')}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs gap-4">
                          <span className="text-gray-500">Orders:</span>
                          <span className="font-bold">{shop.total_orders || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs gap-4">
                          <span className="text-gray-500">Balance:</span>
                          <span className={`font-bold ${Number(shop.outstanding_balance) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ₹{Number(shop.outstanding_balance || 0).toLocaleString()}
                          </span>
                        </div>
                        {Number(shop.credit_limit) > 0 && (
                           <div className="text-[10px] text-gray-400">Limit: ₹{Number(shop.credit_limit).toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td>
                       <div className="flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center gap-1 text-gray-600">
                             <Clock size={10} /> Last: {shop.last_order_date ? new Date(shop.last_order_date).toLocaleDateString() : 'Never'}
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                             <Briefcase size={10} /> By: {shop.salesman_name || 'Admin'}
                          </div>
                       </div>
                    </td>
                    <td className="actions-cell">
                      <div className="flex gap-1 justify-end">
                        {shop.location && (
                          <button
                            className="icon-btn-sm"
                            title="Get Directions"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(shop.location);
                            }}
                          >
                            <Navigation size={16} className="text-blue-500" />
                          </button>
                        )}
                        <button
                          className="icon-btn-sm"
                          title="New Order"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/dashboard/create-order', { state: { shopId: shop.id } });
                          }}
                        >
                          <ShoppingCart size={16} className="text-blue-600" />
                        </button>
                        <button
                          className="icon-btn-sm"
                          title="View Finance"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/dashboard/finance', { state: { shopId: shop.id } });
                          }}
                        >
                          <CreditCard size={16} className="text-emerald-600" />
                        </button>
                        {hasPermission("shops", "edit") && (
                          <button
                            className="icon-btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditShop(shop);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasPermission("shops", "delete") && (
                          <button
                            className="icon-btn-sm delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShop(shop.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && filteredShops.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    No shops found match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Area Modal */}
      {showAreaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <div className="flex items-center gap-3">
                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => { setShowAreaModal(false); setEditingAreaId(null); }}>
                  <ArrowLeft size={18} />
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Manage Sub-Areas & Districts</h2>
              </div>
            </div>

            <form onSubmit={handleCreateArea} style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Add New Area... (e.g. Chennai Central)"
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                required
                style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', whiteSpace: 'nowrap', borderRadius: '8px' }}>Add Area</button>
            </form>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fafafa' }}>
              {areas.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>No areas defined yet. Create your first area above.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {areas.map((area, idx) => (
                    <li key={area.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: idx === areas.length - 1 ? 'none' : '1px solid #e5e7eb', backgroundColor: 'white' }}>
                      {editingAreaId === area.id ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '16px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editAreaName}
                            onChange={e => setEditAreaName(e.target.value)}
                            style={{ flex: 1, padding: '10px 12px', border: '2px solid #059669', borderRadius: '6px', fontSize: '15px' }}
                            autoFocus
                          />
                          <button type="button" onClick={() => handleUpdateArea(area.id)} className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save</button>
                          <button type="button" onClick={() => setEditingAreaId(null)} className="btn btn-secondary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '10px' }}>
                              <Map size={24} color="#059669" />
                            </div>
                            <div>
                              <span style={{ fontWeight: '600', color: '#111827', fontSize: '16px', display: 'block' }}>{area.name}</span>
                              <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', display: 'block' }}>{getAreaShopCount(area.id)} Registered Shops</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setEditingAreaId(area.id); setEditAreaName(area.name); }} className="icon-btn" title="Edit Area" style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}><Edit size={18} color="#4b5563" /></button>
                            <button onClick={() => handleDeleteArea(area.id, area.name)} className="icon-btn delete-btn" title="Delete Area" style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}><Trash2 size={18} color="#ef4444" /></button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowModal(false)}>
                  <ArrowLeft size={18} />
                </button>
                <h2>{formData.id ? "Edit Shop" : "Add New Shop"}</h2>
              </div>
            </div>
            <form onSubmit={handleCreateOrUpdateShop} className="shop-form">
                <div className="managed-form">
                  <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label>Shop Name</label>
                    <input
                      type="text"
                      placeholder="Enter business name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Shop Code / ID</label>
                    <input
                      type="text"
                      placeholder="SH-001"
                      value={formData.shop_code}
                      onChange={(e) => setFormData({ ...formData, shop_code: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Shop Type</label>
                    <select
                      value={formData.shop_type}
                      onChange={(e) => setFormData({ ...formData, shop_type: e.target.value })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Wholesale">Wholesale</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Area</label>
                    <select
                      value={formData.area_id || ""}
                      onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                      required
                    >
                      <option value="">Select Area</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Temporarily Closed">Temporarily Closed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Customer</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      required
                    >
                      <option value="">Select Primary Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Salesman</label>
                    <select
                      value={formData.salesman_id}
                      onChange={(e) => setFormData({ ...formData, salesman_id: e.target.value })}
                      disabled={user?.role !== 'admin' && user?.role !== 'super_admin'}
                    >
                      <option value="">{(user?.role === 'admin' || user?.role === 'super_admin') ? 'Assign Later' : user?.full_name}</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="business@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Credit Limit (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="flex items-center">
                      <div className="phone-prefix">+91</div>
                      <input
                        type="text"
                        className="phone-input"
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10)})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input type="text" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" value={formData.pincode || ''} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                  </div>

                  <div className="form-group full-width">
                    <label>Physical Address</label>
                    <textarea
                      placeholder="Door No, Street Name..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      style={{ minHeight: "80px" }}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Maps / Location Link</label>
                    <input
                      type="url"
                      placeholder="Paste Google Maps URL"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Internal Notes</label>
                    <textarea
                      placeholder="Preferred delivery time, etc."
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{ minHeight: "60px" }}
                    />
                  </div>
                  </div>
                </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop History Modal */}
      {showHistory && selectedShop && (
        <div className="modal-overlay">
          <div className="modal-content history-modal">
            <div className="modal-header history-header">
              <div className="flex items-center gap-3">
                <button type="button" className="icon-btn-rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 transition-colors" onClick={() => setShowHistory(false)}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedShop.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Owner: {selectedShop.customer_name} | Code: {selectedShop.shop_code}
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => navigate('/dashboard/create-order', { state: { shopId: selectedShop.id } })}
              >
                <Plus size={16} /> New Transaction
              </button>
            </div>

            <div className="history-stats">
              <div className="h-stat-card">
                <span className="h-stat-label">Total Orders</span>
                <span className="h-stat-value">
                  {allTransactions.filter((t) => t.type === "order").length}
                </span>
              </div>
              <div className="h-stat-card">
                <span className="h-stat-label">Total Paid</span>
                <span className="h-stat-value text-emerald-600">
                  ₹
                  {allTransactions
                    .filter((t) => t.type === "payment")
                    .reduce((sum, t) => sum + Number(t.total_amount), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="h-stat-card">
                <span className="h-stat-label">Current Due</span>
                <span className="h-stat-value text-rose-600">
                  ₹
                  {allTransactions
                    .filter((t) => t.type === "order")
                    .reduce(
                      (sum, t) =>
                        sum +
                        (Number(t.total_amount) - Number(t.paid_amount || 0)),
                      0,
                    )
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="history-tabs">
              <button
                className={`h-tab ${historyTab === "orders" ? "active" : ""}`}
                onClick={() => setHistoryTab("orders")}
              >
                Order History
              </button>
              <button
                className={`h-tab ${historyTab === "payments" ? "active" : ""}`}
                onClick={() => setHistoryTab("payments")}
              >
                Payment History
              </button>
              <button
                className={`h-tab ${historyTab === "dues" ? "active" : ""}`}
                onClick={() => setHistoryTab("dues")}
              >
                Due Details
              </button>
            </div>

            <div className="history-content">
              {historyLoading ? (
                <div className="loading-cell p-20">
                  Refreshing history and financial data...
                </div>
              ) : (
                <>
                  {historyTab === "orders" && (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransactions.filter((t) => t.type === "order")
                          .length > 0 ? (
                          allTransactions
                            .filter((t) => t.type === "order")
                            .map((t) => (
                              <tr key={t.id}>
                                <td>
                                  {new Date(
                                    t.transaction_date,
                                  ).toLocaleDateString()}
                                </td>
                                <td>
                                  ₹{Number(t.total_amount).toLocaleString()}
                                </td>
                                <td>
                                  ₹{Number(t.paid_amount || 0).toLocaleString()}
                                </td>
                                <td className="text-rose-600">
                                  ₹
                                  {(
                                    Number(t.total_amount) -
                                    Number(t.paid_amount || 0)
                                  ).toLocaleString()}
                                </td>
                                <td>
                                  <span
                                    className={`status-pill ${(String(t.status || "unknown")).toLowerCase().replace(" ", "-")}`}
                                  >
                                    {t.status || "Unknown"}
                                  </span>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center p-8 text-gray-500"
                            >
                              No orders found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {historyTab === "payments" && (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allTransactions || []).filter((t) => t.type === "payment")
                          .length > 0 ? (
                          allTransactions
                            .filter((t) => t.type === "payment")
                            .map((t) => (
                              <tr key={t.id}>
                                <td>
                                  {new Date(
                                    t.transaction_date,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="text-emerald-600">
                                  ₹{Number(t.total_amount).toLocaleString()}
                                </td>
                                <td className="text-gray-500 italic">
                                  {t.notes || "No notes"}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="text-center p-8 text-gray-500"
                            >
                              No payments found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}

                  {historyTab === "dues" && (
                    <div className="dues-view">
                      <p className="p-4 bg-rose-50 text-rose-800 rounded-lg text-sm border border-rose-200">
                        These are the individual outstanding amounts for current
                        active orders in this shop.
                      </p>
                      <table className="history-table mt-4">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Pending Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allTransactions
                            .filter(
                              (t) =>
                                t.type === "order" &&
                                Number(t.total_amount) -
                                Number(t.paid_amount || 0) >
                                0,
                            )
                            .map((t) => (
                              <tr key={t.id}>
                                <td className="font-mono text-xs">
                                  #{String(t.id).slice(0, 8).toUpperCase()}
                                </td>
                                <td>
                                  {new Date(
                                    t.transaction_date,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="text-rose-600 font-bold">
                                  ₹
                                  {(
                                    Number(t.total_amount) -
                                    Number(t.paid_amount || 0)
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
