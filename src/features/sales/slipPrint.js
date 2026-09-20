import {
  slipBoxes,
  slipGroups,
  slipBoxCount,
  escapeHTML,
  escapePrintData,
  SELLER,
} from "./slipModel";
export function buildPrintHTML(sale, createdBy) {
  sale = escapePrintData({ ...sale, boxes: slipBoxes(sale || {}) });
  createdBy = escapeHTML(createdBy);
  const isReceipt = sale?.status === "paid";
  const dateStr = sale?.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

  const itemRows = slipGroups(sale?.boxes)
    .flatMap(({ bIdx, bQty, rows }) => {
      return rows.map((row, rIdx) => {
        const isLast = rIdx === rows.length - 1;
        const border = isLast ? "2px solid #e2e8f0" : "1px solid #f5f5f5";
        const numCell =
          rIdx === 0
            ? `<td rowspan="${rows.length}" style="padding:5px 8px;text-align:center;vertical-align:middle;border-bottom:2px solid #e2e8f0;background:#f8fafc">${bIdx + 1}</td>`
            : "";
        const boxCell =
          rIdx === 0
            ? `<td rowspan="${rows.length}" style="padding:5px 8px;text-align:center;vertical-align:middle;border-bottom:2px solid #e2e8f0;background:#f8fafc">${bQty}</td>`
            : "";
        const amount = row.lineTotal;
        return `<tr>
        ${numCell}
        <td style="padding:4px 8px;border-bottom:${border}">${row.productName || ""}</td>
        <td style="padding:4px 8px;text-align:right;border-bottom:${border}">${row.qty}</td>
        <td style="padding:4px 8px;text-align:right;border-bottom:${border}">${Number(row.price || 0).toLocaleString()}</td>
        ${boxCell}
        <td style="padding:4px 8px;text-align:right;font-weight:600;color:#1a56db;border-bottom:${border}">${amount.toLocaleString()}</td>
      </tr>`;
      });
    })
    .join("");

  const addrHTML =
    sale?.customerName || sale?.customerAddress
      ? `
    <div class="sec-h">ที่อยู่ในการจัดส่งสินค้า</div>
    <div class="info-box">
      <strong>${sale.customerName || ""}</strong>
      ${sale.customerPhone ? `<br>โทร: ${sale.customerPhone}` : ""}
      ${sale.customerAddress ? `<br>${sale.customerAddress}` : ""}
      ${sale.customerProvince && !sale.customerAddress?.includes(sale.customerProvince) ? `<br>${sale.customerProvince}` : ""}
    </div>`
      : "";

  const noteHTML = sale?.note
    ? `
    <div class="sec-h">หมายเหตุ</div>
    <div class="info-box">${sale.note}</div>`
    : "";

  const shipping = `${Number(sale?.shippingCost || 0).toLocaleString()}`;

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/><title>${isReceipt ? "ใบเสร็จ" : "ใบส่งของ"}</title>
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
  <div><div class="title">${isReceipt ? "ใบเสร็จ" : "ใบส่งของ"}</div><div class="meta">วันที่: ${dateStr}<br>Order: ${sale.orderNo || sale.id || "–"}<br>ผู้ขาย: ${createdBy || sale?.createdBy || "-"}</div></div>
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
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">กล่องรวม</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5;width:110px">${slipBoxCount(sale?.boxes)} กล่อง</td></tr>
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">ยอดสินค้ารวม</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5;width:110px">${Number(sale?.subtotal || 0).toLocaleString()}</td></tr>
    <tr><td colspan="5" style="text-align:right;color:#475569;padding:5px 8px;border-bottom:1px solid #f5f5f5">ค่าส่ง</td><td style="text-align:right;padding:5px 8px;border-bottom:1px solid #f5f5f5">${shipping}</td></tr>
    <tr><td colspan="5" style="text-align:right;font-weight:800;font-size:13px;color:#1a56db;background:#eff6ff;padding:7px 8px">ยอดรวมทั้งหมด</td><td style="text-align:right;font-weight:800;font-size:13px;color:#1a56db;background:#eff6ff;padding:7px 8px">${Number(sale?.total || 0).toLocaleString()}</td></tr>
  </tbody>
</table>
${noteHTML}
<div class="foot">ขอบคุณที่ใช้บริการ — ${SELLER.name} โทร ${SELLER.phone}</div>
</div></body></html>`;
}
