import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    ArrowLeft, 
    Download, 
    Calendar, 
    Filter,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './CustomerLedger.css';

const CustomerLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ledger, setLedger] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchLedgerData();
    }, [id]);

    const fetchLedgerData = async () => {
        try {
            setLoading(true);
            const [custRes, saleRes] = await Promise.all([
                api.get(`/customers/${id}`),
                api.get('/sales', { params: { customer_id: id } })
            ]);
            
            setCustomer(custRes.data);
            
            // Sort by date ascending to calculate running balance
            const transactions = saleRes.data.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
            
            let currentBalance = 0;
            const ledgerWithBalance = transactions.map(tx => {
                if (tx.type === 'order' || tx.type === 'sale') {
                    currentBalance += Number(tx.total_amount);
                } else {
                    currentBalance -= Number(tx.total_amount);
                }
                return { ...tx, running_balance: currentBalance };
            });

            setLedger(ledgerWithBalance.reverse()); // Show newest first
            setLoading(false);
        } catch (err) {
            console.error('Ledger fetch error:', err);
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!ledger.length) return;
        const headers = ["Date", "Transaction ID", "Type", "Particulars", "Debit (+)", "Credit (-)", "Balance"].join(',');
        const rows = ledger.map(tx => {
            const date = new Date(tx.transaction_date).toLocaleDateString('en-GB');
            const type = tx.type.toUpperCase();
            const debit = (tx.type === 'order' || tx.type === 'sale') ? tx.total_amount : '-';
            const credit = (tx.type !== 'order' && tx.type !== 'sale') ? tx.total_amount : '-';
            return `"${date}","${tx.id.slice(0,8)}","${type}","${tx.notes || ''}","${debit}","${credit}","${tx.running_balance}"`;
        }).join('\n');
        
        const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ledger_${customer?.full_name}_${new Date().toLocaleDateString()}.csv`;
        a.click();
    };

    if (loading) return <LoadingSpinner fullScreen message="Generating account ledger..." />;
    if (!customer) return <div className="ledger-error">Customer records not found.</div>;

    return (
        <div className="ledger-page">
            <div className="ledger-header">
                <div className="header-left">
                    <button className="back-btn-led" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="customer-info-led">
                        <h1>Account Ledger</h1>
                        <p>{customer.full_name} <span className="id-led">CUST-{customer.id.slice(0,8)}</span></p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="ledger-stats">
                        <div className="stat-led">
                            <label>Starting Balance</label>
                            <span>₹0.00</span>
                        </div>
                        <div className="stat-led highlight">
                            <label>Closing Balance</label>
                            <span className={customer.balance > 0 ? 'text-danger' : 'text-success'}>
                                ₹{Number(customer.balance).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <button className="btn-export-led" onClick={exportToCSV}>
                        <Download size={18} /> Export Statement
                    </button>
                </div>
            </div>

            <div className="ledger-filters">
                <div className="date-group">
                    <Calendar size={16} />
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span>to</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <div className="search-group">
                    <Filter size={16} />
                    <input type="text" placeholder="Filter transactions..." />
                </div>
            </div>

            <div className="ledger-table-container">
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>TX-ID</th>
                            <th>PARTICULARS</th>
                            <th className="text-right">DEBIT (+)</th>
                            <th className="text-right">CREDIT (-)</th>
                            <th className="text-right">BALANCE</th>
                            <th className="text-center">DOC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledger.length === 0 ? (
                            <tr><td colSpan="7" className="empty-ledger">No transactions found for the selected period.</td></tr>
                        ) : ledger.map(tx => {
                            const isDebit = tx.type === 'order' || tx.type === 'sale';
                            return (
                                <tr key={tx.id} className={isDebit ? 'debit-row' : 'credit-row'}>
                                    <td className="date-col">
                                        <div className="date-wrapper">
                                            <span className="d">{new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                            <span className="y">{new Date(tx.transaction_date).getFullYear()}</span>
                                        </div>
                                    </td>
                                    <td className="id-col">
                                        <span className="type-tag">{tx.type}</span>
                                        <small>{tx.id.slice(0, 8)}</small>
                                    </td>
                                    <td className="particulars-col">
                                        <div className="particulars">
                                            {isDebit ? <ArrowUpRight size={14} className="icon-debit" /> : <ArrowDownLeft size={14} className="icon-credit" />}
                                            <span>{tx.notes || (isDebit ? 'Goods Sold' : 'Payment Received')}</span>
                                        </div>
                                        {tx.shop_name && <small className="shop-ref">@ {tx.shop_name}</small>}
                                    </td>
                                    <td className="text-right debit-val">
                                        {isDebit ? `₹${Number(tx.total_amount).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="text-right credit-val">
                                        {!isDebit ? `₹${Number(tx.total_amount).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="text-right balance-val">
                                        ₹{Number(tx.running_balance).toLocaleString()}
                                    </td>
                                    <td className="text-center">
                                        <button className="view-doc-btn" onClick={() => navigate(`/dashboard/invoice/${tx.id}`)}>
                                            <FileText size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerLedger;
