import Modal from "../../components/ui/Modal";
import React, { useState } from "react";
export default function PaymentModal({ sale, banks, onConfirm, onClose }) {
  const [method, setMethod] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (method === "bank" && !bankId) {
      alert("กรุณาเลือกธนาคาร");
      return;
    }
    setSaving(true);
    const bank = banks.find((b) => b.id === bankId);
    await onConfirm(sale.id, {
      method,
      bankId: method === "bank" ? bankId : null,
      bankName: method === "bank" ? `${bank?.name} ${bank?.accountNo}` : null,
      note,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      title={<>บันทึกการชำระเงิน</>}
      onClose={onClose}
      maxWidth={400}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              "✓ บันทึกการชำระ"
            )}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 14 }}>
        ลูกค้า: <strong>{sale.customerName}</strong> · ยอด{" "}
        <strong style={{ color: "var(--primary)" }}>
          {Number(sale.total || 0).toLocaleString()}
        </strong>
      </div>
      <div className="form-group">
        <label>ช่องทางชำระเงิน</label>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            ["cash", "เงินสด"],
            ["bank", "โอนธนาคาร"],
          ].map(([v, l]) => (
            <label
              key={v}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                border: `1.5px solid ${method === v ? "var(--primary)" : "var(--gray-200)"}`,
                borderRadius: 8,
                cursor: "pointer",
                flex: 1,
                justifyContent: "center",
                background: method === v ? "var(--primary-50)" : "white",
              }}
            >
              <input
                type="radio"
                name="paymethod"
                value={v}
                checked={method === v}
                onChange={() => setMethod(v)}
                style={{ accentColor: "var(--primary)", width: 15, height: 15, margin: 0 }}
              />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{l}</span>
            </label>
          ))}
        </div>
      </div>
      {method === "bank" && (
        <div className="form-group">
          <label>เลือกธนาคาร</label>
          <select value={bankId} onChange={(e) => setBankId(e.target.value)}>
            <option value="">-- เลือกธนาคาร --</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} – {b.accountNo}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>หมายเหตุ</label>
        <input
          type="text"
          placeholder="หมายเหตุ (ถ้ามี)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}
