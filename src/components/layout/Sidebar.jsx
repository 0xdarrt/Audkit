import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Bell, Users, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <div className="sidebar-trigger" onClick={() => setIsOpen(true)}>
        <Menu size={24} className="menu-icon" />
      </div>

      {isOpen && (
        <div className="sidebar-backdrop fade-in" onClick={() => setIsOpen(false)}></div>
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="logo-container" style={{ marginBottom: '40px', padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NavLink to="/" end onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-text" style={{ fontSize: '32px', margin: 0 }}>Audkit</div>
          </NavLink>
          <button className="btn-ghost" style={{ padding: '6px', border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <ul className="nav-menu" style={{ flex: 1 }}>
          <NavLink to="/" end onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={22} className="nav-icon" /> <span className="nav-label">Overview</span>
          </NavLink>
          <NavLink to="/assets" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Wallet size={22} className="nav-icon" /> <span className="nav-label">Assets</span>
          </NavLink>
          <NavLink to="/reminders" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Bell size={22} className="nav-icon" /> <span className="nav-label">Reminders</span>
          </NavLink>
          <NavLink to="/family" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} className="nav-icon" /> <span className="nav-label">Family</span>
          </NavLink>
        </ul>

        <button onClick={signOut} className="btn-ghost nav-item" style={{ width: '100%', border: 'none', justifyContent: 'flex-start', color: 'var(--red)', background: 'transparent', boxShadow: 'none' }}>
          <LogOut size={22} className="nav-icon" /> <span className="nav-label">Sign Out</span>
        </button>
      </aside>
    </>
  );
}
