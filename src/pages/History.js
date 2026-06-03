// src/pages/History.js
import React, { useState, useEffect } from "react";
import { getSales, updateSale, deleteSale } from "../firebase/database";

export default function History() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = getSales(setSales);
    return unsub;
  }, []);

  const filtered = sales
    .filter((s) =>
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.createdBy?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const statusLabel = { completed: "สำเร็จ", pending: "รอดำเนินการ", cancelled: "ยกเลิก" };
  const statusBadge = { completed: "badge-success", pending: "badge-warning", cancelled: "badge-danger" };

  const formatDate = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">ประวัติการขาย</h2>
          <p className="page-subtitle">รายการขายทั้งหมด {filtered.length} รายการ</p>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <input type="text" placeholder="🔍 ค้นหาลูกค้า, ผู้ขาย..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth:300 }} />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ลูกค้า</th>
                <th>ธนาคาร</th>
                <th>สินค้า</th>
                <th>ยอดรวม</th>
                <th>ผู้ขาย</th>
                <th>วันที่</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color:"var(--gray-400)", fontSize:12 }}>{i + 1}</td>
                  <td><strong>{s.customerName || "-"}</strong></td>
                  <td>{s.bankName || "-"}</td>
                  <td>{s.items?.length || 0} รายการ</td>
                  <td><strong style={{ color:"var(--primary)" }}>฿{Number(s.total || 0).toLocaleString()}</strong></td>
                  <td>{s.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)" }}>{formatDate(s.createdAt)}</td>
                  <td>
                    <span className={`badge ${statusBadge[s.status] || "badge-gray"}`}>
                      {statusLabel[s.status] || s.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(s)}>ดูรายละเอียด</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>รายละเอียดการขาย</h3>
              <button className="btn-icon btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                <div><div style={{ fontSize:12, color:"var(--gray-400)" }}>ลูกค้า</div><strong>{selected.customerName || "-"}</strong></div>
                <div><div style={{ fontSize:12, color:"var(--gray-400)" }}>ธนาคาร</div><strong>{selected.bankName || "-"}</strong></div>
                <div><div style={{ fontSize:12, color:"var(--gray-400)" }}>ผู้ขาย</div><strong>{selected.createdBy || "-"}</strong></div>
                <div><div style={{ fontSize:12, color:"var(--gray-400)" }}>วันที่</div><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              {selected.note && (
                <div style={{ background:"var(--gray-50)", padding:"10px 13px", borderRadius:8, marginBottom:16, fontSize:13, color:"var(--gray-600)" }}>
                  <strong>หมายเหตุ:</strong> {selected.note}
                </div>
              )}

              <table style={{ width:"100%", fontSize:13 }}>
                <thead>
                  <tr>
                    <th>สินค้า</th>
                    <th style={{ textAlign:"right" }}>ราคา</th>
                    <th style={{ textAlign:"right" }}>จำนวน</th>
                    <th style={{ textAlign:"right" }}>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td style={{ textAlign:"right" }}>฿{Number(item.price || 0).toLocaleString()}</td>
                      <td style={{ textAlign:"right" }}>{item.qty}</td>
                      <td style={{ textAlign:"right" }}>฿{(Number(item.price || 0) * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16, paddingTop:14, borderTop:"1px solid var(--gray-100)" }}>
                <div style={{ fontSize:16, fontWeight:700, color:"var(--primary)" }}>
                  ยอดรวม: ฿{Number(selected.total || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
