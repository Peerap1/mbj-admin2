import { useState } from 'react';

const LoginPage = ({ onSubmit, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username || !password) {
      return;
    }

    onSubmit(username.trim(), password.trim());
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>เข้าสู่ระบบ</h2>
        <p>กรุณาใช้บัญชีที่กำหนดเพื่อเข้าถึงระบบ</p>
        <form onSubmit={handleSubmit}>
          <label>
            ชื่อผู้ใช้
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
          </label>
          <label>
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin1234"
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button type="submit" className="btn btn-primary">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
