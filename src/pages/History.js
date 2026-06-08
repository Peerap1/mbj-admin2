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
  const [selected, setSelected]           = useState(null);
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
                      <button className="btn btn-secondary btn-sm btn-icon-only" title="รายละเอียด" onClick={() => setSelected(sale)}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                      </button>
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

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>รายละเอียดการขาย</h3>
              <button className="btn-icon btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight:"70vh", overflowY:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ลูกค้า</div><strong>{selected.customerName||"-"}</strong></div>
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

              {selected.payment && (
                <div style={{ background:"var(--success-light)", border:"1px solid #6ee7b7", borderRadius:8, padding:"10px 13px", marginBottom:14, fontSize:13, color:"#064e3b" }}>
                  <div style={{ fontWeight:700, marginBottom:3 }}>✓ ชำระเงินแล้ว</div>
                  <div>{selected.payment.method === "cash" ? "เงินสด" : `โอน ${selected.payment.bankName}`}</div>
                  {selected.paidAt && <div style={{ fontSize:12, color:"#065f46" }}>วันที่ชำระ: {formatDate(selected.paidAt)}</div>}
                  {selected.payment.note && <div>{selected.payment.note}</div>}
                </div>
              )}

              {/* Slip table reused */}
              {selected.boxes ? (
                <SlipTable boxes={selected.boxes} />
              ) : (
                <table style={{ width:"100%", fontSize:13, marginBottom:14 }}>
                  <thead><tr><th>สินค้า</th><th style={{textAlign:"right"}}>ราคา</th><th style={{textAlign:"right"}}>จำนวน</th><th style={{textAlign:"right"}}>รวม</th></tr></thead>
                  <tbody>
                    {(selected.items||[]).map((item,j)=>(
                      <tr key={j}>
                        <td title={item.name}>{item.name}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>฿{Number(item.price||0).toLocaleString()}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>{item.qty}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>฿{(Number(item.price||0)*item.qty).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

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
                <div style={{ marginTop:12, background:"var(--gray-50)", padding:"9px 13px", borderRadius:7, fontSize:13 }}>
                  <strong>หมายเหตุ:</strong> {selected.note}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setSelected(null); setSlipSale(selected); }}>ใบส่งของ</button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

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
