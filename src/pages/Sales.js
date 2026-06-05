// src/pages/Sales.js
import React, { useState, useEffect, useRef } from "react";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";
import { useAuth } from "../context/AuthContext";

const SELLER = {
  name:    "ข้าวแต๋นน้ำแตงโมแม่บัวจันทร์",
  address: "5 หมู่ 2 ตำบลบ้านเป้า อำเภอเมือง จังหวัดลำปาง 52100",
  phone:   "084-574-8834",
};

const calcShippingPerBox = (n) => {
  if (n <= 0)  return 0;
  if (n >= 10) return 0;
  if (n >= 5)  return n * 100;
  if (n >= 3)  return n * 120;
  return n * 150;
};
const shippingRateLabel = (n) => {
  if (n <= 0)  return "";
  if (n >= 10) return `${n} กล่อง → ฟรี!`;
  if (n >= 5)  return `${n} × 100 = ฿${(n*100).toLocaleString()}`;
  if (n >= 3)  return `${n} × 120 = ฿${(n*120).toLocaleString()}`;
  return `${n} × 150 = ฿${(n*150).toLocaleString()}`;
};

let boxCounter = 1;
const newBox = () => ({ id: `box_${Date.now()}_${boxCounter++}`, items: [] });
let rowCounter = 1;
const newRow = (product = null) => ({
  rowId:       `row_${Date.now()}_${rowCounter++}`,
  productId:   product?.id    || "",
  productName: product?.name  || "",
  price:       product?.price || "",
  qty:         1,
});

export default function Sales() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [banks,     setBanks]     = useState([]);
  const [boxes,     setBoxes]     = useState([newBox()]);
  const [tab,       setTab]       = useState("all");
  const [form, setForm] = useState({
    customerId: "", bankId: "", note: "",
    shippingType: "free", shippingCustom: "",
  });
  const [loading,      setLoading]      = useState(false);
  const [lastSavedSale, setLastSavedSale] = useState(null); // ใบส่งของเฉพาะหลัง save
  const [showSlip,     setShowSlip]     = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const u1 = getCustomers(setCustomers);
    const u2 = getProducts(setProducts);
    const u3 = getBanks(setBanks);
    return () => { u1(); u2(); u3(); };
  }, []);

  // ─── Box helpers ───────────────────────────────────────────────
  const addBox = () => setBoxes((prev) => [...prev, newBox()]);
  const removeBox = (boxId) =>
    setBoxes((prev) => prev.length > 1 ? prev.filter((b) => b.id !== boxId) : prev);

  const addRowToBox = (boxId) =>
    setBoxes((prev) => prev.map((b) =>
      b.id === boxId ? { ...b, items: [...b.items, newRow()] } : b
    ));

  const updateRow = (boxId, rowId, field, value) =>
    setBoxes((prev) => prev.map((b) =>
      b.id !== boxId ? b : {
        ...b,
        items: b.items.map((r) => {
          if (r.rowId !== rowId) return r;
          if (field === "productId") {
            const p = products.find((x) => x.id === value);
            return p
              ? { ...r, productId: p.id, productName: p.name, price: p.price || "" }
              : { ...r, productId: "", productName: "", price: "" };
          }
          return { ...r, [field]: value };
        }),
      }
    ));

  const removeRow = (boxId, rowId) =>
    setBoxes((prev) => prev.map((b) =>
      b.id !== boxId ? b : { ...b, items: b.items.filter((r) => r.rowId !== rowId) }
    ));

  const quickAdd = (product) => {
    setBoxes((prev) => {
      const lastIdx = prev.length - 1;
      return prev.map((b, i) => {
        if (i !== lastIdx) return b;
        const ex = b.items.find((r) => r.productId === product.id);
        if (ex) return { ...b, items: b.items.map((r) => r.productId === product.id ? { ...r, qty: Number(r.qty)+1 } : r) };
        return { ...b, items: [...b.items, newRow(product)] };
      });
    });
  };

  // ─── Totals ────────────────────────────────────────────────────
  const allItems     = boxes.flatMap((b) => b.items);
  const subtotal     = allItems.reduce((s, r) => s + (Number(r.price)||0)*(Number(r.qty)||0), 0);
  const numBoxes     = boxes.length;
  const shippingCost = (() => {
    if (form.shippingType === "free")    return 0;
    if (form.shippingType === "per_box") return calcShippingPerBox(numBoxes);
    return Number(form.shippingCustom) || 0;
  })();
  const grandTotal = subtotal + shippingCost;

  const visibleProducts   = products.filter((p) => tab === "all" || (p.productType||"product") === tab);
  const selectedCustomer  = customers.find((c) => c.id === form.customerId);
  const selectedBank      = banks.find((b) => b.id === form.bankId);

  // ─── Save ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.customerId) { alert("กรุณาเลือกลูกค้า"); return; }
    const hasItems = boxes.some((b) => b.items.some((r) => r.productId && Number(r.qty) > 0));
    if (!hasItems) { alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }
    setLoading(true);
    try {
      const saleData = {
        customerId:      form.customerId,
        customerName:    selectedCustomer?.name    || "",
        customerPhone:   selectedCustomer?.phone   || "",
        customerAddress: selectedCustomer?.address || "",
        bankId:   form.bankId,
        bankName: selectedBank
          ? `${selectedBank.name} ${selectedBank.accountNo}${selectedBank.accountName ? " · "+selectedBank.accountName : ""}`
          : "",
        boxes:        boxes.map((b) => ({ ...b })),
        subtotal,
        shippingType: form.shippingType,
        shippingCost,
        numBoxes,
        total:     grandTotal,
        note:      form.note,
        createdBy: user?.username,
        status:    "completed",
        createdAt: Date.now(),
        // snapshot for slip
        _slipCustomer: selectedCustomer ? { ...selectedCustomer } : null,
        _slipBank:     selectedBank     ? { ...selectedBank }     : null,
      };
      await addSale(saleData);
      // เก็บ snapshot ไว้แสดงใบส่งของ แล้ว reset form
      setLastSavedSale(saleData);
      setBoxes([newBox()]);
      setForm({ customerId:"", bankId:"", note:"", shippingType:"free", shippingCustom:"" });
      setShowSlip(true); // เปิดใบส่งของทันที
    } catch { alert("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  // ─── Print ─────────────────────────────────────────────────────
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=860,height=700");
    w.document.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>ใบส่งของ</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;font-size:14px;color:#1e293b;padding:36px 40px}
.wrap{max-width:700px;margin:0 auto}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #1a56db;padding-bottom:18px;margin-bottom:22px}
.sname{font-size:18px;font-weight:700;color:#1a56db}.sinfo{font-size:12px;color:#475569;margin-top:5px;line-height:1.9}
.title{font-size:24px;font-weight:700;text-align:right;color:#0f172a}.meta{font-size:12px;color:#94a3b8;text-align:right;margin-top:4px;line-height:1.8}
.sec-h{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;margin-top:16px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:13px;line-height:1.9;color:#334155}
.box-hd{background:#1a56db;color:white;padding:7px 14px;border-radius:6px 6px 0 0;font-weight:700;font-size:13px;margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f1f5f9;padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
.grand td{font-weight:800;color:#1a56db;font-size:16px;background:#eff6ff;padding:12px}
.foot{margin-top:28px;text-align:center;font-size:12px;color:#cbd5e1;padding-top:14px;border-top:1px dashed #e2e8f0}
@media print{body{padding:20px}}
</style></head><body><div class="wrap">${printRef.current.innerHTML}</div></body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 450);
  };

  const today = new Date().toLocaleDateString("th-TH", { dateStyle: "full" });
  const slip = lastSavedSale;
  const slipShippingLabel = {
    free:    "ส่งฟรี",
    per_box: slip ? shippingRateLabel(slip.numBoxes) : "",
    custom:  "กำหนดเอง",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">การขาย</h2>
          <p className="page-subtitle">สร้างรายการขายใหม่</p>
        </div>
        {lastSavedSale && (
          <button className="btn btn-secondary" onClick={() => setShowSlip(true)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
            </svg>
            ใบส่งของล่าสุด
          </button>
        )}
      </div>

      <div className="sales-grid">
        {/* ════ LEFT ════ */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Sale info */}
          <div className="card">
            <h3 style={{ fontSize:15, marginBottom:16, color:"var(--gray-800)" }}>ข้อมูลการขาย</h3>
            <div className="form-row">
              <div className="form-group">
                <label>ลูกค้า <span style={{ color:"var(--danger)" }}>*</span></label>
                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ธนาคาร</label>
                <select value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })}>
                  <option value="">-- เลือกธนาคาร --</option>
                  {banks.map((b) => <option key={b.id} value={b.id}>{b.name} – {b.accountNo}</option>)}
                </select>
              </div>
            </div>
            {selectedCustomer?.address && (
              <div style={{ background:"var(--gray-50)", border:"1px solid var(--gray-200)", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--gray-400)", letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>📦 ที่อยู่จัดส่ง</div>
                <div style={{ fontWeight:600 }}>{selectedCustomer.name}</div>
                {selectedCustomer.phone   && <div style={{ color:"var(--gray-500)" }}>{selectedCustomer.phone}</div>}
                {selectedCustomer.address && <div style={{ color:"var(--gray-600)" }}>{selectedCustomer.address}</div>}
              </div>
            )}
            <div className="form-group" style={{ marginBottom:0 }}>
              <label>หมายเหตุ</label>
              <input type="text" placeholder="หมายเหตุ (ถ้ามี)" value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          {/* Product list */}
          <div className="card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:10, flexWrap:"wrap" }}>
              <h3 style={{ fontSize:15, color:"var(--gray-800)" }}>เลือกสินค้า</h3>
              <div className="product-tab-bar">
                {[["all","ทั้งหมด"],["product","ผลิตภัณฑ์"],["material","วัตถุดิบ"]].map(([k,l]) => (
                  <button key={k} className={`product-tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>
            </div>
            {visibleProducts.length === 0 ? (
              <div className="empty-state"><div className="icon">📦</div><p>ยังไม่มีสินค้า</p></div>
            ) : (
              <div className="product-list">
                {visibleProducts.map((p) => (
                  <div key={p.id} className="product-list-item" onClick={() => quickAdd(p)}>
                    <div className="pli-left">
                      <span className={`badge ${(p.productType||"product")==="material"?"badge-warning":"badge-primary"}`} style={{ fontSize:10, padding:"2px 7px", flexShrink:0 }}>
                        {(p.productType||"product")==="material"?"วัตถุดิบ":"ผลิตภัณฑ์"}
                      </span>
                      <span className="pli-name">{p.name}</span>
                      {p.description && <span className="pli-desc">{p.description}</span>}
                    </div>
                    <div className="pli-right">
                      <span className="pli-price">฿{Number(p.price||0).toLocaleString()}</span>
                      <span className="pli-add">+ เพิ่ม</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT: Boxes + summary ════ */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {boxes.map((box, bIdx) => (
            <div key={box.id} className="card" style={{ padding:0, overflow:"hidden" }}>
              <div className="box-header-bar">
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span>📦</span>
                  <span>กล่องที่ {bIdx+1}</span>
                  <span style={{ fontSize:11, opacity:.7 }}>({box.items.length} รายการ)</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn-icon-sm" onClick={() => addRowToBox(box.id)}>+ เพิ่มสินค้า</button>
                  {boxes.length > 1 && (
                    <button className="btn-icon-sm danger" onClick={() => removeBox(box.id)}>🗑</button>
                  )}
                </div>
              </div>
              <div style={{ padding:"12px 14px" }}>
                {box.items.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"14px 0", color:"var(--gray-400)", fontSize:13 }}>
                    คลิกสินค้าด้านซ้าย หรือกด "+ เพิ่มสินค้า"
                  </div>
                ) : (
                  <>
                    <div className="box-item-header">
                      <div style={{ flex:1 }}>สินค้า</div>
                      <div style={{ width:80, textAlign:"center" }}>จำนวน</div>
                      <div style={{ width:76, textAlign:"right" }}>ราคา/หน่วย</div>
                      <div style={{ width:76, textAlign:"right" }}>รวม</div>
                      <div style={{ width:24 }}></div>
                    </div>
                    {box.items.map((row) => (
                      <div key={row.rowId} className="box-item-row">
                        <div style={{ flex:1, minWidth:0 }}>
                          <select className="box-select" value={row.productId}
                            onChange={(e) => updateRow(box.id, row.rowId, "productId", e.target.value)}>
                            <option value="">-- เลือกสินค้า --</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div style={{ width:80, display:"flex", alignItems:"center", gap:2 }}>
                          <button className="qty-btn" style={{ width:22, height:28, fontSize:13 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Math.max(1, Number(row.qty)-1))}>−</button>
                          <input type="number" className="qty-input" style={{ width:34, fontSize:13 }}
                            value={row.qty} min="1"
                            onChange={(e) => updateRow(box.id, row.rowId, "qty", e.target.value)} />
                          <button className="qty-btn" style={{ width:22, height:28, fontSize:13 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Number(row.qty)+1)}>+</button>
                        </div>
                        <div style={{ width:76 }}>
                          <input type="number" className="price-input" style={{ width:"100%", fontSize:12, padding:"5px 6px" }}
                            value={row.price} onChange={(e) => updateRow(box.id, row.rowId, "price", e.target.value)} />
                        </div>
                        <div style={{ width:76, textAlign:"right", fontSize:12, fontWeight:700, color:"var(--primary)" }}>
                          {row.productId ? `฿${(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}` : "–"}
                        </div>
                        <button className="cart-remove" onClick={() => removeRow(box.id, row.rowId)}>✕</button>
                      </div>
                    ))}
                    {box.items.some((r) => r.productId) && (
                      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:7, marginTop:4, borderTop:"1px dashed var(--gray-200)", fontSize:12, fontWeight:600, color:"var(--gray-500)" }}>
                        ยอดกล่องนี้ ฿{box.items.reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          <button className="add-box-btn" onClick={addBox}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            เพิ่มกล่องที่ {boxes.length+1}
          </button>

          {/* Summary */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--gray-600)", marginBottom:8 }}>
                ค่าจัดส่ง ({numBoxes} กล่อง)
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {[
                  { value:"free",    label:"ส่งฟรี",          sub:"ไม่มีค่าส่ง",              price:"฿0" },
                  { value:"per_box", label:"ตามจำนวนกล่อง",  sub:shippingRateLabel(numBoxes), price: numBoxes>=10?"ฟรี":`฿${calcShippingPerBox(numBoxes).toLocaleString()}` },
                  { value:"custom",  label:"กำหนดค่าส่งเอง", sub:"ระบุจำนวนเอง",              price:null },
                ].map((opt) => (
                  <label key={opt.value} className={`shipping-option ${form.shippingType===opt.value?"selected":""}`}>
                    <input type="radio" name="shipping" value={opt.value}
                      checked={form.shippingType===opt.value}
                      onChange={() => setForm({ ...form, shippingType: opt.value })} />
                    <span className="shipping-label">{opt.label}</span>
                    <span className="shipping-sub">{opt.sub}</span>
                    {opt.price && (
                      <span className="shipping-price" style={{ color: opt.value==="free"||(opt.value==="per_box"&&numBoxes>=10) ? "var(--success)" : "var(--primary)" }}>
                        {opt.price}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {form.shippingType === "custom" && (
                <input type="number" placeholder="ระบุค่าส่ง (บาท)" value={form.shippingCustom}
                  onChange={(e) => setForm({ ...form, shippingCustom: e.target.value })}
                  style={{ marginTop:8 }} />
              )}
              {form.shippingType === "per_box" && (
                <div className="shipping-tier-table">
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--gray-400)", marginBottom:5 }}>อัตราค่าส่ง</div>
                  {[["1-2","150"],["3-4","120"],["5-9","100"],["10+","ฟรี"]].map(([range, rate]) => {
                    const active = (range==="1-2"&&numBoxes<=2)||(range==="3-4"&&numBoxes>=3&&numBoxes<=4)||(range==="5-9"&&numBoxes>=5&&numBoxes<=9)||(range==="10+"&&numBoxes>=10);
                    return (
                      <div key={range} className={`tier-row ${active?"active":""}`}>
                        <span>{range} กล่อง</span>
                        <span>{rate==="ฟรี"?"ฟรี 🎉":`${rate} บาท/กล่อง`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ paddingTop:14, borderTop:"1.5px dashed var(--gray-200)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:5 }}>
                <span>ยอดสินค้า ({numBoxes} กล่อง)</span><span>฿{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:10 }}>
                <span>ค่าส่ง</span>
                <span style={{ color:shippingCost===0?"var(--success)":"inherit", fontWeight:shippingCost===0?600:400 }}>
                  {shippingCost===0?"ฟรี":`฿${shippingCost.toLocaleString()}`}
                </span>
              </div>
              <div className="cart-total">
                <span>ยอดรวมทั้งหมด</span>
                <span className="total-amount">฿{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", marginTop:14 }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner"/> : "💾 บันทึกการขาย"}
            </button>
          </div>
        </div>
      </div>

      {/* ════ Delivery Slip Modal (only from lastSavedSale) ════ */}
      {showSlip && slip && (
        <div className="modal-overlay" onClick={() => setShowSlip(false)}>
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
                <button className="btn-icon btn-secondary" onClick={() => setShowSlip(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding:"4px 24px 24px", maxHeight:"80vh", overflowY:"auto" }}>
              <div ref={printRef}>
                <div style={{ fontFamily:"'Sarabun',sans-serif" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2.5px solid #1a56db", paddingBottom:18, marginBottom:22 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:"#1a56db" }}>{SELLER.name}</div>
                      <div style={{ fontSize:12, color:"#475569", marginTop:5, lineHeight:1.9 }}>{SELLER.address}<br/>โทร: {SELLER.phone}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:700, color:"#0f172a" }}>ใบส่งของ</div>
                      <div style={{ fontSize:12, color:"#94a3b8", marginTop:4, lineHeight:1.8 }}>วันที่: {today}<br/>ผู้ขาย: {slip.createdBy}</div>
                    </div>
                  </div>

                  {slip._slipCustomer && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>ที่อยู่ในการจัดส่งสินค้า</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", fontSize:13, lineHeight:1.9, color:"#334155" }}>
                        <strong>{slip._slipCustomer.name}</strong>
                        {slip._slipCustomer.phone   && <><br/>โทร: {slip._slipCustomer.phone}</>}
                        {slip._slipCustomer.address && <><br/>{slip._slipCustomer.address}</>}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>รายการสินค้า ({slip.numBoxes} กล่อง)</div>
                    {(slip.boxes||[]).map((box, bIdx) => (
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
                            {(box.items||[]).filter(r=>r.productId).map((row,i) => (
                              <tr key={row.rowId||i}>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9" }}>{row.productName}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{Number(row.price||0).toLocaleString()}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>{row.qty}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3} style={{ padding:"7px 12px", textAlign:"right", color:"#475569", fontSize:12, background:"#f8fafc" }}>ยอดกล่องที่ {bIdx+1}</td>
                              <td style={{ padding:"7px 12px", textAlign:"right", fontWeight:700, background:"#f8fafc" }}>
                                ฿{(box.items||[]).reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:18 }}>
                    <tbody>
                      <tr><td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ยอดสินค้ารวมทุกกล่อง</td><td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:120 }}>฿{Number(slip.subtotal||0).toLocaleString()}</td></tr>
                      <tr><td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ค่าส่ง ({slipShippingLabel[slip.shippingType]||""})</td><td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9" }}>{slip.shippingCost===0?"ฟรี":`฿${Number(slip.shippingCost||0).toLocaleString()}`}</td></tr>
                      <tr><td colSpan={3} style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>ยอดรวมทั้งหมด</td><td style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>฿{Number(slip.total||0).toLocaleString()}</td></tr>
                    </tbody>
                  </table>

                  {slip.note && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>หมายเหตุ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155" }}>{slip.note}</div>
                    </div>
                  )}
                  {slip._slipBank && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>ข้อมูลการชำระเงิน</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155", lineHeight:1.9 }}>
                        <strong>{slip._slipBank.name}</strong><br/>
                        เลขบัญชี: {slip._slipBank.accountNo}
                        {slip._slipBank.accountName && <><br/>ชื่อบัญชี: {slip._slipBank.accountName}</>}
                        {slip._slipBank.branch && <><br/>สาขา: {slip._slipBank.branch}</>}
                      </div>
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
    </div>
  );
}
