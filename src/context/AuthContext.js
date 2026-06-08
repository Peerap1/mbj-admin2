// src/context/AuthContext.js
import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mbj_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem("mbj_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("mbj_user");
  };

  const canSee = (menu) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "suser") return true;
    // user role: limited menus
    const allowed = ["sales", "history", "customers", "products"];
    return allowed.includes(menu);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canSee }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
