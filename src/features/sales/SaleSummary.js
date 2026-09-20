import React from "react";
import { calcShippingPerBox, shippingRateLabel } from "./sales";
export default function SaleSummary({
  form,
  setForm,
  numBoxes,
  shippingCost,
  subtotal,
  grandTotal,
  handleSubmit,
  loading,
}) {
  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-600)", marginBottom: 8 }}>
          ค่าจัดส่ง ({numBoxes} รายการ) <span style={{ color: "var(--danger)" }}>*</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { value: "free", label: "ส่งฟรี", sub: "ไม่มีค่าส่ง", price: "0" },
            {
              value: "per_box",
              label: "ตามจำนวนกล่อง",
              sub: shippingRateLabel(numBoxes),
              price: numBoxes >= 10 ? "0" : `${calcShippingPerBox(numBoxes).toLocaleString()}`,
            },
            { value: "custom", label: "กำหนดค่าส่งเอง", sub: "ระบุจำนวนเอง", price: null },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`shipping-option ${form.shippingType === opt.value ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="shipping"
                value={opt.value}
                checked={form.shippingType === opt.value}
                onChange={() => setForm({ ...form, shippingType: opt.value })}
              />
              <span className="shipping-label">{opt.label}</span>
              <span className="shipping-sub">{opt.sub}</span>
              {opt.price && (
                <span
                  className="shipping-price"
                  style={{
                    color:
                      opt.value === "free" || (opt.value === "per_box" && numBoxes >= 10)
                        ? "var(--success)"
                        : "var(--primary)",
                  }}
                >
                  {opt.price}
                </span>
              )}
            </label>
          ))}
        </div>
        {form.shippingType === "custom" && (
          <input
            type="number"
            placeholder="ระบุค่าส่ง (บาท)"
            value={form.shippingCustom}
            onChange={(e) => setForm({ ...form, shippingCustom: e.target.value })}
            style={{ marginTop: 8 }}
          />
        )}
        {form.shippingType === "per_box" && (
          <div className="shipping-tier-table">
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--gray-400)",
                marginBottom: 5,
              }}
            >
              อัตราค่าส่ง
            </div>
            {[
              ["1-2", "150"],
              ["3-4", "120"],
              ["5-9", "100"],
              ["10+", "ฟรี"],
            ].map(([range, rate]) => {
              const active =
                (range === "1-2" && numBoxes <= 2) ||
                (range === "3-4" && numBoxes >= 3 && numBoxes <= 4) ||
                (range === "5-9" && numBoxes >= 5 && numBoxes <= 9) ||
                (range === "10+" && numBoxes >= 10);
              return (
                <div key={range} className={`tier-row ${active ? "active" : ""}`}>
                  <span>{range} กล่อง</span>
                  <span>{rate === "ฟรี" ? "ฟรี 🎉" : `${rate} บาท/กล่อง`}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 14, borderTop: "1.5px dashed var(--gray-200)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--gray-500)",
            marginBottom: 5,
          }}
        >
          <span>ยอดสินค้า ({numBoxes} รายการ)</span>
          <span>{subtotal.toLocaleString()}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--gray-500)",
            marginBottom: 10,
          }}
        >
          <span>ค่าส่ง</span>
          <span
            style={{
              color: shippingCost === 0 ? "var(--success)" : "inherit",
              fontWeight: shippingCost === 0 ? 600 : 400,
            }}
          >
            {shippingCost.toLocaleString()}
          </span>
        </div>
        <div className="cart-total">
          <span>ยอดรวมทั้งหมด</span>
          <span className="total-amount">{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <span className="spinner" /> : "💾 บันทึกการขาย"}
      </button>
    </div>
  );
}
