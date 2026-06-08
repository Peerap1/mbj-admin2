// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import History from "./pages/History";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Banks from "./pages/Banks";
import Employees from "./pages/Employees";
import Salary from "./pages/Salary";
import Reports from "./pages/Reports";
import "./index.css";
import "./App.css";

function PrivateRoute({ children, menuKey }) {
  const { user, canSee } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (menuKey && !canSee(menuKey)) return <Navigate to="/sales" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/sales" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/sales" replace />} />
        <Route path="sales"     element={<PrivateRoute menuKey="sales"><Sales /></PrivateRoute>} />
        <Route path="history"   element={<PrivateRoute menuKey="history"><History /></PrivateRoute>} />
        <Route path="customers" element={<PrivateRoute menuKey="customers"><Customers /></PrivateRoute>} />
        <Route path="products"  element={<PrivateRoute menuKey="products"><Products /></PrivateRoute>} />
        <Route path="banks"     element={<PrivateRoute menuKey="banks"><Banks /></PrivateRoute>} />
        <Route path="reports"   element={<PrivateRoute menuKey="reports"><Reports /></PrivateRoute>} />
        <Route path="employees" element={<PrivateRoute menuKey="employees"><Employees /></PrivateRoute>} />
        <Route path="salary"    element={<PrivateRoute menuKey="salary"><Salary /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
