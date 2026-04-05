import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      {/* 3D Liquid Image Background */}
      <div className="ambient-image-bg"></div>

      <div className="app-container">
        <Sidebar />
        <main className="main-content fade-in">
          <Outlet />
        </main>
      </div>
    </>
  );
}
