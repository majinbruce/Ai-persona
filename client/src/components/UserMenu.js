import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './UserMenu.css';

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      onLogout();
      setIsOpen(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || user.username?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-avatar"
        onClick={() => setIsOpen(!isOpen)}
        title={`${user.firstName || user.username}'s menu`}
      >
        {getInitials(user.firstName, user.lastName)}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-name">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.username
              }
            </div>
            <div className="user-email">{user.email}</div>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-items">
            <button className="menu-item" onClick={() => setIsOpen(false)}>
              <span className="menu-icon">👤</span>
              Profile
            </button>
            <button className="menu-item" onClick={() => setIsOpen(false)}>
              <span className="menu-icon">⚙️</span>
              Settings
            </button>
            <button className="menu-item" onClick={() => setIsOpen(false)}>
              <span className="menu-icon">💬</span>
              My Conversations
            </button>
            
            <div className="menu-divider"></div>
            
            <button className="menu-item logout" onClick={handleLogout}>
              <span className="menu-icon">🚪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;