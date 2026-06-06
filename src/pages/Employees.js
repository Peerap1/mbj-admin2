// src/pages/Employees.js
import React, { useState, useEffect } from "react";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "../firebase/database";

// ─── Modal ──────────────────────────────────────────────────────
function EmployeeModal({ mode, initial, onSave, onClose, empType }) {
  const [form, setForm] = useState(initial || { employeeType: empType || "monthly" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) { alert("กรุณากรอกชื่อพนักงาน"); return; }
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch { alert("เกิดข้อผิดพลาด"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "add" ? "เพิ่มพนักงาน" : "แก้ไขพนักงาน"}</h3>
          <button className="btn-icon btn-secondary" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>ชื่อพนักงาน <span style={{ color:"var(--danger)" }}>*</span></label>
            <input type="text" placeholder="กรอกชื่อ-นามสกุล" value={form.name||""} onChange={(e)=>set("name",e.target.value)} />
          </div>
          <div className="form-group">
            <label>แผนก</label>
            <input type="text" placeholder="เช่น ผลิต, บรรจุ, ขนส่ง" value={form.department||""} onChange={(e)=>set("department",e.target.value)} />
          </div>
          <div className="form-group">
            <label>ประเภทพนักงาน</label>
            <select value={form.employeeType||"monthly"} onChange={(e)=>set("employeeType",e.target.value)}>
              <option value="monthly">พนักงานรายเดือน</option>
              <option value="daily">พนักงานรายวัน</option>
            </select>
          </div>

          {form.employeeType === "monthly" && (
            <div className="form-group">
              <label>เงินเดือน (บาท/เดือน)</label>
              <input type="number" placeholder="0.00" value={form.monthlySalary||""} onChange={(e)=>set("monthlySalary",e.target.value)} />
            </div>
          )}

          {form.employeeType === "daily" && (
            <>
              <div className="form-group">
                <label>ค่าจ้างรายวัน (บาท/วัน)</label>
                <input type="number" placeholder="0.00" value={form.dailyRate||""} onChange={(e)=>set("dailyRate",e.target.value)} />
              </div>
              <div className="form-group">
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!form.isPieceWorker}
                    onChange={(e)=>set("isPieceWorker", e.target.checked)}
                    style={{ width:16, height:16, accentColor:"var(--primary)" }} />
                  เป็นพนักงานกดแผ่นด้วย
                </label>
              </div>
              {form.isPieceWorker && (
                <div className="form-group" style={{ marginLeft:24, background:"var(--primary-50)", padding:"12px", borderRadius:8, border:"1px solid var(--primary-light)" }}>
                  <label style={{ color:"var(--primary)" }}>ราคากดแผ่น (บาท/ชั่วโมง)</label>
                  <input type="number" placeholder="0.00" value={form.pieceRate||""} onChange={(e)=>set("pieceRate",e.target.value)}
                    style={{ marginTop:6 }} />
                  <div style={{ fontSize:11, color:"var(--gray-400)", marginTop:4 }}>
                    ราคานี้แตกต่างจากค่าจ้างรายวันปกติ
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group" style={{ marginBottom:0 }}>
            <label>หมายเหตุ</label>
            <input type="text" placeholder="หมายเหตุ (ถ้ามี)" value={form.note||""} onChange={(e)=>set("note",e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width:16, height:16 }}/> : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ──────────────────────────────────────────────
function DeleteConfirm({ emp, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:360 }} onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header"><h3>ยืนยันการลบ</h3></div>
        <div className="modal-body" style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
          <p>ต้องการลบ <strong>{emp.name}</strong>?</p>
          <p style={{ fontSize:12, color:"var(--danger)", marginTop:8 }}>การกระทำนี้ไม่สามารถยกเลิกได้</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-danger" disabled={loading} onClick={async()=>{
            setLoading(true);
            try { await onConfirm(emp.id); onClose(); } catch { alert("เกิดข้อผิดพลาด"); }
            setLoading(false);
          }}>
            {loading ? <span className="spinner" style={{ width:16, height:16 }}/> : "ลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Employee table ──────────────────────────────────────────────
function EmpTable({ employees, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="search-bar" style={{ marginBottom:14 }}>
        <input type="text" placeholder="🔍 ค้นหาชื่อ, แผนก..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ maxWidth:280 }} />
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width:36 }}>#</th>
              <th>ชื่อพนักงาน</th>
              <th>แผนก</th>
              <th>ค่าจ้าง</th>
              <th>หมายเหตุ</th>
              <th style={{ textAlign:"right" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:"center", padding:36, color:"var(--gray-400)", maxWidth:"none" }}>ไม่พบข้อมูล</td></tr>
            ) : filtered.map((e, i) => (
              <tr key={e.id}>
                <td style={{ color:"var(--gray-400)", fontSize:12, maxWidth:"none" }}>{i+1}</td>
                <td title={e.name} style={{ fontWeight:600 }}>
                  {e.name}
                  {e.isPieceWorker && <span className="badge badge-warning" style={{ marginLeft:6, fontSize:10 }}>กดแผ่น</span>}
                </td>
                <td title={e.department}>{e.department||"-"}</td>
                <td style={{ maxWidth:"none" }}>
                  {e.employeeType === "monthly" && e.monthlySalary && (
                    <div style={{ fontSize:13 }}>
                      <span style={{ color:"var(--gray-400)", fontSize:11 }}>เดือนละ </span>
                      <strong style={{ color:"var(--primary)" }}>฿{Number(e.monthlySalary).toLocaleString()}</strong>
                    </div>
                  )}
                  {e.employeeType === "daily" && (
                    <div style={{ fontSize:13, lineHeight:1.7 }}>
                      {e.dailyRate && <div><span style={{ color:"var(--gray-400)", fontSize:11 }}>รายวัน </span><strong style={{ color:"var(--success)" }}>฿{Number(e.dailyRate).toLocaleString()}</strong></div>}
                      {e.isPieceWorker && e.pieceRate && <div><span style={{ color:"var(--gray-400)", fontSize:11 }}>กดแผ่น </span><strong style={{ color:"var(--warning)" }}>฿{Number(e.pieceRate).toLocaleString()}/ชม.</strong></div>}
                    </div>
                  )}
                </td>
                <td title={e.note}>{e.note||"-"}</td>
                <td style={{ maxWidth:"none" }}>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button className="btn btn-secondary btn-sm" onClick={()=>onEdit(e)}>แก้ไข</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>onDelete(e)}>ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main page ──────────────────────────────────────────────────
export default function Employees() {
  const [employees,     setEmployees]     = useState([]);
  const [tab,           setTab]           = useState("monthly");
  const [modal,         setModal]         = useState(null);  // null | { mode, emp? }
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  useEffect(() => {
    const unsub = getEmployees(setEmployees);
    return unsub;
  }, []);

  const monthly     = employees.filter((e) => e.employeeType === "monthly");
  const daily       = employees.filter((e) => e.employeeType === "daily" && !e.isPieceWorker);
  const piece       = employees.filter((e) => e.employeeType === "daily" && e.isPieceWorker);

  const tabDef = [
    { key:"monthly", label:"รายเดือน",  count:monthly.length,  color:"var(--primary)",  data:monthly },
    { key:"daily",   label:"รายวัน",    count:daily.length,    color:"var(--success)",  data:daily   },
    { key:"piece",   label:"กดแผ่น",    count:piece.length,    color:"#d97706",         data:piece   },
  ];

  const currentTab   = tabDef.find((t) => t.key === tab);
  const tabEmpType   = tab === "monthly" ? "monthly" : "daily";
  const tabIsPiece   = tab === "piece";

  const openAdd = () => setModal({ mode:"add" });
  const openEdit = (emp) => setModal({ mode:"edit", emp });

  const handleSave = async (formData) => {
    // When adding from "piece" tab, force isPieceWorker
    const data = tab === "piece" ? { ...formData, employeeType:"daily", isPieceWorker:true } : formData;
    if (modal.mode === "add") await addEmployee(data);
    else await updateEmployee(modal.emp.id, data);
  };

  const getInitial = () => {
    if (modal?.mode === "edit") return modal.emp;
    return { employeeType: tabEmpType, isPieceWorker: tabIsPiece };
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">พนักงาน</h2>
          <p className="page-subtitle">จัดการข้อมูลพนักงานทั้งหมด {employees.length} คน</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          เพิ่มพนักงาน
        </button>
      </div>

      {/* Tabs */}
      <div className="emp-tabs">
        {tabDef.map((t) => (
          <button key={t.key}
            className={`emp-tab ${tab === t.key ? "active" : ""}`}
            style={{ "--tab-color": t.color }}
            onClick={() => setTab(t.key)}>
            <span className="emp-tab-label">{t.label}</span>
            <span className="emp-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop:0 }}>
        <EmpTable
          employees={currentTab.data}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      {modal && (
        <EmployeeModal
          mode={modal.mode}
          initial={getInitial()}
          empType={tabEmpType}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          emp={deleteTarget}
          onConfirm={deleteEmployee}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
