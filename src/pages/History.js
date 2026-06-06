// src/pages/History.js
import React, { useState, useEffect, useRef } from "react";
import { getSales, deleteSale, updateSale } from "../firebase/database";

const SELLER = {
  name:    "ข้าวแต๋นน้ำแตงโมแม่บัวจันทร์",
  address: "5 หมู่ 2 ตำบลบ้านเป้า อำเภอเมือง จังหวัดลำปาง 52100",
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
  const [search, setSearch]               = useState("");
  const [selected, setSelected]           = useState(null);
  const [slipSale, setSlipSale]           = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const printRef = useRef();

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

  const statusLabel = { paid:"ชำระเงินแล้ว", pending:"รอชำระเงิน", cancelled:"ยกเลิก", completed:"สำเร็จ" };
  const statusBadge = { paid:"badge-success", pending:"badge-warning", cancelled:"badge-danger", completed:"badge-gray" };
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

  const toggleStatus = async (sale) => {
    const newStatus = sale.status === "paid" ? "pending" : "paid";
    try { await updateSale(sale.id, { status: newStatus }); }
    catch { alert("เกิดข้อผิดพลาด"); }
  };

  const handlePrint = () => {
    if (!slipSale) return;
    const w = window.open("", "_blank", "width=860,height=700");
    w.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>ใบส่งของ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;font-size:11px;color:#1e293b;padding:14px 20px;line-height:1.4}
.wrap{max-width:680px;margin:0 auto}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a56db;padding-bottom:10px;margin-bottom:12px}
.sname{font-size:14px;font-weight:700;color:#1a56db}.sinfo{font-size:10px;color:#475569;margin-top:3px;line-height:1.5}
.title{font-size:18px;font-weight:700;text-align:right;color:#0f172a}.meta{font-size:10px;color:#94a3b8;text-align:right;margin-top:3px;line-height:1.5}
.sec-h{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;margin-top:10px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:6px 10px;font-size:11px;line-height:1.5;color:#334155}
.box-hd{background:#1a56db;color:white;padding:4px 10px;border-radius:4px 4px 0 0;font-weight:700;font-size:11px;margin-top:8px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f1f5f9;padding:5px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0}
td{padding:4px 8px;border-bottom:1px solid #f8f8f8}
.grand td{font-weight:800;color:#1a56db;font-size:13px;background:#eff6ff;padding:7px 8px}
.foot{margin-top:14px;text-align:center;font-size:10px;color:#cbd5e1;padding-top:8px;border-top:1px dashed #e2e8f0}
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
                <th style={{ width:80 }}>กล่อง</th>
                <th style={{ width:80 }}>ค่าส่ง</th>
                <th style={{ width:110 }}>ยอดรวม</th>
                <th style={{ width:90 }}>ผู้ขาย</th>
                <th style={{ width:110 }}>วันที่</th>
                <th style={{ width:80 }}>สถานะ</th>
                <th style={{ width:180 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"var(--gray-400)", maxWidth:"none" }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((sale, i) => (
                <tr key={sale.id}>
                  <td style={{ color:"var(--gray-400)", fontSize:12, maxWidth:"none" }}>{i+1}</td>
                  <td title={sale.customerName}><strong>{sale.customerName || "-"}</strong></td>
                  <td style={{ maxWidth:"none" }}>
                    {sale.numBoxes
                      ? <span className="badge badge-primary">{sale.numBoxes} กล่อง</span>
                      : <span style={{ color:"var(--gray-400)" }}>-</span>}
                  </td>
                  <td style={{ maxWidth:"none", fontSize:13 }}>
                    {sale.shippingCost > 0
                      ? `฿${Number(sale.shippingCost).toLocaleString()}`
                      : <span style={{ color:"var(--success)", fontWeight:600 }}>ฟรี</span>}
                  </td>
                  <td style={{ maxWidth:"none" }}>
                    <strong style={{ color:"var(--primary)" }}>฿{Number(sale.total||0).toLocaleString()}</strong>
                  </td>
                  <td title={sale.createdBy}>{sale.createdBy || "-"}</td>
                  <td style={{ fontSize:12, color:"var(--gray-500)", maxWidth:"none" }}>{formatDate(sale.createdAt)}</td>
                  <td style={{ maxWidth:"none" }}>
                    <button
                      className={`status-toggle ${sale.status === "paid" ? "paid" : "pending"}`}
                      onClick={() => toggleStatus(sale)}
                      title="คลิกเพื่อเปลี่ยนสถานะ">
                      {sale.status === "paid" ? "✓ ชำระแล้ว" : "⏳ รอชำระ"}
                    </button>
                  </td>
                  <td style={{ maxWidth:"none" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(sale)}>รายละเอียด</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSlipSale(sale)}
                        style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
                        </svg>
                        ใบส่งของ
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(sale)}>ลบ</button>
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
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ลูกค้า</div><strong>{selected.customerName||"-"}</strong></div>
                <div><div style={{ fontSize:11, color:"var(--gray-400)", marginBottom:2 }}>ธนาคาร</div><strong style={{ fontSize:13 }}>{selected.bankName||"-"}</strong></div>
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

              {selected.boxes ? (
                <div style={{ marginBottom:14 }}>
                  {selected.boxes.map((box, bIdx) => (
                    <div key={box.id||bIdx} style={{ marginBottom:12 }}>
                      <div style={{ background:"var(--primary)", color:"white", padding:"6px 12px", borderRadius:"6px 6px 0 0", fontSize:13, fontWeight:700 }}>
                        📦 กล่องที่ {bIdx+1}
                      </div>
                      <table style={{ width:"100%", fontSize:13 }}>
                        <thead><tr>
                          <th>สินค้า</th>
                          <th style={{ textAlign:"right", width:90 }}>ราคา/หน่วย</th>
                          <th style={{ textAlign:"right", width:70 }}>จำนวน</th>
                          <th style={{ textAlign:"right", width:90 }}>รวม</th>
                        </tr></thead>
                        <tbody>
                          {(box.items||[]).filter(r=>r.productId).map((row,j) => (
                            <tr key={row.rowId||j}>
                              <td style={{ maxWidth:200 }} title={row.productName}>{row.productName}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>฿{Number(row.price||0).toLocaleString()}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>{row.qty}</td>
                              <td style={{ textAlign:"right", maxWidth:"none" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
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
                <div style={{ marginTop:12, background:"var(--gray-50)", padding:"9px 13px", borderRadius:7, fontSize:13, color:"var(--gray-600)" }}>
                  <strong>หมายเหตุ:</strong> {selected.note}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setSelected(null); setSlipSale(selected); }}>
                ใบส่งของ
              </button>
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
              <h3>ใบส่งของ</h3>
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
                <div style={{ fontFamily:"'Sarabun',sans-serif" }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2.5px solid #1a56db", paddingBottom:18, marginBottom:22 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:"#1a56db" }}>{SELLER.name}</div>
                      <div style={{ fontSize:12, color:"#475569", marginTop:5, lineHeight:1.9 }}>{SELLER.address}<br/>โทร: {SELLER.phone}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:700, color:"#0f172a" }}>ใบส่งของ</div>
                      <div style={{ fontSize:12, color:"#94a3b8", marginTop:4, lineHeight:1.8 }}>
                        วันที่: {s ? new Date(s.createdAt||Date.now()).toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"}) : today}<br/>
                        ผู้ขาย: {s?.createdBy}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {(s?.customerName || s?.customerAddress) && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>ที่อยู่ในการจัดส่งสินค้า</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", fontSize:13, lineHeight:1.9, color:"#334155" }}>
                        <strong>{s.customerName}</strong>
                        {s.customerPhone   && <><br/>โทร: {s.customerPhone}</>}
                        {s.customerAddress && <><br/>{s.customerAddress}</>}
                      </div>
                    </div>
                  )}

                  {/* Boxes */}
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>
                      รายการสินค้า ({s?.numBoxes||"?"} กล่อง)
                    </div>
                    {(s?.boxes||[]).map((box, bIdx) => (
                      <div key={box.id||bIdx} style={{ marginBottom:14 }}>
                        <div style={{ background:"#1a56db", color:"white", padding:"7px 14px", borderRadius:"6px 6px 0 0", fontWeight:700, fontSize:13 }}>
                          📦 กล่องที่ {bIdx+1}
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"left", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>สินค้า</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0", width:90 }}>ราคา/หน่วย</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0", width:70 }}>จำนวน</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0", width:90 }}>รวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(box.items||[]).filter(r=>r.productId).map((row,j) => (
                              <tr key={row.rowId||j}>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9" }}>{row.productName}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{Number(row.price||0).toLocaleString()}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>{row.qty}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3} style={{ padding:"7px 12px", textAlign:"right", color:"#475569", fontSize:12, background:"#f8fafc" }}>ยอดกล่องที่ {bIdx+1}</td>
                              <td style={{ padding:"7px 12px", textAlign:"right", fontWeight:700, background:"#f8fafc" }}>
                                ฿{(box.items||[]).reduce((acc,r)=>acc+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  {/* Grand total */}
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:18 }}>
                    <tbody>
                      <tr>
                        <td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>จำนวนกล่องทั้งหมด</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:120 }}><strong>{s?.numBoxes || "–"} กล่อง</strong></td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ยอดสินค้ารวมทุกกล่อง</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:120 }}>฿{Number(s?.subtotal||0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ค่าส่ง ({slipShipping})</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9" }}>
                          {(s?.shippingCost||0)===0 ? "ฟรี" : `฿${Number(s?.shippingCost||0).toLocaleString()}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>ยอดรวมทั้งหมด</td>
                        <td style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>฿{Number(s?.total||0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {s?.note && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>หมายเหตุ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155" }}>{s.note}</div>
                    </div>
                  )}


                  <div style={{ marginTop:28, textAlign:"center", fontSize:12, color:"#cbd5e1", paddingTop:14, borderTop:"1px dashed #e2e8f0" }}>
                    ขอบคุณที่ใช้บริการ — {SELLER.name} โทร {SELLER.phone}
                  </div>
                </div>
              </div>
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
