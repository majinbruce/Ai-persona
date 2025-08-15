import React, { useState } from 'react';
import axios from 'axios';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { identifier: formData.email || formData.username, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      
      if (response.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('accessToken', response.data.data.accessToken);
        onAuthSuccess(response.data.data.user);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Auth error:', error.response?.data);
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors array
        const fieldErrs = {};
        error.response.data.errors.forEach(err => {
          fieldErrs[err.field] = err.message;
        });
        setFieldErrors(fieldErrs);
        setError('Please check the highlighted fields below');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setError('User with this email or username already exists');
      } else if (error.response?.status === 401) {
        setError('Invalid email/username or password');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setError('');
    setFieldErrors({});
  };

  // Reset form when modal opens with different mode
  React.useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      resetForm();
    }
  }, [isOpen, initialMode]);

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="John"
                    className={fieldErrors.firstName ? 'error' : ''}
                  />
                  {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Doe"
                    className={fieldErrors.lastName ? 'error' : ''}
                  />
                  {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
                </div>
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  placeholder="johndoe"
                  className={fieldErrors.username ? 'error' : ''}
                />
                {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
              </div>
            </>
          )}

          <div className="form-group">
            <label>{isLogin ? 'Email or Username' : 'Email'}</label>
            <input
              type={isLogin ? 'text' : 'email'}
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder={isLogin ? 'your@email.com or username' : 'your@email.com'}
              className={fieldErrors.email || fieldErrors.identifier ? 'error' : ''}
            />
            {(fieldErrors.email || fieldErrors.identifier) && (
              <div className="field-error">{fieldErrors.email || fieldErrors.identifier}</div>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="••••••••"
              minLength={6}
              className={fieldErrors.password || fieldErrors.newPassword ? 'error' : ''}
            />
            {(fieldErrors.password || fieldErrors.newPassword) && (
              <div className="field-error">{fieldErrors.password || fieldErrors.newPassword}</div>
            )}
            {!isLogin && !fieldErrors.password && (
              <div className="password-hint">
                Password must contain at least 6 characters with uppercase, lowercase, and number
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="switch-btn" 
              onClick={switchMode}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;