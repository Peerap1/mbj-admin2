import { useEffect, useMemo, useState } from 'react';
import { initDatabase, fetchData, signInWithUsernameAndPassword, signOutUser, onAuthChanged } from './firebase.js';
import LoginPage from './pages/LoginPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ManagePage from './pages/ManagePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import Sidebar from './components/Sidebar.jsx';

const pages = {
  sales: 'การขาย',
  history: 'ประวัติการขาย',
  manage: 'จัดการข้อมูล',
  reports: 'รายงาน',
};

const allowedMenu = {
  admin: ['sales', 'history', 'manage', 'reports'],
  suser: ['sales', 'history', 'manage', 'reports'],
  user: ['sales', 'history', 'manage'],
};

const subpageMap = {
  customers: 'ลูกค้า',
  products: 'สินค้า',
  banks: 'รายการธนาคาร',
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('sales');
  const [activeManageTab, setActiveManageTab] = useState('customers');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        const loaded = await fetchData();
        setData(loaded);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChanged((fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
        return;
      }

      const username = fbUser.email?.split('@')[0];
      const matchedUser = Object.values(data.users || {}).find((user) => user.username === username);

      if (matchedUser) {
        setCurrentUser(matchedUser);
      } else {
        setCurrentUser({ username, role: 'user', name: username });
      }
    });

    return unsubscribe;
  }, [data.users]);

  const menuOptions = useMemo(() => {
    if (!currentUser) return [];
    return allowedMenu[currentUser.role] || [];
  }, [currentUser]);

  const handleLogin = async (username, password) => {
    setError('');
    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    try {
      await signInWithUsernameAndPassword(username, password);
      const matchedUser = Object.values(data.users || {}).find((user) => user.username === username);
      if (matchedUser) {
        setCurrentUser(matchedUser);
        setActivePage('sales');
      } else {
        setError('ล็อกอินสำเร็จ แต่ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล');
      }
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('ไม่สามารถเข้าสู่ระบบได้ โปรดลองใหม่อีกครั้ง');
      }
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setActivePage('sales');
    setError('');
  };

  const handlePageChange = (page) => {
    setError('');
    setActivePage(page);
  };

  const renderPage = () => {
    if (!currentUser) {
      return <LoginPage onSubmit={handleLogin} error={error} />;
    }

    if (loading) {
      return <div className="panel">กำลังโหลดข้อมูล...</div>;
    }

    if (!menuOptions.includes(activePage)) {
      return <div className="panel">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    }

    switch (activePage) {
      case 'sales':
        return <SalesPage user={currentUser} products={data.products} customers={data.customers} />;
      case 'history':
        return <HistoryPage sales={data.sales} />;
      case 'manage':
        return (
          <ManagePage
            activeTab={activeManageTab}
            customers={data.customers}
            products={data.products}
            banks={data.banks}
            onTabChange={setActiveManageTab}
            canShowBank={currentUser.role !== 'user' || currentUser.role === 'admin' || currentUser.role === 'suser'}
          />
        );
      case 'reports':
        return <ReportsPage data={data} />;
      default:
        return <SalesPage user={currentUser} products={data.products} customers={data.customers} />;
    }
  };

  return (
    <div className="app-shell">
      {currentUser && (
        <Sidebar
          currentUser={currentUser}
          activePage={activePage}
          onNavigate={handlePageChange}
          menuOptions={menuOptions}
          pages={pages}
          subpageMap={subpageMap}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <div>
            <h1>MBJ Admin</h1>
            {currentUser && <p>สวัสดี {currentUser.name} ({currentUser.role})</p>}
          </div>
          {currentUser && (
            <button className="btn btn-ghost" onClick={handleLogout}>
              ออกจากระบบ
            </button>
          )}
        </header>
        <main>{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
