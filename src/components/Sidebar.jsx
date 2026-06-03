const Sidebar = ({ currentUser, activePage, onNavigate, menuOptions, pages, subpageMap }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>MBJ</span>
        <small>Admin Panel</small>
      </div>

      <nav className="menu">
        {menuOptions.includes('sales') && (
          <button className={activePage === 'sales' ? 'menu-item active' : 'menu-item'} onClick={() => onNavigate('sales')}>
            การขาย
          </button>
        )}
        {menuOptions.includes('history') && (
          <button className={activePage === 'history' ? 'menu-item active' : 'menu-item'} onClick={() => onNavigate('history')}>
            ประวัติการขาย
          </button>
        )}
        {menuOptions.includes('manage') && (
          <div className="menu-group">
            <div className="menu-title">จัดการข้อมูล</div>
            <button className={activePage === 'manage' ? 'menu-item nested' : 'menu-item nested'} onClick={() => onNavigate('manage')}>
              {subpageMap.customers}
            </button>
            <button className="menu-item nested" onClick={() => onNavigate('manage')}>
              {subpageMap.products}
            </button>
            {currentUser.role !== 'user' && (
              <button className="menu-item nested" onClick={() => onNavigate('manage')}>
                {subpageMap.banks}
              </button>
            )}
          </div>
        )}
        {menuOptions.includes('reports') && (
          <button className={activePage === 'reports' ? 'menu-item active' : 'menu-item'} onClick={() => onNavigate('reports')}>
            รายงาน
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <p>สิทธิ์: {currentUser.role}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
