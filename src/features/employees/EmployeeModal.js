import Modal from "../../components/ui/Modal";
import React, { useState } from "react";
export default function EmployeeModal({ mode, initial, onSave, onClose, empType }) {
  const [form, setForm] = useState(initial || { employeeType: empType || "monthly" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) {
      alert("กรุณากรอกชื่อพนักงาน");
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <Modal
      title={<>{mode === "add" ? "เพิ่มพนักงาน" : "แก้ไขพนักงาน"}</>}
      onClose={onClose}
      maxWidth={480}
      actions={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "บันทึก"}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label>
          ชื่อพนักงาน <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          type="text"
          placeholder="กรอกชื่อ-นามสกุล"
          value={form.name || ""}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>แผนก</label>
        <input
          type="text"
          placeholder="เช่น ผลิต, บรรจุ, ขนส่ง"
          value={form.department || ""}
          onChange={(e) => set("department", e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>ประเภทพนักงาน</label>
        <select
          value={form.employeeType || "monthly"}
          onChange={(e) => set("employeeType", e.target.value)}
        >
          <option value="monthly">พนักงานรายเดือน</option>
          <option value="daily">พนักงานรายวัน</option>
        </select>
      </div>

      {form.employeeType === "monthly" && (
        <div className="form-group">
          <label>เงินเดือน (บาท/เดือน)</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.monthlySalary || ""}
            onChange={(e) => set("monthlySalary", e.target.value)}
          />
        </div>
      )}

      {form.employeeType === "daily" && (
        <>
          <div className="form-group">
            <label>ค่าจ้าง (บาท/ชั่วโมง)</label>
            <input
              type="number"
              placeholder="0.00"
              value={form.dailyRate || ""}
              onChange={(e) => set("dailyRate", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!form.isPieceWorker}
                onChange={(e) => set("isPieceWorker", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
              />
              เป็นพนักงานกดแผ่นด้วย
            </label>
          </div>
          {form.isPieceWorker && (
            <div
              className="form-group"
              style={{
                marginLeft: 24,
                background: "var(--primary-50)",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid var(--primary-light)",
              }}
            >
              <label style={{ color: "var(--primary)" }}>ราคากดแผ่น (บาท/ชั่วโมง)</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.pieceRate || ""}
                onChange={(e) => set("pieceRate", e.target.value)}
                style={{ marginTop: 6 }}
              />
              <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 4 }}>
                ราคานี้แตกต่างจากค่าจ้างรายวันปกติ
              </div>
            </div>
          )}
        </>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>หมายเหตุ</label>
        <input
          type="text"
          placeholder="หมายเหตุ (ถ้ามี)"
          value={form.note || ""}
          onChange={(e) => set("note", e.target.value)}
        />
      </div>
    </Modal>
  );
}
