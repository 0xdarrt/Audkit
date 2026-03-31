import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Check your email for the confirmation link');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page active fade-in" style={{ justifyContent: 'center' }}>
      <nav className="top-navbar" style={{ position: 'absolute', top: 0, width: '100%' }}>
        <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="logo-text" style={{ fontSize: '32px', margin: 0, opacity: 1 }}>Audkit</div>
        </div>
      </nav>

      <div className="auth-container" style={{ paddingTop: '80px' }}>
        <div className="auth-card fade-in">
          <h2 className="page-heading" style={{ color: 'var(--accent)', marginBottom: '8px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>
            Family financial clarity made simple
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'left' }}>{error}</div>}
            
            <input 
              type="email" 
              placeholder="Email address" 
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Processing...' : (isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18}/> Sign Up</>)}
            </button>
          </form>

          <div style={{ margin: '24px 0', borderTop: '1px solid var(--border)', position: 'relative' }}>
            <span style={{ 
              position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg2)', padding: '0 12px', color: 'var(--text3)', fontSize: '12px'
            }}>OR</span>
          </div>

          <button type="button" onClick={signInWithGoogle} className="btn-ghost" style={{ width: '100%' }}>
            Continue with Google
          </button>

          <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text2)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
