import React from "react";
import CustomerSearch from "./CustomerSearch";
export default function SaleCustomerForm({ customers, form, setForm, selectedCustomer }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 15, marginBottom: 16, color: "var(--gray-800)" }}>ข้อมูลการขาย</h3>
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
          fontSize: 13,
        }}
      >
        {selectedCustomer?.address ? (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--gray-400)",
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
              title={selectedCustomer.name}
            >
              {selectedCustomer.name}
            </div>
            {selectedCustomer.phone && (
              <div
                style={{
                  color: "var(--gray-500)",
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
                  color: "var(--gray-600)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={selectedCustomer.address}
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
              color: "var(--gray-300)",
              fontSize: 12,
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
