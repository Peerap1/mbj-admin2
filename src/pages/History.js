// src/pages/History.js
import React, { useState, useEffect, useRef } from "react";
import { getSales, deleteSale, updateSale, getBanks } from "../firebase/database";
import { SlipContent, buildPrintHTML } from "../components/SlipContent";

// ─── Payment modal ──────────────────────────────────────────────
function PaymentModal({ sale, banks, onConfirm, onClose }) {
  const [method, setMethod] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (method === "bank" && !bankId) { alert("กรุณาเลือกธนาคาร"); return; }
    setSaving(true);
    const bank = banks.find(b => b.id === bankId);
    await onConfirm(sale.id, {
      method,
      bankId:   method === "bank" ? bankId   : null,
      bankName: method === "bank" ? `${bank?.name} ${bank?.accountNo}` : null,
      note,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:400 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>บันทึกการชำระเงิน</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize:13, color:"var(--gray-600)", marginBottom:14 }}>
            ลูกค้า: <strong>{sale.customerName}</strong> · ยอด <strong style={{ color:"var(--primary)" }}>฿{Number(sale.total||0).toLocaleString()}</strong>
          </div>
          <div className="form-group">
            <label>ช่องทางชำระเงิน</label>
            <div style={{ display:"flex", gap:10 }}>
              {[["cash","เงินสด"],["bank","โอนธนาคาร"]].map(([v,l]) => (
                <label key={v} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"10px 16px",
                  border:`1.5px solid ${method===v?"var(--primary)":"var(--gray-200)"}`,
                  borderRadius:8, cursor:"pointer", flex:1, justifyContent:"center",
                  background:method===v?"var(--primary-50)":"white",
                }}>
                  <input type="radio" name="paymethod" value={v} checked={method===v}
                    onChange={()=>setMethod(v)}
                    style={{ accentColor:"var(--primary)", width:15, height:15, margin:0 }} />
                  <span style={{ fontSize:14, fontWeight:600 }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
          {method === "bank" && (
            <div className="form-group">
              <label>เลือกธนาคาร</label>
              <select value={bankId} onChange={e=>setBankId(e.target.value)}>
                <option value="">-- เลือกธนาคาร --</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name} – {b.accountNo}</option>)}
              </select>
            </div>
          )}
          <div className="form-group" style={{ marginBottom:0 }}>
            <label>หมายเหตุ</label>
            <input type="text" placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:16, height:16 }}/> : "✓ บันทึกการชำระ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [sales, setSales]                 = useState([]);
  const [banks, setBanks]                 = useState([]);
  const [search, setSearch]               = useState("");
  const [slipSale, setSlipSale]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [payModal, setPayModal]           = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const u1 = getSales(setSales);
    const u2 = getBanks(setBanks);
    return () => { u1(); u2(); };
  }, []);

  const filtered = sales
    .filter((s) =>
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.createdBy?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const shippingLabel = { free:"ส่งฟรี", per_box:"ตามจำนวนกล่อง", per_item:"ตามรายการ", custom:"กำหนดเอง" };

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

  const confirmPay = async (saleId, paymentData) => {
    try { await updateSale(saleId, { status:"paid", payment: paymentData, paidAt: Date.now() }); }
    catch { alert("เกิดข้อผิดพลาด"); }
  };

  const revertPay = async (saleId) => {
    try { await updateSale(saleId, { status:"pending", payment: null, paidAt: null }); }
    catch { alert("เกิดข้อผิดพลาด"); }
  };

  const handlePrint = () => {
    if (!slipSale) return;
    const w = window.open("", "_blank", "width=860,height=700");
    w.document.write(buildPrintHTML(slipSale, slipSale.createdBy));
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 450);
  };

  const s = slipSale;
  // Legacy SlipTable kept for detail modal backward compat
  const SlipTable = ({ boxes }) => (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:14 }}>
      <thead>
        <tr>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"center",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:36 }}>รายการ</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"left",   fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0" }}>รายละเอียด</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:60 }}>จำนวน</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:90 }}>ราคา/หน่วย</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:60 }}>กล่อง</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:90 }}>จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        {(boxes||[]).flatMap((box, bIdx) => {
          const bQty = Number(box.boxQty)||1;
          const rows = (box.items||[]).filter(r=>r.productId);
          return rows.map((row, rIdx) => (
            <tr key={`${bIdx}-${rIdx}`}>
              {rIdx === 0 && (
                <td rowSpan={rows.length} style={{ padding:"5px 8px", textAlign:"center", fontWeight:700, verticalAlign:"middle", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" }}>
                  {bIdx+1}
                </td>
              )}
              <td style={{ padding:"4px 8px", borderBottom: rIdx===rows.length-1?"2px solid #e2e8f0":"1px solid #f1f5f9" }}>{row.productName}</td>
              <td style={{ padding:"4px 8px", textAlign:"right", borderBottom: rIdx===rows.length-1?"2px solid #e2e8f0":"1px solid #f1f5f9" }}>{row.qty}</td>
              <td style={{ padding:"4px 8px", textAlign:"right", borderBottom: rIdx===rows.length-1?"2px solid #e2e8f0":"1px solid #f1f5f9" }}>฿{Number(row.price||0).toLocaleString()}</td>
              {rIdx === 0 && (
                <td rowSpan={rows.length} style={{ padding:"5px 8px", textAlign:"center", fontWeight:700, verticalAlign:"middle", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" }}>
                  {bQty}
                </td>
              )}
              <td style={{ padding:"4px 8px", textAlign:"right", fontWeight:600, color:"#1a56db", borderBottom: rIdx===rows.length-1?"2px solid #e2e8f0":"1px solid #f1f5f9" }}>
                ฿{(Number(row.price||0)*Number(row.qty||0)*bQty).toLocaleString()}
              </td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );

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
                <th style={{ width:36 }}>#</th>
                <th>ลูกค้า</th>
                <th style={{ width:110 }}>ยอดรวม</th>
                <th style={{ width:90 }}>ผู้ขาย</th>
                <th style={{ width:110 }}>วันที่</th>
                <th style={{ width:110 }}>สถานะ</th>
                <th style={{ width:130 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--gray-400)", maxWidth:"none" }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((sale, i) => (
                <tr key={sale.id}>
                  <td style={{ color:"var(--gray-400)", fontSize:12, maxWidth:"none" }}>{i+1}</td>
                  <td title={sale.customerName}><strong>{sale.customerName || "-"}</strong></td>
                  <td style={{ maxWidth:"none" }}>
                    <strong style={{ color:"var(--primary)" }}>฿{Number(sale.total||0).toLocaleString()}</strong>
                  </td>
                  <td title={sale.createdBy}>{sale.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)", maxWidth:"none" }}>{formatDate(sale.createdAt)}</td>
                  <td style={{ maxWidth:"none" }}>
                    {sale.status === "paid" ? (
                      <button className="status-toggle paid" onClick={() => revertPay(sale.id)} title="คลิกเพื่อยกเลิกการชำระ">
                        ✓ ชำระแล้ว
                      </button>
                    ) : (
                      <button className="status-toggle pending" onClick={() => setPayModal(sale)} title="บันทึกการชำระเงิน">
                        ⏳ รอชำระ
                      </button>
                    )}
                  </td>
                  <td style={{ maxWidth:"none" }}>
                    <div style={{ display:"flex", gap:5 }}>

                      <button className="btn btn-secondary btn-sm btn-icon-only" title="ใบส่งของ/ใบเสร็จ" onClick={() => setSlipSale(sale)}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/></svg>
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon-only" title="ลบ" onClick={() => setDeleteConfirm(sale)}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* ── Slip Modal ── */}
      {slipSale && (
        <div className="modal-overlay" onClick={() => setSlipSale(null)}>
          <div className="modal" style={{ maxWidth:780 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{s?.status === "paid" ? "ใบเสร็จ" : "ใบส่งของ"}</h3>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
                  </svg>
                  พิมพ์ / PDF
                </button>
                <button className="btn-icon btn-secondary" onClick={() => setSlipSale(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding:"4px 24px 24px", maxHeight:"80vh", overflowY:"auto" }}>
              <div ref={printRef}>
                <SlipContent sale={s} createdBy={s?.createdBy} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {payModal && (
        <PaymentModal
          sale={payModal}
          banks={banks}
          onConfirm={confirmPay}
          onClose={() => setPayModal(null)}
        />
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
