// src/components/CrudPage.js
import React, { useState } from "react";

export default function CrudPage({ title, subtitle, items, columns, fields, onAdd, onEdit, onDelete, renderExtra }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { mode:"add"|"edit", data:{} }
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = items.filter((item) =>
    columns.some((col) =>
      String(item[col.key] || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd = () => {
    setForm({});
    setModal({ mode: "add" });
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setModal({ mode: "edit", data: item });
  };

  const handleSave = async () => {
    for (const f of fields) {
      if (f.required && !form[f.key]) {
        alert(`กรุณากรอก ${f.label}`);
        return;
      }
    }
    setLoading(true);
    try {
      if (modal.mode === "add") await onAdd(form);
      else await onEdit(modal.data.id, form);
      setModal(null);
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await onDelete(id);
      setDeleteConfirm(null);
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="page-subtitle">{subtitle} • {filtered.length} รายการ</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          เพิ่ม{title}
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input type="text" placeholder={`🔍 ค้นหา${title}...`} value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ maxWidth:300 }} />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                {renderExtra && <th>ข้อมูลเพิ่มเติม</th>}
                <th style={{ textAlign:"right" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.length + 3} style={{ textAlign:"center", padding:40, color:"var(--gray-400)" }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id}>
                  <td className="td-num" style={{ color:"var(--gray-400)", fontSize:12, maxWidth:"none" }}>{i + 1}</td>
                  {columns.map((c) => {
                    const raw = item[c.key];
                    const isRendered = !!c.render;
                    const textVal = !isRendered && raw ? String(raw) : null;
                    return (
                      <td key={c.key}
                        className={isRendered ? "td-badge" : ""}
                        title={textVal && textVal.length > 20 ? textVal : undefined}
                        style={isRendered ? { maxWidth:"none", overflow:"visible" } : {}}>
                        {isRendered ? c.render(raw, item) : raw || "-"}
                      </td>
                    );
                  })}
                  {renderExtra && <td className="td-badge" style={{ maxWidth:"none" }}>{renderExtra(item)}</td>}
                  <td className="td-action" style={{ maxWidth:"none" }}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button className="btn btn-secondary btn-sm btn-icon-only" title="แก้ไข" onClick={() => openEdit(item)}><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                      <button className="btn btn-danger btn-sm btn-icon-only" title="ลบ" onClick={() => setDeleteConfirm(item)}><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.mode === "add" ? `เพิ่ม${title}` : `แก้ไข${title}`}</h3>
              <button className="btn-icon btn-secondary" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {fields.map((f) => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}{f.required && <span style={{ color:"var(--danger)" }}> *</span>}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} placeholder={f.placeholder || ""} value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  ) : f.type === "select" ? (
                    <select value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">-- เลือก --</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || "text"} placeholder={f.placeholder || ""}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth:380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ยืนยันการลบ</h3>
            </div>
            <div className="modal-body" style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
              <p>คุณต้องการลบ <strong>{deleteConfirm[columns[0]?.key] || ""}</strong> ใช่ไหม?</p>
              <p style={{ fontSize:13, color:"var(--gray-400)", marginTop:6 }}>การกระทำนี้ไม่สามารถยกเลิกได้</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={loading}>
                {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
