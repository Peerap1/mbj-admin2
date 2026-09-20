import { slipBoxes, slipGroups, slipBoxCount, SELLER } from "../features/sales/slipModel";
// src/components/SlipContent.js
// Shared delivery slip — used by both Sales.js and History.js
import React from "react";
export { buildPrintHTML } from "../features/sales/slipPrint";

// ─── Shared items table ──────────────────────────────────────────
export function SlipItemsTable({ boxes }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
      <thead>
        <tr>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "center",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
              width: 36,
            }}
          >
            รายการ
          </th>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "left",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            รายละเอียด
          </th>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "right",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
              width: 62,
            }}
          >
            จำนวน
          </th>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "right",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
              width: 90,
            }}
          >
            ราคา/หน่วย
          </th>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "right",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
              width: 55,
            }}
          >
            กล่อง
          </th>
          <th
            style={{
              background: "#f1f5f9",
              padding: "6px 8px",
              textAlign: "right",
              fontWeight: 700,
              color: "#475569",
              borderBottom: "2px solid #e2e8f0",
              width: 90,
            }}
          >
            จำนวนเงิน
          </th>
        </tr>
      </thead>
      <tbody>
        {slipGroups(boxes).flatMap(({ bIdx, bQty, rows }) => {
          return rows.map((row, rIdx) => (
            <tr key={`${bIdx}-${rIdx}`}>
              {rIdx === 0 && (
                <td
                  rowSpan={rows.length}
                  style={{
                    padding: "5px 8px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderBottom: "2px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  {bIdx + 1}
                </td>
              )}
              <td
                style={{
                  padding: "4px 8px",
                  borderBottom:
                    rIdx === rows.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9",
                }}
              >
                {row.productName}
              </td>
              <td
                style={{
                  padding: "4px 8px",
                  textAlign: "right",
                  borderBottom:
                    rIdx === rows.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9",
                }}
              >
                {row.qty}
              </td>
              <td
                style={{
                  padding: "4px 8px",
                  textAlign: "right",
                  borderBottom:
                    rIdx === rows.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9",
                }}
              >
                {Number(row.price || 0).toLocaleString()}
              </td>
              {rIdx === 0 && (
                <td
                  rowSpan={rows.length}
                  style={{
                    padding: "5px 8px",
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderBottom: "2px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  {bQty}
                </td>
              )}
              <td
                style={{
                  padding: "4px 8px",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#1a56db",
                  borderBottom:
                    rIdx === rows.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9",
                }}
              >
                {row.lineTotal.toLocaleString()}
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
  sale = { ...sale, boxes: slipBoxes(sale) };
  const isReceipt = sale.status === "paid";
  const dateStr = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #1a56db",
          paddingBottom: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a56db" }}>{SELLER.name}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4, lineHeight: 1.7 }}>
            {SELLER.address}
            <br />
            โทร: {SELLER.phone}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            {isReceipt ? "ใบเสร็จ" : "ใบส่งของ"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, lineHeight: 1.7 }}>
            วันที่: {dateStr}
            <br />
            Order: {sale.orderNo || sale.id || "–"}
            <br />
            ผู้ขาย: {createdBy || sale.createdBy || "-"}
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {(sale.customerName || sale.customerAddress) && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 6,
            }}
          >
            ที่อยู่ในการจัดส่งสินค้า
          </div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              lineHeight: 1.7,
              color: "#334155",
            }}
          >
            <strong>{sale.customerName}</strong>
            {sale.customerPhone && (
              <>
                <br />
                โทร: {sale.customerPhone}
              </>
            )}
            {sale.customerAddress && (
              <>
                <br />
                {sale.customerAddress}
              </>
            )}
            {sale.customerProvince && !sale.customerAddress?.includes(sale.customerProvince) && (
              <>
                <br />
                {sale.customerProvince}
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment info — screen only */}
      {sale.payment && (
        <div
          className="no-print"
          style={{
            marginBottom: 14,
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 12,
          }}
        >
          <strong>ชำระโดย:</strong>{" "}
          {sale.payment.method === "cash" ? "เงินสด" : `โอน ${sale.payment.bankName}`}
          {sale.paidAt &&
            ` · ${new Date(sale.paidAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
        </div>
      )}

      {/* Items table */}
      <SlipItemsTable boxes={sale.boxes || []} />

      {/* Totals */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
        <tbody>
          <tr>
            <td
              colSpan={5}
              style={{
                padding: "6px 10px",
                textAlign: "right",
                color: "#475569",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              กล่องรวม
            </td>
            <td
              style={{
                padding: "6px 10px",
                textAlign: "right",
                borderBottom: "1px solid #f1f5f9",
                width: 110,
              }}
            >
              {slipBoxCount(sale.boxes)} กล่อง
            </td>
          </tr>
          <tr>
            <td
              colSpan={5}
              style={{
                padding: "6px 10px",
                textAlign: "right",
                color: "#475569",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              ยอดสินค้ารวม
            </td>
            <td
              style={{
                padding: "6px 10px",
                textAlign: "right",
                borderBottom: "1px solid #f1f5f9",
                width: 110,
              }}
            >
              {Number(sale.subtotal || 0).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td
              colSpan={5}
              style={{
                padding: "6px 10px",
                textAlign: "right",
                color: "#475569",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              ค่าส่ง
            </td>
            <td
              style={{ padding: "6px 10px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}
            >
              {Number(sale.shippingCost || 0).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td
              colSpan={5}
              style={{
                padding: "9px 10px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 15,
                color: "#1a56db",
                background: "#eff6ff",
              }}
            >
              ยอดรวมทั้งหมด
            </td>
            <td
              style={{
                padding: "9px 10px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 15,
                color: "#1a56db",
                background: "#eff6ff",
              }}
            >
              {Number(sale.total || 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {sale.note && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 6,
            }}
          >
            หมายเหตุ
          </div>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              color: "#334155",
            }}
          >
            {sale.note}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 11,
          color: "#cbd5e1",
          paddingTop: 10,
          borderTop: "1px dashed #e2e8f0",
        }}
      >
        ขอบคุณที่ใช้บริการ — {SELLER.name} โทร {SELLER.phone}
      </div>
    </div>
  );
}

// ─── Shared print function ───────────────────────────────────────

export const SELLER_INFO = SELLER;
