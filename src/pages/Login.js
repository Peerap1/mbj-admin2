// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../firebase/database";
import "./Login.css";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) navigate("/sales");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userData = await loginUser(form.username.trim(), form.password);
      if (userData) {
        login(userData);
        navigate("/sales");
      } else {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-shape s1" />
        <div className="login-shape s2" />
        <div className="login-shape s3" />
      </div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1a56db"/>
              <path d="M10 28L20 12L30 28H10Z" fill="white" opacity="0.9"/>
              <circle cx="20" cy="20" r="4" fill="white"/>
            </svg>
          </div>
          <h1>MBJ Admin</h1>
          <p>ระบบจัดการธุรกิจ</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>ชื่อผู้ใช้</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="กรอกชื่อผู้ใช้"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-field">
            <label>รหัสผ่าน</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              </span>
              <input
                type={showPw ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="login-error"><span>⚠</span> {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2024 MBJ Admin System</p>
        </div>
      </div>
    </div>
  );
}
