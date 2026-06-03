// src/pages/Sales.js
import React, { useState, useEffect } from "react";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";
import { useAuth } from "../context/AuthContext";

export default function Sales() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ customerId: "", bankId: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const u1 = getCustomers(setCustomers);
    const u2 = getProducts(setProducts);
    const u3 = getBanks(setBanks);
    return () => { u1(); u2(); u3(); };
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty, 0);

  const handleSubmit = async () => {
    if (!form.customerId) { alert("กรุณาเลือกลูกค้า"); return; }
    if (cart.length === 0) { alert("กรุณาเพิ่มสินค้า"); return; }
    setLoading(true);
    try {
      const customer = customers.find((c) => c.id === form.customerId);
      const bank = banks.find((b) => b.id === form.bankId);
      await addSale({
        customerId: form.customerId,
        customerName: customer?.name || "",
        bankId: form.bankId,
        bankName: bank?.name || "",
        items: cart,
        total,
        note: form.note,
        createdBy: user?.username,
        status: "completed",
      });
      setCart([]);
      setForm({ customerId: "", bankId: "", note: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">การขาย</h2>
          <p className="page-subtitle">สร้างรายการขายใหม่</p>
        </div>
      </div>

      {success && (
        <div className="alert-success">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          บันทึกรายการขายสำเร็จ!
        </div>
      )}

      <div className="sales-grid">
        {/* LEFT: Form + Products */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* Sale Info */}
          <div className="card">
            <h3 style={{ fontSize:15, marginBottom:16, color:"var(--gray-800)" }}>ข้อมูลการขาย</h3>
            <div className="form-row">
              <div className="form-group">
                <label>ลูกค้า *</label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ธนาคาร</label>
                <select value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })}>
                  <option value="">-- เลือกธนาคาร --</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.name} - {b.accountNo}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>หมายเหตุ</label>
              <input type="text" placeholder="หมายเหตุ (ถ้ามี)" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <h3 style={{ fontSize:15, marginBottom:14, color:"var(--gray-800)" }}>เลือกสินค้า</h3>
            {products.length === 0 ? (
              <div className="empty-state"><div className="icon">📦</div><p>ยังไม่มีสินค้า</p></div>
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                    <div className="product-name">{p.name}</div>
                    <div className="product-price">฿{Number(p.price || 0).toLocaleString()}</div>
                    {p.unit && <div className="product-unit">{p.unit}</div>}
                    <div className="product-add">+ เพิ่ม</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="card cart-card">
          <h3 style={{ fontSize:15, marginBottom:16, color:"var(--gray-800)" }}>รายการสินค้า</h3>
          {cart.length === 0 ? (
            <div className="empty-state"><div className="icon">🛒</div><p>ยังไม่มีสินค้าในรายการ</p></div>
          ) : (
            <>
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                      <input type="number" className="qty-input" value={item.qty} min="1"
                        onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)} />
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                    <div className="cart-item-price">฿{(Number(item.price || 0) * item.qty).toLocaleString()}</div>
                    <button className="cart-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>ยอดรวม</span>
                <span className="total-amount">฿{total.toLocaleString()}</span>
              </div>
              <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", marginTop:14 }}
                onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner" /> : "บันทึกการขาย"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
