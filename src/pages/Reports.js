// src/pages/Reports.js
import React, { useState, useEffect } from "react";
import { getSales, getCustomers, getProducts } from "../firebase/database";

const StatCard = ({ label, value, sub, color = "var(--primary)", icon }) => (
  <div className="card" style={{ display:"flex", alignItems:"center", gap:16 }}>
    <div style={{ width:48, height:48, borderRadius:12, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize:22, fontWeight:700, fontFamily:"'Prompt',sans-serif", color }}>{value}</div>
      <div style={{ fontSize:13, color:"var(--gray-600)", fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:12, color:"var(--gray-400)" }}>{sub}</div>}
    </div>
  </div>
);

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    const u1 = getSales(setSales);
    const u2 = getCustomers(setCustomers);
    const u3 = getProducts(setProducts);
    return () => { u1(); u2(); u3(); };
  }, []);

  const now = new Date();
  const filtered = sales.filter((s) => {
    if (period === "all") return true;
    const d = new Date(s.createdAt || 0);
    if (period === "today") return d.toDateString() === now.toDateString();
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.total || 0), 0);
  const completedCount = filtered.filter((s) => s.status === "completed").length;

  // Top products
  const productMap = {};
  filtered.forEach((s) => {
    (s.items || []).forEach((item) => {
      if (!productMap[item.name]) productMap[item.name] = { qty: 0, revenue: 0 };
      productMap[item.name].qty += item.qty;
      productMap[item.name].revenue += Number(item.price || 0) * item.qty;
    });
  });
  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // Top customers
  const customerMap = {};
  filtered.forEach((s) => {
    if (!s.customerName) return;
    if (!customerMap[s.customerName]) customerMap[s.customerName] = 0;
    customerMap[s.customerName] += Number(s.total || 0);
  });
  const topCustomers = Object.entries(customerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const periodLabel = { all:"ทั้งหมด", today:"วันนี้", month:"เดือนนี้", year:"ปีนี้" };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">รายงาน</h2>
          <p className="page-subtitle">สรุปผลการดำเนินงาน</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {["all","today","month","year"].map((p) => (
            <button key={p}
              className={`btn ${period === p ? "btn-primary" : "btn-secondary"} btn-sm`}
              onClick={() => setPeriod(p)}>
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:16, marginBottom:22 }}>
        <StatCard icon="💰" label="รายได้รวม" value={`฿${totalRevenue.toLocaleString()}`} color="var(--primary)" />
        <StatCard icon="📋" label="จำนวนรายการ" value={filtered.length} sub={`สำเร็จ ${completedCount} รายการ`} color="var(--success)" />
        <StatCard icon="👥" label="ลูกค้าทั้งหมด" value={customers.length} color="#7c3aed" />
        <StatCard icon="📦" label="สินค้าทั้งหมด" value={products.length} color="var(--warning)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        {/* Top Products */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:16 }}>สินค้าขายดี (Top 5)</h3>
          {topProducts.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>ไม่มีข้อมูล</p></div>
          ) : topProducts.map(([name, data], i) => (
            <div key={name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < topProducts.length-1 ? "1px solid var(--gray-100)" : "none" }}>
              <div style={{ width:26, height:26, borderRadius:6, background:"var(--primary-50)", color:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{name}</div>
                <div style={{ fontSize:12, color:"var(--gray-400)" }}>{data.qty} ชิ้น</div>
              </div>
              <div style={{ fontWeight:700, color:"var(--primary)", fontSize:14 }}>฿{data.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Top Customers */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:16 }}>ลูกค้าสั่งซื้อสูงสุด (Top 5)</h3>
          {topCustomers.length === 0 ? (
            <div className="empty-state"><div className="icon">👥</div><p>ไม่มีข้อมูล</p></div>
          ) : topCustomers.map(([name, total], i) => (
            <div key={name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: i < topCustomers.length-1 ? "1px solid var(--gray-100)" : "none" }}>
              <div style={{ width:26, height:26, borderRadius:6, background:"#f0fdf4", color:"var(--success)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{name}</div>
              </div>
              <div style={{ fontWeight:700, color:"var(--success)", fontSize:14 }}>฿{total.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card" style={{ marginTop:18 }}>
        <h3 style={{ fontSize:15, marginBottom:16 }}>รายการขายล่าสุด</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ลูกค้า</th>
                <th>สินค้า</th>
                <th>ยอดรวม</th>
                <th>ผู้ขาย</th>
                <th>วันที่</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,10).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map((s) => (
                <tr key={s.id}>
                  <td>{s.customerName || "-"}</td>
                  <td>{s.items?.length || 0} รายการ</td>
                  <td><strong style={{ color:"var(--primary)" }}>฿{Number(s.total||0).toLocaleString()}</strong></td>
                  <td>{s.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)" }}>{s.createdAt ? new Date(s.createdAt).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"}) : "-"}</td>
                  <td><span className={`badge ${s.status==="completed"?"badge-success":s.status==="cancelled"?"badge-danger":"badge-warning"}`}>{s.status==="completed"?"สำเร็จ":s.status==="cancelled"?"ยกเลิก":"รอดำเนินการ"}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--gray-400)" }}>ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
