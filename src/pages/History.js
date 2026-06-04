// src/pages/History.js
import React, { useState, useEffect } from "react";
import { getSales, deleteSale } from "../firebase/database";

export default function History() {
  const [sales, setSales]             = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]       = useState(false);

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

  const statusLabel = { completed:"สำเร็จ", pending:"รอดำเนินการ", cancelled:"ยกเลิก" };
  const statusBadge = { completed:"badge-success", pending:"badge-warning", cancelled:"badge-danger" };

  const formatDate = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("th-TH", { dateStyle:"short", timeStyle:"short" });
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteSale(id);
      setDeleteConfirm(null);
      if (selected?.id === id) setSelected(null);
    } catch { alert("เกิดข้อผิดพลาด"); }
    setDeleting(false);
  };

  const shippingLabel = { free:"ส่งฟรี", per_box:"ตามจำนวนกล่อง", per_item:"ตามรายการ", custom:"กำหนดเอง" };

  // count total items across boxes
  const countItems = (s) => {
    if (s.boxes) return s.boxes.reduce((n, b) => n + (b.items?.filter(r=>r.productId)?.length||0), 0);
    return s.items?.length || 0;
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
                <th>กล่อง</th>
                <th>ค่าส่ง</th>
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
                  <td style={{ color:"var(--gray-400)", fontSize:12 }}>{i+1}</td>
                  <td><strong>{s.customerName || "-"}</strong></td>
                  <td style={{ fontSize:13 }}>
                    {s.numBoxes
                      ? <span className="badge badge-primary">{s.numBoxes} กล่อง</span>
                      : <span style={{ color:"var(--gray-400)" }}>-</span>}
                  </td>
                  <td style={{ fontSize:13, color:"var(--gray-500)" }}>
                    {s.shippingCost > 0
                      ? `฿${Number(s.shippingCost).toLocaleString()}`
                      : <span style={{ color:"var(--success)", fontWeight:600 }}>ฟรี</span>}
                  </td>
                  <td><strong style={{ color:"var(--primary)" }}>฿{Number(s.total||0).toLocaleString()}</strong></td>
                  <td>{s.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)" }}>{formatDate(s.createdAt)}</td>
                  <td>
                    <span className={`badge ${statusBadge[s.status] || "badge-gray"}`}>
                      {statusLabel[s.status] || s.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(s)}>ดูรายละเอียด</button>
                      <button className="btn btn-danger btn-sm"    onClick={() => setDeleteConfirm(s)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>รายละเอียดการขาย</h3>
              <button className="btn-icon btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight:"70vh", overflowY:"auto" }}>
              {/* Meta */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ลูกค้า</div><strong>{selected.customerName||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ธนาคาร</div><strong>{selected.bankName||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ผู้ขาย</div><strong>{selected.createdBy||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>วันที่</div><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              {selected.customerAddress && (
                <div style={{ background:"var(--gray-50)", border:"1px solid var(--gray-200)", borderRadius:8, padding:"10px 13px", marginBottom:14, fontSize:13 }}>
                  <div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:3, fontWeight:700 }}>📦 ที่อยู่จัดส่ง</div>
                  {selected.customerPhone && <div>{selected.customerPhone}</div>}
                  <div>{selected.customerAddress}</div>
                </div>
              )}

              {/* Boxes detail */}
              {selected.boxes ? (
                <div style={{ marginBottom:14 }}>
                  {selected.boxes.map((box, bIdx) => (
                    <div key={box.id || bIdx} style={{ marginBottom:12 }}>
                      <div style={{ background:"var(--primary)", color:"white", padding:"6px 12px", borderRadius:"6px 6px 0 0", fontSize:13, fontWeight:700 }}>
                        📦 กล่องที่ {bIdx+1}
                      </div>
                      <table style={{ width:"100%", fontSize:13 }}>
                        <thead>
                          <tr>
                            <th>สินค้า</th>
                            <th style={{ textAlign:"right" }}>ราคา/หน่วย</th>
                            <th style={{ textAlign:"right" }}>จำนวน</th>
                            <th style={{ textAlign:"right" }}>รวม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(box.items||[]).filter(r=>r.productId).map((row,i) => (
                            <tr key={row.rowId||i}>
                              <td>{row.productName}{row.unit?` (${row.unit})`:""}</td>
                              <td style={{ textAlign:"right" }}>฿{Number(row.price||0).toLocaleString()}</td>
                              <td style={{ textAlign:"right" }}>{row.qty}</td>
                              <td style={{ textAlign:"right" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                /* Legacy: flat items */
                <table style={{ width:"100%", fontSize:13, marginBottom:14 }}>
                  <thead><tr><th>สินค้า</th><th style={{textAlign:"right"}}>ราคา</th><th style={{textAlign:"right"}}>จำนวน</th><th style={{textAlign:"right"}}>รวม</th></tr></thead>
                  <tbody>
                    {(selected.items||[]).map((item,i)=>(
                      <tr key={i}><td>{item.name}</td><td style={{textAlign:"right"}}>฿{Number(item.price||0).toLocaleString()}</td><td style={{textAlign:"right"}}>{item.qty}</td><td style={{textAlign:"right"}}>฿{(Number(item.price||0)*item.qty).toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Summary */}
              <div style={{ paddingTop:12, borderTop:"1px solid var(--gray-100)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:5 }}>
                  <span>ยอดสินค้า</span><span>฿{Number(selected.subtotal||0).toLocaleString()}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:8 }}>
                  <span>ค่าส่ง ({shippingLabel[selected.shippingType]||"-"})</span>
                  <span>{selected.shippingCost>0?`฿${Number(selected.shippingCost).toLocaleString()}`:"ฟรี"}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16 }}>
                  <span>ยอดรวมทั้งหมด</span>
                  <span style={{ color:"var(--primary)", fontSize:20 }}>฿{Number(selected.total||0).toLocaleString()}</span>
                </div>
              </div>

              {selected.note && (
                <div style={{ marginTop:12, background:"var(--gray-50)", padding:"9px 13px", borderRadius:7, fontSize:13, color:"var(--gray-600)" }}>
                  <strong>หมายเหตุ:</strong> {selected.note}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => { setSelected(null); setDeleteConfirm(selected); }}>ลบรายการนี้</button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>ยืนยันการลบ</h3></div>
            <div className="modal-body" style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
              <p>ต้องการลบรายการขายของ <strong>{deleteConfirm.customerName}</strong>?</p>
              <p style={{ fontSize:13, color:"var(--gray-400)", marginTop:6 }}>
                ยอด ฿{Number(deleteConfirm.total||0).toLocaleString()} · {formatDate(deleteConfirm.createdAt)}
              </p>
              <p style={{ fontSize:12, color:"var(--danger)", marginTop:8 }}>การกระทำนี้ไม่สามารถยกเลิกได้</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                {deleting ? <span className="spinner" style={{ width:16, height:16 }}/> : "ลบรายการ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
