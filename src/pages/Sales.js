// src/pages/Sales.js
import React, { useState, useEffect, useRef } from "react";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";
import { useAuth } from "../context/AuthContext";

const SELLER = {
  name:    "ข้าวแต๋นน้ำแตงโมแม่บัวจันทร์",
  address: "5 หมู่ 2 ตำบลบ้านเป้า อำเภอเมือง จังหวัดลำปาง 52100",
  phone:   "084-574-8834",
};

// ─── Shipping calc per-box ──────────────────────────────────────
const calcShippingPerBox = (numBoxes) => {
  if (numBoxes <= 0)   return 0;
  if (numBoxes >= 10)  return 0;           // 10+ ฟรี
  if (numBoxes >= 5)   return numBoxes * 100;
  if (numBoxes >= 3)   return numBoxes * 120;
  return numBoxes * 150;                   // 1-2 กล่อง
};

const shippingRateLabel = (n) => {
  if (n <= 0)  return "";
  if (n >= 10) return `${n} กล่อง → ฟรี!`;
  if (n >= 5)  return `${n} กล่อง × 100 = ฿${(n*100).toLocaleString()}`;
  if (n >= 3)  return `${n} กล่อง × 120 = ฿${(n*120).toLocaleString()}`;
  return `${n} กล่อง × 150 = ฿${(n*150).toLocaleString()}`;
};

// ─── Empty box factory ──────────────────────────────────────────
let boxCounter = 1;
const newBox = () => ({ id: `box_${Date.now()}_${boxCounter++}`, items: [] });

// ─── Empty item row factory ─────────────────────────────────────
let rowCounter = 1;
const newRow = (product = null) => ({
  rowId:   `row_${Date.now()}_${rowCounter++}`,
  productId:   product?.id    || "",
  productName: product?.name  || "",
  unit:        product?.unit  || "",
  price:       product?.price || "",
  qty:         1,
});

export default function Sales() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [banks,     setBanks]     = useState([]);
  const [boxes,     setBoxes]     = useState([newBox()]);   // array of { id, items[] }
  const [tab,       setTab]       = useState("all");
  const [form, setForm] = useState({
    customerId: "", bankId: "", note: "",
    shippingType: "free", shippingCustom: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [showSlip, setShowSlip] = useState(false);
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

  // ─── Item row helpers ──────────────────────────────────────────
  const addRowToBox = (boxId, product = null) =>
    setBoxes((prev) => prev.map((b) =>
      b.id === boxId ? { ...b, items: [...b.items, newRow(product)] } : b
    ));

  const updateRow = (boxId, rowId, field, value) =>
    setBoxes((prev) => prev.map((b) =>
      b.id !== boxId ? b : {
        ...b,
        items: b.items.map((r) => {
          if (r.rowId !== rowId) return r;
          // if product dropdown changed, fill in name/unit/price
          if (field === "productId") {
            const p = products.find((x) => x.id === value);
            return p
              ? { ...r, productId: p.id, productName: p.name, unit: p.unit || "", price: p.price || "" }
              : { ...r, productId: "", productName: "", unit: "", price: "" };
          }
          return { ...r, [field]: value };
        }),
      }
    ));

  const removeRow = (boxId, rowId) =>
    setBoxes((prev) => prev.map((b) =>
      b.id !== boxId ? b : { ...b, items: b.items.filter((r) => r.rowId !== rowId) }
    ));

  // ─── Quick-add product card click → adds to last box ──────────
  const quickAdd = (product) => {
    setBoxes((prev) => {
      const last = prev[prev.length - 1];
      const existing = last.items.find((r) => r.productId === product.id);
      if (existing) {
        return prev.map((b, i) =>
          i < prev.length - 1 ? b : {
            ...b,
            items: b.items.map((r) =>
              r.productId === product.id ? { ...r, qty: Number(r.qty) + 1 } : r
            ),
          }
        );
      }
      return prev.map((b, i) =>
        i < prev.length - 1 ? b : { ...b, items: [...b.items, newRow(product)] }
      );
    });
  };

  // ─── Totals ────────────────────────────────────────────────────
  const allItems     = boxes.flatMap((b) => b.items);
  const subtotal     = allItems.reduce((s, r) => s + (Number(r.price)||0) * (Number(r.qty)||0), 0);
  const numBoxes     = boxes.length;
  const shippingCost = (() => {
    if (form.shippingType === "free")    return 0;
    if (form.shippingType === "per_box") return calcShippingPerBox(numBoxes);
    return Number(form.shippingCustom) || 0;
  })();
  const grandTotal = subtotal + shippingCost;

  const visibleProducts = products.filter(
    (p) => tab === "all" || (p.productType || "product") === tab
  );
  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const selectedBank     = banks.find((b) => b.id === form.bankId);

  // ─── Save ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.customerId) { alert("กรุณาเลือกลูกค้า"); return; }
    const hasItems = boxes.some((b) => b.items.some((r) => r.productId && Number(r.qty) > 0));
    if (!hasItems) { alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }
    setLoading(true);
    try {
      await addSale({
        customerId:      form.customerId,
        customerName:    selectedCustomer?.name    || "",
        customerPhone:   selectedCustomer?.phone   || "",
        customerAddress: selectedCustomer?.address || "",
        bankId:   form.bankId,
        bankName: selectedBank
          ? `${selectedBank.name} ${selectedBank.accountNo}${selectedBank.accountName ? " · " + selectedBank.accountName : ""}`
          : "",
        boxes:         boxes.map((b) => ({ ...b })),
        subtotal,
        shippingType:  form.shippingType,
        shippingCost,
        numBoxes,
        total: grandTotal,
        note:  form.note,
        createdBy: user?.username,
        status: "completed",
      });
      setBoxes([newBox()]);
      setForm({ customerId:"", bankId:"", note:"", shippingType:"free", shippingCustom:"" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
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
.sec{margin-bottom:18px}.sec-h{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.box-info{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:13px;line-height:1.9;color:#334155}
.box-header{background:#1a56db;color:white;padding:8px 14px;border-radius:6px 6px 0 0;font-weight:700;font-size:13px;margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f1f5f9;padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9}.tr{text-align:right}
.sum-row td{background:#f8fafc;color:#475569;font-size:13px}
.grand td{font-weight:800;color:#1a56db;font-size:16px;background:#eff6ff;padding:12px}
.foot{margin-top:28px;text-align:center;font-size:12px;color:#cbd5e1;padding-top:14px;border-top:1px dashed #e2e8f0}
@media print{body{padding:20px}}
</style></head><body><div class="wrap">${printRef.current.innerHTML}</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 450);
  };

  const today = new Date().toLocaleDateString("th-TH", { dateStyle: "full" });
  const slipShippingLabel = {
    free:    "ส่งฟรี",
    per_box: shippingRateLabel(numBoxes),
    custom:  "กำหนดเอง",
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">การขาย</h2>
          <p className="page-subtitle">สร้างรายการขายใหม่</p>
        </div>
        {form.customerId && boxes.some((b) => b.items.length > 0) && (
          <button className="btn btn-secondary" onClick={() => setShowSlip(true)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
            </svg>
            ดูใบส่งของ
          </button>
        )}
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
                <div style={{ fontWeight:600, color:"var(--gray-800)" }}>{selectedCustomer.name}</div>
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

          {/* Product catalog quick-add */}
          <div className="card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:10, flexWrap:"wrap" }}>
              <h3 style={{ fontSize:15, color:"var(--gray-800)" }}>เลือกสินค้า (เพิ่มเข้ากล่องล่าสุด)</h3>
              <div className="product-tab-bar">
                {[["all","ทั้งหมด"],["product","ผลิตภัณฑ์"],["material","วัตถุดิบ"]].map(([k,l]) => (
                  <button key={k} className={`product-tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>
            </div>
            {visibleProducts.length === 0 ? (
              <div className="empty-state"><div className="icon">📦</div><p>ยังไม่มีสินค้า</p></div>
            ) : (
              <div className="product-grid">
                {visibleProducts.map((p) => (
                  <div key={p.id} className="product-card" onClick={() => quickAdd(p)}>
                    <div style={{ position:"absolute", top:7, right:7 }}>
                      <span className={`badge ${(p.productType||"product")==="material"?"badge-warning":"badge-primary"}`} style={{ fontSize:9, padding:"2px 6px" }}>
                        {(p.productType||"product")==="material"?"วัตถุดิบ":"ผลิตภัณฑ์"}
                      </span>
                    </div>
                    <div className="product-name" style={{ paddingTop:4 }}>{p.name}</div>
                    <div className="product-price">฿{Number(p.price||0).toLocaleString()}</div>
                    {p.unit && <div className="product-unit">{p.unit}</div>}
                    <div className="product-add">+ เพิ่ม</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT: Boxes + summary ════ */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Boxes */}
          {boxes.map((box, bIdx) => (
            <div key={box.id} className="card" style={{ padding:0, overflow:"hidden" }}>
              {/* Box header */}
              <div className="box-header-bar">
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div className="box-icon">📦</div>
                  <span>กล่องที่ {bIdx + 1}</span>
                  <span style={{ fontSize:11, opacity:.7 }}>({box.items.length} รายการ)</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn-icon-sm" title="เพิ่มแถวสินค้า" onClick={() => addRowToBox(box.id)}>
                    + เพิ่มสินค้า
                  </button>
                  {boxes.length > 1 && (
                    <button className="btn-icon-sm danger" title="ลบกล่อง" onClick={() => removeBox(box.id)}>
                      🗑
                    </button>
                  )}
                </div>
              </div>

              {/* Items in box */}
              <div style={{ padding:"12px 14px" }}>
                {box.items.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"16px 0", color:"var(--gray-400)", fontSize:13 }}>
                    คลิกสินค้าด้านซ้าย หรือกด "+ เพิ่มสินค้า"
                  </div>
                ) : (
                  <>
                    {/* Column headers */}
                    <div className="box-item-header">
                      <div style={{ flex:1 }}>สินค้า</div>
                      <div style={{ width:72, textAlign:"center" }}>จำนวน</div>
                      <div style={{ width:70, textAlign:"right" }}>ราคา/หน่วย</div>
                      <div style={{ width:72, textAlign:"right" }}>รวม</div>
                      <div style={{ width:24 }}></div>
                    </div>

                    {box.items.map((row) => (
                      <div key={row.rowId} className="box-item-row">
                        {/* Product selector */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <select className="box-select"
                            value={row.productId}
                            onChange={(e) => updateRow(box.id, row.rowId, "productId", e.target.value)}>
                            <option value="">-- เลือกสินค้า --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        {/* Qty */}
                        <div style={{ width:72, display:"flex", alignItems:"center", gap:2 }}>
                          <button className="qty-btn" style={{ width:22, height:28, fontSize:13 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Math.max(1, Number(row.qty)-1))}>−</button>
                          <input type="number" className="qty-input" style={{ width:34, fontSize:13 }}
                            value={row.qty} min="1"
                            onChange={(e) => updateRow(box.id, row.rowId, "qty", e.target.value)} />
                          <button className="qty-btn" style={{ width:22, height:28, fontSize:13 }}
                            onClick={() => updateRow(box.id, row.rowId, "qty", Number(row.qty)+1)}>+</button>
                        </div>
                        {/* Price */}
                        <div style={{ width:70 }}>
                          <input type="number" className="price-input" style={{ width:"100%", fontSize:12, padding:"5px 6px" }}
                            value={row.price}
                            onChange={(e) => updateRow(box.id, row.rowId, "price", e.target.value)} />
                        </div>
                        {/* Row total */}
                        <div style={{ width:72, textAlign:"right", fontSize:12, fontWeight:700, color:"var(--primary)" }}>
                          {row.productId
                            ? `฿${(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}`
                            : "-"}
                        </div>
                        {/* Remove */}
                        <button className="cart-remove" onClick={() => removeRow(box.id, row.rowId)}>✕</button>
                      </div>
                    ))}

                    {/* Box subtotal */}
                    {box.items.some((r) => r.productId) && (
                      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:8, marginTop:4, borderTop:"1px dashed var(--gray-200)", fontSize:12, fontWeight:600, color:"var(--gray-500)" }}>
                        ยอดกล่องนี้ ฿{box.items.reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add box button */}
          <button className="add-box-btn" onClick={addBox}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            เพิ่มกล่องที่ {boxes.length + 1}
          </button>

          {/* Summary card */}
          <div className="card">
            {/* Shipping */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--gray-600)", marginBottom:8 }}>ค่าจัดส่ง ({numBoxes} กล่อง)</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { value:"free",    label:"ส่งฟรี",           sub:"ไม่มีค่าส่ง" },
                  { value:"per_box", label:"ตามจำนวนกล่อง",   sub: shippingRateLabel(numBoxes) },
                  { value:"custom",  label:"กำหนดค่าส่งเอง",  sub:"ระบุจำนวนเอง" },
                ].map((opt) => (
                  <label key={opt.value} className={`shipping-option ${form.shippingType===opt.value?"selected":""}`}>
                    <input type="radio" name="shipping" value={opt.value}
                      checked={form.shippingType === opt.value}
                      onChange={() => setForm({ ...form, shippingType: opt.value })} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{opt.label}</div>
                      <div style={{ fontSize:11, color: opt.value==="per_box" && numBoxes>=10 ? "var(--success)" : "var(--gray-400)" }}>{opt.sub}</div>
                    </div>
                    {opt.value === "free"    && <span style={{ fontWeight:700, color:"var(--success)", fontSize:12, flexShrink:0 }}>฿0</span>}
                    {opt.value === "per_box" && (
                      <span style={{ fontWeight:700, color: numBoxes>=10?"var(--success)":"var(--primary)", fontSize:12, flexShrink:0 }}>
                        {numBoxes>=10?"ฟรี":`฿${calcShippingPerBox(numBoxes).toLocaleString()}`}
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

              {/* Shipping tier reference */}
              {form.shippingType === "per_box" && (
                <div className="shipping-tier-table">
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--gray-400)", marginBottom:6 }}>อัตราค่าส่ง</div>
                  {[
                    ["1-2 กล่อง","150 บาท/กล่อง"],
                    ["3-4 กล่อง","120 บาท/กล่อง"],
                    ["5-9 กล่อง","100 บาท/กล่อง"],
                    ["10 กล่องขึ้นไป","ฟรี 🎉"],
                  ].map(([range, rate]) => {
                    const active = (range==="1-2 กล่อง" && numBoxes<=2)
                      || (range==="3-4 กล่อง" && numBoxes>=3 && numBoxes<=4)
                      || (range==="5-9 กล่อง" && numBoxes>=5 && numBoxes<=9)
                      || (range==="10 กล่องขึ้นไป" && numBoxes>=10);
                    return (
                      <div key={range} className={`tier-row ${active?"active":""}`}>
                        <span>{range}</span><span>{rate}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ paddingTop:14, borderTop:"1.5px dashed var(--gray-200)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--gray-500)", marginBottom:5 }}>
                <span>ยอดสินค้า ({numBoxes} กล่อง)</span>
                <span>฿{subtotal.toLocaleString()}</span>
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

            {/* Action buttons */}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              {form.customerId && (
                <button className="btn btn-secondary" style={{ padding:"9px 14px", flexShrink:0 }} onClick={() => setShowSlip(true)}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
                  </svg>
                  ใบส่งของ
                </button>
              )}
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center" }}
                onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner"/> : "💾 บันทึกการขาย"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ Delivery Slip Modal ════ */}
      {showSlip && (
        <div className="modal-overlay" onClick={() => setShowSlip(false)}>
          <div className="modal" style={{ maxWidth:780 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ใบส่งของ</h3>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z" clipRule="evenodd"/>
                  </svg>
                  พิมพ์ / บันทึก PDF
                </button>
                <button className="btn-icon btn-secondary" onClick={() => setShowSlip(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding:"4px 24px 24px", maxHeight:"80vh", overflowY:"auto" }}>
              <div ref={printRef}>
                {/* ── Slip content ── */}
                <div style={{ fontFamily:"'Sarabun',sans-serif" }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2.5px solid #1a56db", paddingBottom:18, marginBottom:22 }}>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:"#1a56db" }}>{SELLER.name}</div>
                      <div style={{ fontSize:12, color:"#475569", marginTop:5, lineHeight:1.9 }}>
                        {SELLER.address}<br/>โทร: {SELLER.phone}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:700, color:"#0f172a" }}>ใบส่งของ</div>
                      <div style={{ fontSize:12, color:"#94a3b8", marginTop:4, lineHeight:1.8 }}>
                        วันที่: {today}<br/>ผู้ขาย: {user?.username}
                      </div>
                    </div>
                  </div>

                  {/* Delivery address */}
                  {selectedCustomer && (
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>ที่อยู่ในการจัดส่งสินค้า</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 16px", fontSize:13, lineHeight:1.9, color:"#334155" }}>
                        <strong>{selectedCustomer.name}</strong>
                        {selectedCustomer.phone   && <><br/>โทร: {selectedCustomer.phone}</>}
                        {selectedCustomer.address && <><br/>{selectedCustomer.address}</>}
                      </div>
                    </div>
                  )}

                  {/* Boxes */}
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:10 }}>รายการสินค้า ({numBoxes} กล่อง)</div>
                    {boxes.map((box, bIdx) => (
                      <div key={box.id} style={{ marginBottom:16 }}>
                        <div style={{ background:"#1a56db", color:"white", padding:"7px 14px", borderRadius:"6px 6px 0 0", fontWeight:700, fontSize:13 }}>
                          📦 กล่องที่ {bIdx+1}
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                          <thead>
                            <tr>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"left", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>สินค้า</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>ราคา/หน่วย</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>จำนวน</th>
                              <th style={{ background:"#f1f5f9", padding:"8px 12px", textAlign:"right", fontWeight:600, color:"#475569", borderBottom:"1px solid #e2e8f0" }}>รวม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {box.items.filter((r) => r.productId).map((row, i) => (
                              <tr key={row.rowId}>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9" }}>
                                  {row.productName}{row.unit?` (${row.unit})`:""}
                                </td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{Number(row.price||0).toLocaleString()}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>{row.qty}</td>
                                <td style={{ padding:"8px 12px", borderBottom:"1px solid #f1f5f9", textAlign:"right" }}>฿{(Number(row.price||0)*Number(row.qty||0)).toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3} style={{ padding:"7px 12px", textAlign:"right", color:"#475569", fontSize:12, background:"#f8fafc" }}>ยอดกล่องที่ {bIdx+1}</td>
                              <td style={{ padding:"7px 12px", textAlign:"right", fontWeight:700, background:"#f8fafc" }}>
                                ฿{box.items.reduce((s,r)=>s+(Number(r.price||0)*Number(r.qty||0)),0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>

                  {/* Grand total table */}
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:18 }}>
                    <tbody>
                      <tr>
                        <td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ยอดสินค้ารวมทุกกล่อง</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:120 }}>฿{subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"9px 12px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ค่าส่ง ({slipShippingLabel[form.shippingType]})</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", borderBottom:"1px solid #f1f5f9" }}>
                          {shippingCost===0?"ฟรี":`฿${shippingCost.toLocaleString()}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>ยอดรวมทั้งหมด</td>
                        <td style={{ padding:"12px", textAlign:"right", fontWeight:800, fontSize:16, color:"#1a56db", background:"#eff6ff" }}>฿{grandTotal.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Note + Bank */}
                  {form.note && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>หมายเหตุ</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155" }}>{form.note}</div>
                    </div>
                  )}
                  {selectedBank && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>ข้อมูลการชำระเงิน</div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", fontSize:13, color:"#334155", lineHeight:1.9 }}>
                        <strong>{selectedBank.name}</strong><br/>
                        เลขบัญชี: {selectedBank.accountNo}
                        {selectedBank.accountName && <><br/>ชื่อบัญชี: {selectedBank.accountName}</>}
                        {selectedBank.branch && <><br/>สาขา: {selectedBank.branch}</>}
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
