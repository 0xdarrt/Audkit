import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      {/* Liquid Glass Ambient Background */}
      <div className="ambient-container">
        <div className="ambient-blob-gold"></div>
        <div className="ambient-blob-blue"></div>
        <div className="ambient-blob-purple"></div>
      </div>

      <div className="app-container">
        <Sidebar />
        <main className="main-content fade-in">
          <Outlet />
        </main>
      </div>
    </>
  );
}
