// src/pages/Sales.js
import React, { useState, useEffect, useRef } from "react";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";
import { useAuth } from "../context/AuthContext";

// ─── Searchable customer dropdown ──────────────────────────────
function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery]   = useState("");
  const [open,  setOpen]    = useState(false);
  const ref = useRef();

  const selected = customers.find((c) => c.id === value);
  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (c) => { onChange(c.id); setQuery(""); setOpen(false); };
  const clear  = () => { onChange(""); setQuery(""); setOpen(false); };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div className={`cs-box ${open?"open":""}`} onClick={() => setOpen(true)}>
        {selected && !open ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px" }}>
            <span style={{ fontSize:14, color:"var(--gray-800)", fontWeight:500 }}>{selected.name}</span>
            <button type="button" className="cs-clear" onClick={(e) => { e.stopPropagation(); clear(); }}>✕</button>
          </div>
        ) : (
          <input
            autoFocus={open}
            type="text"
            placeholder={open ? "ค้นหาชื่อหรือเบอร์โทร..." : "-- เลือกลูกค้า --"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => setOpen(true)}
            style={{ border:"none", outline:"none", width:"100%", padding:"8px 12px", background:"transparent", fontSize:14 }}
          />
        )}
      </div>
      {open && (
        <div className="cs-dropdown">
          {filtered.length === 0 ? (
            <div style={{ padding:"12px 14px", color:"var(--gray-400)", fontSize:13 }}>ไม่พบลูกค้า</div>
          ) : filtered.map((c) => (
            <div key={c.id} className="cs-option" onClick={() => select(c)}>
              <div style={{ fontWeight:600, fontSize:13 }}>{c.name}</div>
              {c.phone && <div style={{ fontSize:11, color:"var(--gray-400)" }}>{c.phone}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
const shippingRateLabel = (n) => {
  if (n <= 0)  return "";
  if (n >= 10) return `${n} กล่อง → ฟรี!`;
  if (n >= 5)  return `${n} × 100 = ฿${(n*100).toLocaleString()}`;
  if (n >= 3)  return `${n} × 120 = ฿${(n*120).toLocaleString()}`;
  return `${n} × 150 = ฿${(n*150).toLocaleString()}`;
};

let boxCounter = 1;
const newBox = () => ({ id: `box_${Date.now()}_${boxCounter++}`, items: [], boxQty: 1 });
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
    shippingType: "", shippingCustom: "",
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

  const updateBoxQty = (boxId, qty) =>
    setBoxes((prev) => prev.map((b) =>
      b.id === boxId ? { ...b, boxQty: Math.max(1, Number(qty)||1) } : b
    ));

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
  const numBoxes     = boxes.reduce((s,b) => s + (Number(b.boxQty)||1), 0);
  const shippingCost = (() => {
    if (!form.shippingType || form.shippingType === "free") return 0;
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
    if (!form.shippingType) { alert("กรุณาเลือกค่าจัดส่ง"); return; }
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
        boxes:        boxes.map((b) => ({ ...b, boxQty: Number(b.boxQty)||1 })),
        subtotal,
        shippingType: form.shippingType,
        shippingCost,
        numBoxes,
        total:     grandTotal,
        note:      form.note,
        createdBy: user?.username,
        status:    "pending",
        createdAt: Date.now(),
        // snapshot for slip
        _slipCustomer: selectedCustomer ? { ...selectedCustomer } : null,
        _slipBank:     selectedBank     ? { ...selectedBank }     : null,
      };
      await addSale(saleData);
      // เก็บ snapshot ไว้แสดงใบส่งของ แล้ว reset form
      setLastSavedSale(saleData);
      setBoxes([newBox()]);
      setForm({ customerId:"", bankId:"", note:"", shippingType:"", shippingCustom:"" });
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
            <div style={{ marginBottom:14 }}>
              <div className="form-group">
                <label>ลูกค้า <span style={{ color:"var(--danger)" }}>*</span></label>
                <CustomerSearch
                  customers={customers}
                  value={form.customerId}
                  onChange={(id) => setForm({ ...form, customerId: id })}
                />
              </div>
            </div>
            {/* Fixed-height address box - always reserves space to prevent layout jump */}
            <div style={{ minHeight:72, marginBottom:14, borderRadius:8, overflow:"hidden",
              background: selectedCustomer?.address ? "var(--gray-50)" : "transparent",
              border: selectedCustomer?.address ? "1px solid var(--gray-200)" : "1px solid transparent",
              padding: selectedCustomer?.address ? "10px 14px" : "0 14px",
              transition:"all 0.15s ease", fontSize:13 }}>
              {selectedCustomer?.address ? (
                <>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--gray-400)", letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>📦 ที่อยู่จัดส่ง</div>
                  <div style={{ fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={selectedCustomer.name}>{selectedCustomer.name}</div>
                  {selectedCustomer.phone   && <div style={{ color:"var(--gray-500)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{selectedCustomer.phone}</div>}
                  {selectedCustomer.address && <div style={{ color:"var(--gray-600)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={selectedCustomer.address}>{selectedCustomer.address}</div>}
                </>
              ) : (
                <div style={{ height:"100%", display:"flex", alignItems:"center", color:"var(--gray-300)", fontSize:12 }}>
                  เลือกลูกค้าเพื่อแสดงที่อยู่จัดส่ง
                </div>
              )}
            </div>
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
                      <span className="pli-name" title={p.name && p.name.length > 18 ? p.name : undefined}>{p.name}</span>
                      {p.description && <span className="pli-desc" title={p.description}>{p.description}</span>}
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
                  <span>รายการที่ {bIdx+1}</span>
                  <span style={{ fontSize:11, opacity:.7 }}>({box.items.length} สินค้า)</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.15)", borderRadius:6, padding:"3px 8px" }}>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)", whiteSpace:"nowrap" }}>จำนวนกล่อง</span>
                    <button style={{ background:"none", border:"none", color:"white", fontSize:16, cursor:"pointer", lineHeight:1, padding:"0 2px" }}
                      onClick={() => updateBoxQty(box.id, (Number(box.boxQty)||1)-1)}>−</button>
                    <input type="number" min="1"
                      value={box.boxQty||1}
                      onChange={(e) => updateBoxQty(box.id, e.target.value)}
                      style={{ width:36, textAlign:"center", border:"1px solid rgba(255,255,255,0.4)", borderRadius:4, background:"rgba(255,255,255,0.2)", color:"white", fontWeight:700, fontSize:13, padding:"2px 0" }} />
                    <button style={{ background:"none", border:"none", color:"white", fontSize:16, cursor:"pointer", lineHeight:1, padding:"0 2px" }}
                      onClick={() => updateBoxQty(box.id, (Number(box.boxQty)||1)+1)}>+</button>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.8)" }}>กล่อง</span>
                  </div>
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
                      <div style={{ width:96, textAlign:"center" }}>จำนวน</div>
                      <div style={{ width:76, textAlign:"right" }}>ราคา/หน่วย</div>
                      <div style={{ width:76, textAlign:"right" }}>รวม</div>
                      <div style={{ width:24 }}></div>
                    </div>
                    {box.items.map((row) => (
                      <div key={row.rowId} className="box-item-row">
                        <div className="row-select">
                          <select className="box-select" value={row.productId}
                            onChange={(e) => updateRow(box.id, row.rowId, "productId", e.target.value)}>
                            <option value="">-- เลือกสินค้า --</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="row-qty">
                          <button className="qty-btn" style={{ width:24, height:28, fontSize:13, flexShrink:0 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Math.max(1, Number(row.qty)-1))}>−</button>
                          <input type="number" className="qty-input"
                            value={row.qty} min="1"
                            onChange={(e) => updateRow(box.id, row.rowId, "qty", e.target.value)} />
                          <button className="qty-btn" style={{ width:24, height:28, fontSize:13, flexShrink:0 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Number(row.qty)+1)}>+</button>
                        </div>
                        <div className="row-price">
                          <input type="number" className="price-input" style={{ width:"100%", fontSize:12, padding:"5px 6px" }}
                            value={row.price} onChange={(e) => updateRow(box.id, row.rowId, "price", e.target.value)} />
                        </div>
                        <div className="row-total">
                          {row.productId ? `฿${(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}` : "–"}
                        </div>
                        <div className="row-del">
                          <button className="cart-remove" onClick={() => removeRow(box.id, row.rowId)}>✕</button>
                        </div>
                      </div>
                    ))}
                    {box.items.some((r) => r.productId) && (
                      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:7, marginTop:4, borderTop:"1px dashed var(--gray-200)", fontSize:12, fontWeight:600, color:"var(--gray-500)" }}>
                        ยอดรายการที่ {bIdx+1} ({Number(box.boxQty)||1} กล่อง) ฿{box.items.reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
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
            เพิ่มรายการที่ {boxes.length+1}
          </button>

          {/* Summary */}
          <div className="card">
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--gray-600)", marginBottom:8 }}>
                ค่าจัดส่ง ({numBoxes} รายการ) <span style={{ color:"var(--danger)" }}>*</span>
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
                <span>ยอดสินค้า ({numBoxes} รายการ)</span><span>฿{subtotal.toLocaleString()}</span>
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
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>ที่อยู่ในการจัดส่งสินค้า</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", fontSize:13, lineHeight:1.9, color:"#334155" }}>
                        <strong>{slip._slipCustomer.name}</strong>
                        {slip._slipCustomer.phone   && <><br/>โทร: {slip._slipCustomer.phone}</>}
                        {slip._slipCustomer.address && <><br/>{slip._slipCustomer.address}</>}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>รายการสินค้า ({slip.numBoxes} รายการ)</div>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr>
                          <th style={{ background:"#f1f5f9", padding:"7px 10px", textAlign:"left", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0" }}>สินค้า</th>
                          <th style={{ background:"#f1f5f9", padding:"7px 10px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:90 }}>ราคา/หน่วย</th>
                          <th style={{ background:"#f1f5f9", padding:"7px 10px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:70 }}>จำนวน</th>
                          <th style={{ background:"#f1f5f9", padding:"7px 10px", textAlign:"right", fontWeight:700, color:"#475569", borderBottom:"1.5px solid #e2e8f0", width:90 }}>รวม</th>
                        </tr>
                      </thead>
                      {(slip.boxes||[]).map((box, bIdx) => (
                        <tbody key={box.id||bIdx}>
                          {/* Box label row */}
                          <tr>
                            <td colSpan={4} style={{ padding:"5px 10px", background:"#1a56db", color:"white", fontWeight:700, fontSize:12 }}>
                              📦 รายการที่ {bIdx+1}  ({Number(box.boxQty)||1} กล่อง)
                            </td>
                          </tr>
                          {(box.items||[]).filter(r=>r.productId).map((row,i) => (
                            <tr key={row.rowId||i}>
                              <td style={{ padding:"6px 10px", borderBottom:"1px solid #f1f5f9" }}>{row.productName}</td>
                              <td style={{ padding:"6px 10px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{Number(row.price||0).toLocaleString()}</td>
                              <td style={{ padding:"6px 10px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>{row.qty}</td>
                              <td style={{ padding:"6px 10px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                            </tr>
                          ))}
                          {/* Box subtotal */}
                          <tr>
                            <td colSpan={3} style={{ padding:"5px 10px", textAlign:"right", color:"#64748b", fontSize:12, background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>ยอดรายการที่ {bIdx+1}</td>
                            <td style={{ padding:"5px 10px", textAlign:"right", fontWeight:700, background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0" }}>
                              ฿{(box.items||[]).reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      ))}
                    </table>
                  </div>

                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:18 }}>
                    <tbody>
                      <tr><td colSpan={3} style={{ padding:"7px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>จำนวนรายการทั้งหมด</td><td style={{ padding:"7px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:110 }}>{slip.numBoxes} กล่อง ({(slip.boxes||[]).length} รายการ)</td></tr>
                      <tr><td colSpan={3} style={{ padding:"7px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ยอดสินค้ารวมทุกรายการ</td><td style={{ padding:"7px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:110 }}>฿{Number(slip.subtotal||0).toLocaleString()}</td></tr>
                      <tr><td colSpan={3} style={{ padding:"7px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ค่าส่ง ({slipShippingLabel[slip.shippingType]||""})</td><td style={{ padding:"2px 4px", textAlign:"right", borderBottom:"1px solid #f8f8f8", fontSize:"5px" }}>{slip.shippingCost===0?"ฟรี":`฿${Number(slip.shippingCost||0).toLocaleString()}`}</td></tr>
                      <tr><td colSpan={3} style={{ padding:"9px 10px", textAlign:"right", fontWeight:800, fontSize:15, color:"#1a56db", background:"#eff6ff" }}>ยอดรวมทั้งหมด</td><td style={{ padding:"9px 10px", textAlign:"right", fontWeight:800, fontSize:15, color:"#1a56db", background:"#eff6ff" }}>฿{Number(slip.total||0).toLocaleString()}</td></tr>
                    </tbody>
                  </table>

                  {slip.note && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>หมายเหตุ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155" }}>{slip.note}</div>
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
