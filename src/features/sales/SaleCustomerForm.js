import React from "react";
import CustomerSearch from "./CustomerSearch";
export default function SaleCustomerForm({ customers, form, setForm, selectedCustomer }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: "var(--text-body)", marginBottom: 16, color: "var(--text-primary)" }}>
        ข้อมูลการขาย
      </h3>
      <div style={{ marginBottom: 14 }}>
        <div className="form-group">
          <label>
            ลูกค้า <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <CustomerSearch
            customers={customers}
            value={form.customerId}
            onChange={(id) => setForm({ ...form, customerId: id })}
          />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label htmlFor="sale-date">
          วันที่ขาย <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          id="sale-date"
          style={{ width: "auto" }}
          type="date"
          required
          value={form.saleDate}
          onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
        />
      </div>
      {/* Fixed-height address box - always reserves space to prevent layout jump */}
      <div
        style={{
          minHeight: 72,
          marginBottom: 14,
          borderRadius: 8,
          overflow: "hidden",
          background: selectedCustomer?.address ? "var(--gray-50)" : "transparent",
          border: selectedCustomer?.address ? "1px solid var(--gray-200)" : "1px solid transparent",
          padding: selectedCustomer?.address ? "10px 14px" : "0 14px",
          transition: "all 0.15s ease",
          fontSize: "var(--text-small)",
        }}
      >
        {selectedCustomer?.address ? (
          <>
            <div
              style={{
                fontSize: "var(--text-caption)",
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              📦 ที่อยู่จัดส่ง
            </div>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedCustomer.name}
            </div>
            {selectedCustomer.phone && (
              <div
                style={{
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedCustomer.phone}
              </div>
            )}
            {selectedCustomer.address && (
              <div
                style={{
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedCustomer.address}
              </div>
            )}
            {selectedCustomer.province && <div>{selectedCustomer.province}</div>}
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              color: "var(--text-muted)",
              fontSize: "var(--text-caption)",
            }}
          >
            เลือกลูกค้าเพื่อแสดงที่อยู่จัดส่ง
          </div>
        )}
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>หมายเหตุ</label>
        <input
          type="text"
          placeholder="หมายเหตุ (ถ้ามี)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
    </div>
  );
}
