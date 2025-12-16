import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // If you have CSS

const Login = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('🔍 Login button clicked');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔄 Calling login() function...');

    const result = await login(email, password);
    
    console.log('📊 Login result:', result);
    console.log('✅ Success:', result?.success);
    console.log('👤 User data:', result?.data);
    console.log('❌ Error:', result?.error);
    
    if (result.success) {
      console.log('🔄 Redirecting to dashboard...');
      // Redirect based on user role
      switch (result.data.role) {
        case 'parent':
          navigate('/parent-dashboard');
          break;
        case 'babysitter':
          navigate('/babysitter-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      console.log('❌ Login failed - setting error');
      setError(result.error);
    }
    
    setLoading(false);
    console.log('🏁 Login process completed');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to KINDER</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
        
        <div className="test-credentials">
          <p><strong>Test Credentials (Pre-filled):</strong></p>
          <p>Email: test@example.com</p>
          <p>Password: password123</p>
          <p>Role: Parent</p>
        </div>
      </div>
    </div>
  );
};

export default Login;