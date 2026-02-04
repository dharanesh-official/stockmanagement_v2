'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import './login.css'; // We will create this specific CSS file

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // ---------------------------------------------------------
      // DEMO MODE: Bypass Backend if using "demo" credentials
      // ---------------------------------------------------------
      if (email.startsWith('demo')) {
        // Create a fake JWT for the frontend to decode
        const mockPayload = {
          sub: 'demo-user',
          email: email,
          role: selectedRole, // Use the role selected in dropdown
          name: 'Demo User'
        };
        // standard jwt structure: header.payload.signature
        const mockToken = `fakeheader.${btoa(JSON.stringify(mockPayload))}.fakesignature`;

        await new Promise(r => setTimeout(r, 800)); // Fake network delay
        localStorage.setItem('access_token', mockToken);

        if (selectedRole === 'FINANCE_MANAGER') {
          router.push('/dashboard/finance');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // ---------------------------------------------------------
      // REAL BACKEND LOGIN
      // ---------------------------------------------------------
      const res = await fetch(`${apiUrl}/auth/login`, {
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
      alert('Login Failed: ' + error + '\n\nTIP: For Client Demo, use email "demo@stockpro.com" to bypass server.');
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

          <div className="trusted-badge">
            <div className="avatars">
              {/* Placeholders for avatars */}
              <div className="avatar" style={{ backgroundColor: '#FF6B6B' }}></div>
              <div className="avatar" style={{ backgroundColor: '#4ECDC4' }}></div>
              <div className="avatar" style={{ backgroundColor: '#FFE66D' }}></div>
            </div>
            <span>Trusted by 500+ global enterprises.</span>
          </div>
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
                <select id="role" className="custom-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="BRAND_ADMIN">Brand Admin</option>
                  <option value="WAREHOUSE">Warehouse Manager</option>
                  <option value="FINANCE_MANAGER">Finance & Admin</option>
                  <option value="SALES_PERSON">Sales Person</option>
                </select>
              </div>
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Keep me logged in for 30 days</label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="form-footer">
            <a href="#">Help Center</a>
            <a href="#">Contact Support</a>
            <a href="#">Privacy Policy</a>
            <p className="version-text">v4.2.1-stable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
