import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff, ArrowRight, LayoutDashboard } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState(localStorage.getItem('company_name') || 'Inventory Pro');

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data?.company_name) {
                    setCompanyName(res.data.company_name);
                    localStorage.setItem('company_name', res.data.company_name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                setError(typeof err.response.data === 'string' ? err.response.data : 'Invalid credentials');
            } else if (err.message) {
                setError(err.message); // Show Network Error etc.
            } else {
                setError('Login failed. Please check your connection.');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="brand">
                    <div className="logo-box"><LayoutDashboard size={24} color="white" /></div>
                    <span className="brand-text-small">{companyName}</span>
                </div>
                <h1>{companyName}</h1>
                <p>Enterprise-grade inventory tracking, warehouse <br />management, and financial reporting in one unified dashboard.</p>
            </div>
            <div className="login-right">
                <div className="login-form-container">
                    <h2>Welcome Back</h2>
                    <p className="subtitle">Please enter your credentials to manage your inventory.</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="e.g. admin@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label>Password</label>
                                <a href="#" className="forgot-password">Forgot password?</a>
                            </div>
                            <div className="password-input">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="toggle-password">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>





                        <button type="submit" className="login-btn">
                            Sign In to Dashboard <ArrowRight size={18} />
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default Login;
