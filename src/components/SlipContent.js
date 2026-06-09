// src/components/SlipContent.js
// Shared delivery slip — used by both Sales.js and History.js
import React from "react";

const SELLER = {
  name:    "ข้าวแต๋นน้ำแตงโมแม่บัวจันทร์",
  address: "5 หมู่ 2 ตำบลบ้านเป้า อำเภอเมือง จังหวัดลำปาง 52100",
  phone:   "099-916-6264",
};

// ─── Shared items table ──────────────────────────────────────────
export function SlipItemsTable({ boxes }) {
  return (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:14 }}>
      <thead>
        <tr>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"center", fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:36 }}>รายการ</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"left",   fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0" }}>รายละเอียด</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:62 }}>จำนวน</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:90 }}>ราคา/หน่วย</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:55 }}>กล่อง</th>
          <th style={{ background:"#f1f5f9", padding:"6px 8px", textAlign:"right",  fontWeight:700, color:"#475569", borderBottom:"2px solid #e2e8f0", width:90 }}>จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        {(boxes||[]).flatMap((box, bIdx) => {
          const bQty = Number(box.boxQty)||1;
          const rows = (box.items||[]).filter(r => r.productId);
          return rows.map((row, rIdx) => (
            <tr key={`${bIdx}-${rIdx}`}>
              {rIdx === 0 && (
                <td rowSpan={rows.length} style={{ padding:"5px 8px", textAlign:"center", verticalAlign:"middle", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" }}>
                  {bIdx+1}
                </td>
              )}
              <td style={{ padding:"4px 8px", borderBottom: rIdx===rows.length-1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9" }}>{row.productName}</td>
              <td style={{ padding:"4px 8px", textAlign:"right", borderBottom: rIdx===rows.length-1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9" }}>{row.qty}</td>
              <td style={{ padding:"4px 8px", textAlign:"right", borderBottom: rIdx===rows.length-1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9" }}>{Number(row.price||0).toLocaleString()}</td>
              {rIdx === 0 && (
                <td rowSpan={rows.length} style={{ padding:"5px 8px", textAlign:"center", verticalAlign:"middle", borderBottom:"2px solid #e2e8f0", background:"#f8fafc" }}>
                  {bQty}
                </td>
              )}
              <td style={{ padding:"4px 8px", textAlign:"right", fontWeight:600, color:"#1a56db", borderBottom: rIdx===rows.length-1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9" }}>
                {(Number(row.price||0) * Number(row.qty||0) * bQty).toLocaleString()}
              </td>
            </tr>
          ));
        })}
      </tbody>
    </table>
  );
}

// ─── Full slip body (screen preview) ────────────────────────────
export function SlipContent({ sale, createdBy }) {
  if (!sale) return null;
  const isReceipt = sale.status === "paid";
  const dateStr = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });

  return (
    <div style={{ fontFamily:"'Sarabun',sans-serif" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"2px solid #1a56db", paddingBottom:10, marginBottom:14 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:"#1a56db" }}>{SELLER.name}</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:4, lineHeight:1.7 }}>
            {SELLER.address}<br/>โทร: {SELLER.phone}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#0f172a" }}>{isReceipt ? "ใบเสร็จ" : "ใบส่งของ"}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3, lineHeight:1.7 }}>
            วันที่: {dateStr}<br/>
            ผู้ขาย: {createdBy || sale.createdBy || "-"}
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {(sale.customerName || sale.customerAddress) && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>ที่อยู่ในการจัดส่งสินค้า</div>
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"8px 12px", fontSize:12, lineHeight:1.7, color:"#334155" }}>
            <strong>{sale.customerName}</strong>
            {sale.customerPhone   && <><br/>โทร: {sale.customerPhone}</>}
            {sale.customerAddress && <><br/>{sale.customerAddress}</>}
          </div>
        </div>
      )}

      {/* Payment info — screen only */}
      {sale.payment && (
        <div className="no-print" style={{ marginBottom:14, background:"#d1fae5", border:"1px solid #6ee7b7", borderRadius:6, padding:"8px 12px", fontSize:12 }}>
          <strong>ชำระโดย:</strong> {sale.payment.method === "cash" ? "เงินสด" : `โอน ${sale.payment.bankName}`}
          {sale.paidAt && ` · ${new Date(sale.paidAt).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}`}
        </div>
      )}

      {/* Items table */}
      <SlipItemsTable boxes={sale.boxes||[]} />

      {/* Totals */}
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginBottom:14 }}>
        <tbody>
          <tr>
            <td colSpan={5} style={{ padding:"6px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>กล่องรวม</td>
            <td style={{ padding:"6px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:110 }}>
              {(sale.boxes||[]).reduce((s,b)=>s+(Number(b.boxQty)||1),0)} กล่อง
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding:"6px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ยอดสินค้ารวม</td>
            <td style={{ padding:"6px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9", width:110 }}>{Number(sale.subtotal||0).toLocaleString()}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding:"6px 10px", textAlign:"right", color:"#475569", borderBottom:"1px solid #f1f5f9" }}>ค่าส่ง</td>
            <td style={{ padding:"6px 10px", textAlign:"right", borderBottom:"1px solid #f1f5f9" }}>
              {Number(sale.shippingCost||0).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding:"9px 10px", textAlign:"right", fontWeight:800, fontSize:15, color:"#1a56db", background:"#eff6ff" }}>ยอดรวมทั้งหมด</td>
            <td style={{ padding:"9px 10px", textAlign:"right", fontWeight:800, fontSize:15, color:"#1a56db", background:"#eff6ff" }}>{Number(sale.total||0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {sale.note && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>หมายเหตุ</div>
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"8px 12px", fontSize:12, color:"#334155" }}>{sale.note}</div>
        </div>
      )}

      <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"#cbd5e1", paddingTop:10, borderTop:"1px dashed #e2e8f0" }}>
        ขอบคุณที่ใช้บริการ — {SELLER.name} โทร {SELLER.phone}
      </div>
    </div>
  );
}

// ─── Shared print function ───────────────────────────────────────
export function buildPrintHTML(sale, createdBy) {
  const isReceipt = sale?.status === "paid";
  const dateStr = sale?.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });

  const itemRows = (sale?.boxes||[]).flatMap((box, bIdx) => {
    const bQty = Number(box.boxQty)||1;
    const rows = (box.items||[]).filter(r => r.productId);
    return rows.map((row, rIdx) => {
      const isLast = rIdx === rows.length - 1;
      const border = isLast ? "2px solid #e2e8f0" : "1px solid #f5f5f5";
      const numCell = rIdx === 0
        ? `<td rowspan="${rows.length}" style="padding:5px 8px;text-align:center;vertical-align:middle;border-bottom:2px solid #e2e8f0;background:#f8fafc">${bIdx+1}</td>`
        : "";
      const boxCell = rIdx === 0
        ? `<td rowspan="${rows.length}" style="padding:5px 8px;text-align:center;vertical-align:middle;border-bottom:2px solid #e2e8f0;background:#f8fafc">${bQty}</td>`
        : "";
      const amount = Number(row.price||0) * Number(row.qty||0) * bQty;
      return `<tr>
        ${numCell}
        <td style="padding:4px 8px;border-bottom:${border}">${row.productName||""}</td>
        <td style="padding:4px 8px;text-align:right;border-bottom:${border}">${row.qty}</td>
        <td style="padding:4px 8px;text-align:right;border-bottom:${border}">${Number(row.price||0).toLocaleString()}</td>
        ${boxCell}
        <td style="padding:4px 8px;text-align:right;font-weight:600;color:#1a56db;border-bottom:${border}">${amount.toLocaleString()}</td>
      </tr>`;
    });
  }).join("");

  const addrHTML = (sale?.customerName || sale?.customerAddress) ? `
    <div class="sec-h">ที่อยู่ในการจัดส่งสินค้า</div>
    <div class="info-box">
      <strong>${sale.customerName||""}</strong>
      ${sale.customerPhone ? `<br>โทร: ${sale.customerPhone}` : ""}
      ${sale.customerAddress ? `<br>${sale.customerAddress}` : ""}
    </div>` : "";

  const noteHTML = sale?.note ? `
    <div class="sec-h">หมายเหตุ</div>
    <div class="info-box">${sale.note}</div>` : "";

  const shipping = `${Number(sale?.shippingCost||0).toLocaleString()}`;

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>${isReceipt?"ใบเสร็จ":"ใบส่งของ"}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;font-size:11px;color:#1e293b;padding:12px 16px;line-height:1.5}
.wrap{max-width:680px;margin:0 auto}
.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a56db;padding-bottom:10px;margin-bottom:14px}
.sname{font-size:14px;font-weight:700;color:#1a56db}.sinfo{font-size:10px;color:#475569;margin-top:3px;line-height:1.6}
.title{font-size:18px;font-weight:700;text-align:right;color:#0f172a}.meta{font-size:10px;color:#94a3b8;text-align:right;margin-top:3px;line-height:1.6}
.sec-h{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;margin-top:10px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:6px 10px;font-size:11px;line-height:1.6;color:#334155}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f1f5f9;padding:5px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1.5px solid #e2e8f0}
th.c{text-align:center}th.r{text-align:right}
td{padding:4px 8px;border-bottom:1px solid #f5f5f5}
.foot{margin-top:12px;text-align:center;font-size:9px;color:#cbd5e1;padding-top:7px;border-top:1px dashed #e2e8f0}
@media print{
  @page{margin:8mm 10mm;size:A4}
  body{padding:0}
  html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style></head><body><div class="wrap">
<div class="hd">
  <div><div class="sname">${SELLER.name}</div><div class="sinfo">${SELLER.address}<br>โทร: ${SELLER.phone}</div></div>
  <div><div class="title">${isReceipt?"ใบเสร็จ":"ใบส่งของ"}</div><div class="meta">วันที่: ${dateStr}<br>ผู้ขาย: ${createdBy||sale?.createdBy||"-"}</div></div>
</div>
${addrHTML}
<div style="height:10px"></div>
<table>
  <thead><tr>
    <th class="c" style="width:36px">รายการ</th>
    <th>รายละเอียด</th>
    <th class="r" style="width:60px">จำนวน</th>
    <th class="r" style="width:90px">ราคา/หน่วย</th>
    <th class="r" style="width:55px">กล่อง</th>
    <th class="r" style="width:90px">จำนวนเงิน</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
</table>
<table style="margin-top:6px">
  <tbody>
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">กล่องรวม</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5;width:110px">${(sale?.boxes||[]).reduce((s,b)=>s+(Number(b.boxQty)||1),0)} กล่อง</td></tr>
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">ยอดสินค้ารวม</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5;width:110px">${Number(sale?.subtotal||0).toLocaleString()}</td></tr>
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">ค่าส่ง</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5">${shipping}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:800;font-size:13px;color:#1a56db;background:#eff6ff;padding:7px 8px">ยอดรวมทั้งหมด</td><td style="text-align:right;font-weight:800;font-size:13px;color:#1a56db;background:#eff6ff;padding:7px 8px">${Number(sale?.total||0).toLocaleString()}</td></tr>
  </tbody>
</table>
${noteHTML}
<div class="foot">ขอบคุณที่ใช้บริการ — ${SELLER.name} โทร ${SELLER.phone}</div>
</div></body></html>`;
}

export const SELLER_INFO = SELLER;
