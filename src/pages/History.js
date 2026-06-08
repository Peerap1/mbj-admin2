// src/pages/History.js
import React, { useState, useEffect, useRef } from "react";
import { getSales, deleteSale, updateSale, getBanks } from "../firebase/database";

// โ”€โ”€โ”€ Payment modal โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function PaymentModal({ sale, banks, onConfirm, onClose }) {
  const [method, setMethod] = useState("cash"); // cash | bank
  const [bankId, setBankId] = useState("");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (method === "bank" && !bankId) { alert("เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธเธฒเธเธฒเธฃ"); return; }
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
          <h3>เธเธฑเธเธ—เธถเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}>โ•</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize:13, color:"var(--gray-600)", marginBottom:14 }}>
            เธฅเธนเธเธเนเธฒ: <strong>{sale.customerName}</strong> ยท เธขเธญเธ” <strong style={{ color:"var(--primary)" }}>เธฟ{Number(sale.total||0).toLocaleString()}</strong>
          </div>
          <div className="form-group">
            <label>เธเนเธญเธเธ—เธฒเธเธเธณเธฃเธฐเน€เธเธดเธ</label>
            <div style={{ display:"flex", gap:8 }}>
              {[["cash","๐’ต เน€เธเธดเธเธชเธ”"],["bank","๐ฆ เนเธญเธเธเธเธฒเธเธฒเธฃ"]].map(([v,l]) => (
                <label key={v} style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"8px 16px", border:`1.5px solid ${method===v?"var(--primary)":"var(--gray-200)"}`,
                  borderRadius:8, cursor:"pointer", flex:1, justifyContent:"center",
                  background:method===v?"var(--primary-50)":"white", whiteSpace:"nowrap"
                }}>
                  <input type="radio" name="paymethod" value={v} checked={method===v} onChange={()=>setMethod(v)}
                    style={{ accentColor:"var(--primary)", margin:0, flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:600, lineHeight:1 }}>{l}</span>
                </label>
              ))}
            </div>
          </div>
          {method === "bank" && (
            <div className="form-group">
              <label>เน€เธฅเธทเธญเธเธเธเธฒเธเธฒเธฃ</label>
              <select value={bankId} onChange={e=>setBankId(e.target.value)}>
                <option value="">-- เน€เธฅเธทเธญเธเธเธเธฒเธเธฒเธฃ --</option>
                {banks.map(b => <option key={b.id} value={b.id}>{b.name} โ€“ {b.accountNo}</option>)}
              </select>
            </div>
          )}
          <div className="form-group" style={{ marginBottom:0 }}>
            <label>เธซเธกเธฒเธขเน€เธซเธ•เธธ</label>
            <input type="text" placeholder="เธซเธกเธฒเธขเน€เธซเธ•เธธ (เธ–เนเธฒเธกเธต)" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>เธขเธเน€เธฅเธดเธ</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width:16, height:16 }}/> : "โ“ เธเธฑเธเธ—เธถเธเธเธฒเธฃเธเธณเธฃเธฐ"}
          </button>
        </div>
      </div>
    </div>
  );
}

const SELLER = {
  name:    "เธเนเธฒเธงเนเธ•เนเธเธเนเธณเนเธ•เธเนเธกเนเธกเนเธเธฑเธงเธเธฑเธเธ—เธฃเน",
  address: "5 เธซเธกเธนเน 2 เธ•เธณเธเธฅเธเนเธฒเธเน€เธเนเธฒ เธญเธณเน€เธ เธญเน€เธกเธทเธญเธ เธเธฑเธเธซเธงเธฑเธ”เธฅเธณเธเธฒเธ 52100",
  phone:   "099-916-6264",
};

const calcShippingPerBox = (n) => {
  if (n <= 0)  return 0;
  if (n >= 10) return 0;
  if (n >= 5)  return n * 100;
  if (n >= 3)  return n * 120;
  return n * 150;
};

export default function History() {
  const [sales, setSales]                 = useState([]);
  const [banks, setBanks]                 = useState([]);
  const [payModal, setPayModal]           = useState(null); // sale to pay
  const [search, setSearch]               = useState("");
  const [selected, setSelected]           = useState(null);
  const [slipSale, setSlipSale]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);
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

  const statusLabel = { paid:"เธเธณเธฃเธฐเน€เธเธดเธเนเธฅเนเธง", pending:"เธฃเธญเธเธณเธฃเธฐเน€เธเธดเธ", cancelled:"เธขเธเน€เธฅเธดเธ", completed:"เธชเธณเน€เธฃเนเธ" };
  const statusBadge = { paid:"badge-success", pending:"badge-warning", cancelled:"badge-danger", completed:"badge-gray" };
  const shippingLabel = { free:"เธชเนเธเธเธฃเธต", per_box:"เธ•เธฒเธกเธเธณเธเธงเธเธเธฅเนเธญเธ", per_item:"เธ•เธฒเธกเธฃเธฒเธขเธเธฒเธฃ", custom:"เธเธณเธซเธเธ”เน€เธญเธ" };

  
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
    } catch { alert("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”"); }
    setDeleting(false);
  };

  const confirmPay = async (saleId, paymentData) => {
    try { await updateSale(saleId, { status:"paid", payment: paymentData, paidAt: Date.now() }); }
    catch { alert("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”"); }
  };
  const revertPay = async (saleId) => {
    try { await updateSale(saleId, { status:"pending", payment: null, paidAt: null }); }
    catch { alert("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”"); }
  };

  const handlePrint = () => {
    if (!slipSale) return;
    const w = window.open("", "_blank", "width=860,height=700");
    w.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>เนเธเธชเนเธเธเธญเธ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;font-size:11px;color:#1e293b;padding:12px 16px;line-height:1.5}
.wrap{max-width:680px;margin:0 auto}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a56db;padding-bottom:10px;margin-bottom:14px}
.sname{font-size:14px;font-weight:700;color:#1a56db}.sinfo{font-size:10px;color:#475569;margin-top:3px;line-height:1.6}
.title{font-size:18px;font-weight:700;text-align:right;color:#0f172a}.meta{font-size:10px;color:#94a3b8;text-align:right;margin-top:3px;line-height:1.6}
.sec-h{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;margin-top:12px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:6px 10px;font-size:11px;line-height:1.6;color:#334155}
.box-hd{background:#1a56db;color:white;padding:4px 10px;border-radius:3px 3px 0 0;font-weight:700;font-size:11px;margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f1f5f9;padding:5px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1.5px solid #e2e8f0}
td{padding:4px 8px;border-bottom:1px solid #f5f5f5}
.grand td{font-weight:800;color:#1a56db;font-size:12px;background:#eff6ff;padding:6px 8px}
.foot{margin-top:12px;text-align:center;font-size:9px;color:#cbd5e1;padding-top:7px;border-top:1px dashed #e2e8f0}
@media print{
  @page{margin:8mm 10mm;size:A4}
  body{padding:0}
  html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style></head><body><div class="wrap">${printRef.current.innerHTML}</div></body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 450);
  };

  const today = (() => {
    const d = new Date();
    return d.toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });
  })();
  const s = slipSale;
  const slipShipping = s ? (shippingLabel[s.shippingType] || "") : "";

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธฒเธข</h2>
          <p className="page-subtitle">เธฃเธฒเธขเธเธฒเธฃเธเธฒเธขเธ—เธฑเนเธเธซเธกเธ” {filtered.length} เธฃเธฒเธขเธเธฒเธฃ</p>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <input type="text" placeholder="๐” เธเนเธเธซเธฒเธฅเธนเธเธเนเธฒ, เธเธนเนเธเธฒเธข..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth:300 }} />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width:36 }}>#</th>
                <th>เธฅเธนเธเธเนเธฒ</th>

                <th style={{ width:110 }}>เธขเธญเธ”เธฃเธงเธก</th>
                <th style={{ width:90 }}>เธเธนเนเธเธฒเธข</th>
                <th style={{ width:110 }}>เธงเธฑเธเธ—เธตเน</th>
                <th style={{ width:80 }}>เธชเธ–เธฒเธเธฐ</th>
                <th style={{ width:180 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--gray-400)", maxWidth:"none" }}>เนเธกเนเธเธเธเนเธญเธกเธนเธฅ</td></tr>
              ) : filtered.map((sale, i) => (
                <tr key={sale.id}>
                  <td style={{ color:"var(--gray-400)", fontSize:12, maxWidth:"none" }}>{i+1}</td>
                  <td title={sale.customerName}><strong>{sale.customerName || "-"}</strong></td>

                  <td style={{ maxWidth:"none" }}>
                    <strong style={{ color:"var(--primary)" }}>เธฟ{Number(sale.total||0).toLocaleString()}</strong>
                  </td>
                  <td title={sale.createdBy}>{sale.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)", maxWidth:"none" }}>{formatDate(sale.createdAt)}</td>
                  <td style={{ maxWidth:"none" }}>
                    {sale.status === "paid" ? (
                      <button className="status-toggle paid" onClick={() => revertPay(sale.id)} title="เธเธฅเธดเธเน€เธเธทเนเธญเธขเธเน€เธฅเธดเธเธเธฒเธฃเธเธณเธฃเธฐ">
                        โ“ เธเธณเธฃเธฐเนเธฅเนเธง
                      </button>
                    ) : (
                      <button className="status-toggle pending" onClick={() => setPayModal(sale)} title="เธเธฑเธเธ—เธถเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ">
                        โณ เธฃเธญเธเธณเธฃเธฐ
                      </button>
                    )}
                  </td>
                  <td style={{ maxWidth:"none" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn btn-secondary btn-sm btn-icon-only" title="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”" onClick={() => setSelected(sale)}><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg></button>
                      <button className="btn btn-secondary btn-sm btn-icon-only" title="เนเธเธชเนเธเธเธญเธ/เนเธเน€เธชเธฃเนเธ" onClick={() => setSlipSale(sale)}><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/></svg></button>
                      <button className="btn btn-danger btn-sm btn-icon-only" title="เธฅเธ" onClick={() => setDeleteConfirm(sale)}><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* โ”€โ”€ Detail Modal โ”€โ”€ */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฒเธฃเธเธฒเธข</h3>
              <button className="btn-icon btn-secondary" onClick={() => setSelected(null)}>โ•</button>
            </div>
            <div className="modal-body" style={{ maxHeight:"70vh", overflowY:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>เธฅเธนเธเธเนเธฒ</div><strong>{selected.customerName||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>เธเธนเนเธเธฒเธข</div><strong>{selected.createdBy||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>เธงเธฑเธเธ—เธตเน</div><strong>{formatDate(selected.createdAt)}</strong></div>
              </div>

              {selected.customerAddress && (
                <div style={{ background:"var(--gray-50)", border:"1px solid var(--gray-200)", borderRadius:8, padding:"10px 13px", marginBottom:14, fontSize:13 }}>
                  <div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:3, fontWeight:700 }}>๐“ฆ เธ—เธตเนเธญเธขเธนเนเธเธฑเธ”เธชเนเธ</div>
                  {selected.customerPhone && <div>{selected.customerPhone}</div>}
                  <div>{selected.customerAddress}</div>
                </div>
              )}

              {selected.boxes ? (
                <div style={{ marginBottom:14 }}>
                  {selected.boxes.map((box, bIdx) => (
                    <div key={box.id||bIdx} style={{ marginBottom:12 }}>
                      <div style={{ background:"var(--primary)", color:"white", padding:"6px 12px", borderRadius:"6px 6px 0 0", fontSize:13, fontWeight:700 }}>
                        ๐“ฆ เธเธฅเนเธญเธเธ—เธตเน {bIdx+1}
                      </div>
                      <table style={{ width:"100%", fontSize:13 }}>
                        <thead><tr>
                          <th>เธชเธดเธเธเนเธฒ</th>
                          <th style={{ textAlign:"right", width:90 }}>เธฃเธฒเธเธฒ/เธซเธเนเธงเธข</th>
                          <th style={{ textAlign:"right", width:70 }}>เธเธณเธเธงเธ</th>
                          <th style={{ textAlign:"right", width:90 }}>เธฃเธงเธก</th>
                        </tr></thead>
                        <tbody>
                          {(box.items||[]).filter(r=>r.productId).map((row,j) => (
                            <tr key={row.rowId||j}>
                              <td style={{ maxWidth:200 }} title={row.productName}>{row.productName}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>เธฟ{Number(row.price||0).toLocaleString()}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>{row.qty}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>เธฟ{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <table style={{ width:"100%", fontSize:13, marginBottom:14 }}>
                  <thead><tr><th>เธชเธดเธเธเนเธฒ</th><th style={{textAlign:"right"}}>เธฃเธฒเธเธฒ</th><th style={{textAlign:"right"}}>เธเธณเธเธงเธ</th><th style={{textAlign:"right"}}>เธฃเธงเธก</th></tr></thead>
                  <tbody>
                    {(selected.items||[]).map((item,j)=>(
                      <tr key={j}>
                        <td title={item.name}>{item.name}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>เธฟ{Number(item.price||0).toLocaleString()}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>{item.qty}</td>
                        <td style={{textAlign:"right",maxWidth:"none"}}>เธฟ{(Number(item.price||0)*item.qty).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ paddingTop:12, borderTop:"1px solid var(--gray-100)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:5 }}>
                  <span>เธขเธญเธ”เธชเธดเธเธเนเธฒ</span><span>เธฟ{Number(selected.subtotal||0).toLocaleString()}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:8 }}>
                  <span>เธเนเธฒเธชเนเธ ({shippingLabel[selected.shippingType]||"-"})</span>
                  <span>{selected.shippingCost>0?`เธฟ${Number(selected.shippingCost).toLocaleString()}`:"เธเธฃเธต"}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16 }}>
                  <span>เธขเธญเธ”เธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”</span>
                  <span style={{ color:"var(--primary)", fontSize:20 }}>เธฟ{Number(selected.total||0).toLocaleString()}</span>
                </div>
              </div>
              {selected.note && (
                <div style={{ marginTop:12, background:"var(--gray-50)", padding:"9px 13px", borderRadius:7, fontSize:13, color:"var(--gray-600)" }}>
                  <strong>เธซเธกเธฒเธขเน€เธซเธ•เธธ:</strong> {selected.note}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setSelected(null); setSlipSale(selected); }}>
                เนเธเธชเนเธเธเธญเธ
              </button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>เธเธดเธ”</button>
            </div>
          </div>
        </div>
      )}

      {/* โ”€โ”€ Slip Modal โ”€โ”€ */}
      {slipSale && (
        <div className="modal-overlay" onClick={() => setSlipSale(null)}>
          <div className="modal" style={{ maxWidth:780 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{slipSale?.status === "paid" ? "เนเธเน€เธชเธฃเนเธ" : "เนเธเธชเนเธเธเธญเธ"}</h3>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
                  </svg>
                  เธเธดเธกเธเน / PDF
                </button>
                <button className="btn-icon btn-secondary" onClick={() => setSlipSale(null)}>โ•</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding:"4px 24px 24px", maxHeight:"80vh", overflowY:"auto" }}>
              <div ref={printRef}>
                <div style={{ fontFamily:"'Sarabun',sans-serif" }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2.5px solid #1a56db", paddingBottom:18, marginBottom:22 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:"#1a56db" }}>{SELLER.name}</div>
                      <div style={{ fontSize:12, color:"#475569", marginTop:5, lineHeight:1.9 }}>{SELLER.address}<br/>เนเธ—เธฃ: {SELLER.phone}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:700, color:"#0f172a" }}>{s?.status==="paid"?"เนเธเน€เธชเธฃเนเธ":"เนเธเธชเนเธเธเธญเธ"}</div>
                      <div style={{ fontSize:12, color:"#94a3b8", marginTop:4, lineHeight:1.8 }}>
                        เธงเธฑเธเธ—เธตเน: {s ? new Date(s.createdAt||Date.now()).toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"}) : today}<br/>
                        เธเธนเนเธเธฒเธข: {s?.createdBy}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {(s?.customerName || s?.customerAddress) && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:"4.5px", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em", marginBottom:3 }}>เธ—เธตเนเธญเธขเธนเนเนเธเธเธฒเธฃเธเธฑเธ”เธชเนเธเธชเธดเธเธเนเธฒ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", fontSize:13, lineHeight:1.9, color:"#334155" }}>
                        <strong>{s.customerName}</strong>
                        {s.customerPhone   && <><br/>เนเธ—เธฃ: {s.customerPhone}</>}
                        {s.customerAddress && <><br/>{s.customerAddress}</>}
                      </div>
                    </div>
                  )}

                  {/* Boxes */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:"4.5px", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>
                      เธฃเธฒเธขเธเธฒเธฃเธชเธดเธเธเนเธฒ ({s?.numBoxes||"?"} เธเธฅเนเธญเธ)
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr>
                          <th style={{ background:"#f1f5f9", padding:"2px 4px", textAlign:"left", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", fontSize:"5.5px" }}>เธชเธดเธเธเนเธฒ</th>
                          <th style={{ background:"#f1f5f9", padding:"2px 4px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:70, fontSize:"5.5px" }}>เธฃเธฒเธเธฒ/เธซเธเนเธงเธข</th>
                          <th style={{ background:"#f1f5f9", padding:"2px 4px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:55, fontSize:"5.5px" }}>เธเธณเธเธงเธ</th>
                          <th style={{ background:"#f1f5f9", padding:"2px 4px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:70, fontSize:"5.5px" }}>เธฃเธงเธก</th>
                        </tr>
                      </thead>
                      {(s?.boxes||[]).map((box, bIdx) => (
                        <tbody key={box.id||bIdx}>
                          <tr>
                            <td colSpan={4} style={{ padding:"2px 5px", background:"#1a56db", color:"white", fontWeight:700, fontSize:"5.5px" }}>
                              ๐“ฆ เธเธฅเนเธญเธเธ—เธตเน {bIdx+1}
                            </td>
                          </tr>
                          {(box.items||[]).filter(r=>r.productId).map((row,j) => (
                            <tr key={row.rowId||j}>
                              <td style={{ padding:"1px 4px", borderBottom:"1px solid #f8f8f8", fontSize:"5.5px" }}>{row.productName}</td>
                              <td style={{ padding:"1px 4px", borderBottom:"1px solid #f8f8f8", fontSize:"5.5px", textAlign:"right" }}>เธฟ{Number(row.price||0).toLocaleString()}</td>
                              <td style={{ padding:"1px 4px", borderBottom:"1px solid #f8f8f8", fontSize:"5.5px", textAlign:"right" }}>{row.qty}</td>
                              <td style={{ padding:"1px 4px", borderBottom:"1px solid #f8f8f8", fontSize:"5.5px", textAlign:"right" }}>เธฟ{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} style={{ padding:"2px 4px", textAlign:"right", color:"#64748b", fontSize:"5px", background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>เธขเธญเธ”เธเธฅเนเธญเธเธ—เธตเน {bIdx+1}</td>
                            <td style={{ padding:"2px 4px", textAlign:"right", fontWeight:700, background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0", fontSize:"5.5px" }}>
                              เธฟ{(box.items||[]).reduce((acc,r)=>acc+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>

                  {/* Grand total */}
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:18 }}>
                    <tbody>
                      <tr>
                        <td colSpan={3} style={{ padding:"2px 4px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f8f8f8", fontSize:"5px" }}>เธเธณเธเธงเธเธเธฅเนเธญเธเธ—เธฑเนเธเธซเธกเธ”</td>
                        <td style={{ padding:"2px 4px", textAlign:"right", borderBottom:"1px solid #f8f8f8", width:80, fontSize:"5px" }}>{s?.numBoxes || "โ€“"} เธเธฅเนเธญเธ</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"2px 4px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f8f8f8", fontSize:"5px" }}>เธขเธญเธ”เธชเธดเธเธเนเธฒเธฃเธงเธกเธ—เธธเธเธเธฅเนเธญเธ</td>
                        <td style={{ padding:"2px 4px", textAlign:"right", borderBottom:"1px solid #f8f8f8", width:80, fontSize:"5px" }}>เธฟ{Number(s?.subtotal||0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"2px 4px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f8f8f8", fontSize:"5px" }}>เธเนเธฒเธชเนเธ ({slipShipping})</td>
                        <td style={{ padding:"2px 4px", textAlign:"right", borderBottom:"1px solid #f8f8f8", fontSize:"5px" }}>
                          {(s?.shippingCost||0)===0 ? "เธเธฃเธต" : `เธฟ${Number(s?.shippingCost||0).toLocaleString()}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"3px 4px", textAlign:"right", fontWeight:800, fontSize:"6.5px", color:"#1a56db", background:"#eff6ff" }}>เธขเธญเธ”เธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”</td>
                        <td style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>เธฟ{Number(s?.total||0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {s?.note && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:"4.5px", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em", marginBottom:3 }}>เธซเธกเธฒเธขเน€เธซเธ•เธธ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155" }}>{s.note}</div>
                    </div>
                  )}


                  <div style={{ marginTop:28, textAlign:"center", fontSize:12, color:"#cbd5e1", paddingTop:14, borderTop:"1px dashed #e2e8f0" }}>
                    เธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฃเธดเธเธฒเธฃ โ€” {SELLER.name} เนเธ—เธฃ {SELLER.phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* โ”€โ”€ Payment Modal โ”€โ”€ */}
      {payModal && (
        <PaymentModal
          sale={payModal}
          banks={banks}
          onConfirm={confirmPay}
          onClose={() => setPayModal(null)}
        />
      )}

      {/* โ”€โ”€ Delete Confirm โ”€โ”€ */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธ</h3></div>
            <div className="modal-body" style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>๐—‘๏ธ</div>
              <p>เธ•เนเธญเธเธเธฒเธฃเธฅเธเธฃเธฒเธขเธเธฒเธฃเธเธฒเธขเธเธญเธ <strong>{deleteConfirm.customerName}</strong>?</p>
              <p style={{ fontSize:13, color:"var(--gray-400)", marginTop:6 }}>
                เธขเธญเธ” เธฟ{Number(deleteConfirm.total||0).toLocaleString()} ยท {formatDate(deleteConfirm.createdAt)}
              </p>

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>เธขเธเน€เธฅเธดเธ</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                {deleting ? <span className="spinner" style={{ width:16, height:16 }}/> : "เธฅเธเธฃเธฒเธขเธเธฒเธฃ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
