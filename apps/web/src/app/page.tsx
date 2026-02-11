'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import './login.css'; // We will create this specific CSS file

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

      // ---------------------------------------------------------
      // REAL BACKEND LOGIN
      // ---------------------------------------------------------
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);

      // Handle redirect based on real token role
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        if (payload.role === 'FINANCE_MANAGER') {
          router.push('/dashboard/finance');
          return;
        }
      } catch (e) { }

      router.push('/dashboard');
    } catch (error) {
      alert('Login Failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Brand & Marketing */}
      <div className="login-brand-section">
        <div className="brand-pattern-overlay"></div>
        <div className="brand-content">
          <div className="logo-box">
            <ShieldCheck size={40} color="white" />
          </div>
          <h1 className="brand-heading">Master Your<br />Supply Chain.</h1>
          <p className="brand-subtext">
            Enterprise-grade inventory tracking, warehouse management, and financial reporting in one unified dashboard.
          </p>


        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-section">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to manage your inventory.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  id="email"
                  placeholder="e.g. admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role">Access Level</label>
              <div className="select-wrapper">
                <select
                  id="role"
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="BRAND_ADMIN">Brand Admin</option>
                  <option value="WAREHOUSE">Warehouse Manager</option>
                  <option value="FINANCE_MANAGER">Finance & Admin</option>
                  <option value="SALES_PERSON">Sales Person</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Authenticating...' : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
