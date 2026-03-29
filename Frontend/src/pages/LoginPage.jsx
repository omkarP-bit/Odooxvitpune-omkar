import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, companySignup } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    companyName: '',
    country: 'India',
    adminName: '',
    email: '',
    password: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Email and password required');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { companyName, country, adminName, email, password } = signupForm;
    if (!companyName || !adminName || !email || !password) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await companySignup(signupForm);
      toast.success('Company created! You are now logged in.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <span className="brand-dot" />
          ReimburseFlow
        </div>
        <div className="auth-subtitle">
          {mode === 'login' ? 'Sign in to manage your expenses' : 'Register your company to get started'}
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="form-group">
              <label>Company Name</label>
              <input
                placeholder="Acme Pvt Ltd"
                value={signupForm.companyName}
                onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <select value={signupForm.country} onChange={(e) => setSignupForm({ ...signupForm, country: e.target.value })}>
                <option>India</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>Japan</option>
              </select>
            </div>
            <div className="form-group">
              <label>Admin Name</label>
              <input
                placeholder="Your full name"
                value={signupForm.adminName}
                onChange={(e) => setSignupForm({ ...signupForm, adminName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="admin@company.com"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              {submitting ? 'Creating Company...' : 'Create Company & Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); }}>
                Register Company
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>
                Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
