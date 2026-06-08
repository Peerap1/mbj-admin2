// src/components/Layout.js
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

const MenuIcon = ({ name }) => {
  const icons = {
    sales: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/><path d="M16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
    history: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>,
    manage: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
    customers: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
    products: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
    banks: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h12a2 2 0 002-2V9H2zm4 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z"/></svg>,
    salary: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>,
    employees: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
    reports: <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd"/></svg>,
  };
  return icons[name] || null;
};

const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
  </svg>
);

export default function Layout() {
  const { user, logout, canSee } = useAuth();
  const navigate = useNavigate();
  const [manageOpen, setManageOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = { admin: "ผู้ดูแลระบบ", user: "ผู้ใช้งาน", suser: "ผู้ใช้งานพิเศษ" };
  const roleBadge = { admin: "badge-primary", user: "badge-gray", suser: "badge-success" };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="9" fill="#1a56db"/>
                <path d="M10 28L20 12L30 28H10Z" fill="white" opacity="0.9"/>
                <circle cx="20" cy="20" r="4" fill="white"/>
              </svg>
            </div>
            <div>
              <div className="brand-name">MBJ Admin</div>
              <div className="brand-sub">Management System</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {canSee("sales") && (
              <NavLink to="/sales" className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <MenuIcon name="sales" /><span>การขาย</span>
              </NavLink>
            )}

            {canSee("history") && (
              <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <MenuIcon name="history" /><span>ประวัติการขาย</span>
              </NavLink>
            )}

            <div className="nav-group">
              <button className={`nav-group-toggle ${manageOpen ? "open" : ""}`}
                onClick={() => setManageOpen(!manageOpen)}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <MenuIcon name="manage" /><span>จัดการข้อมูล</span>
                </div>
                <ChevronIcon open={manageOpen} />
              </button>

              {manageOpen && (
                <div className="nav-sub">
                  {canSee("customers") && (
                    <NavLink to="/customers" className={({isActive}) => `nav-sub-item ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}>
                      <MenuIcon name="customers" /><span>ลูกค้า</span>
                    </NavLink>
                  )}
                  {canSee("products") && (
                    <NavLink to="/products" className={({isActive}) => `nav-sub-item ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}>
                      <MenuIcon name="products" /><span>สินค้า</span>
                    </NavLink>
                  )}
                  {canSee("banks") && (
                    <NavLink to="/banks" className={({isActive}) => `nav-sub-item ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}>
                      <MenuIcon name="banks" /><span>รายการธนาคาร</span>
                    </NavLink>
                  )}
                  {canSee("employees") && (
                    <NavLink to="/employees" className={({isActive}) => `nav-sub-item ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}>
                      <MenuIcon name="employees" /><span>พนักงาน</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>

            {canSee("reports") && (
              <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <MenuIcon name="reports" /><span>รายงาน</span>
              </NavLink>
            )}
            {canSee("salary") && (
              <NavLink to="/salary" className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <MenuIcon name="salary" /><span>คำนวนเงินเดือน</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <span className={`badge ${roleBadge[user?.role] || "badge-gray"}`} style={{fontSize:11}}>
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="ออกจากระบบ">
            <svg viewBox="0 0 20 20" fill="currentColor" width="17" height="17">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-wrap">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <span>{user?.username}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
