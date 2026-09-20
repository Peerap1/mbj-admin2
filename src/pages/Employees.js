import useCollection from "../hooks/useCollection";
import EmployeeModal from "../features/employees/EmployeeModal";
import DeleteConfirm from "../features/employees/DeleteConfirm";
import EmpTable from "../features/employees/EmployeeTable";
// src/pages/Employees.js
import React, { useState } from "react";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "../firebase/database";

// ─── Modal ──────────────────────────────────────────────────────

// ─── Delete confirm ──────────────────────────────────────────────

// ─── Employee table ──────────────────────────────────────────────

// ─── Main page ──────────────────────────────────────────────────
export default function Employees() {
  const {
    data: employees,
    loading: employeesLoading,
    error: employeesError,
  } = useCollection(getEmployees);
  const [tab, setTab] = useState("daily");
  const [modal, setModal] = useState(null); // null | { mode, emp? }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthly = employees.filter((e) => e.employeeType === "monthly");
  const daily = employees.filter((e) => e.employeeType === "daily" && !e.isPieceWorker);
  const piece = employees.filter((e) => e.employeeType === "daily" && e.isPieceWorker);

  const tabDef = [
    { key: "daily", label: "รายวัน", count: daily.length, color: "var(--success)", data: daily },
    { key: "piece", label: "กดแผ่น", count: piece.length, color: "#d97706", data: piece },
    {
      key: "monthly",
      label: "รายเดือน",
      count: monthly.length,
      color: "var(--primary)",
      data: monthly,
    },
  ];

  const currentTab = tabDef.find((t) => t.key === tab);
  const tabEmpType = tab === "monthly" ? "monthly" : "daily";
  const tabIsPiece = tab === "piece";

  const openAdd = () => setModal({ mode: "add" });
  const openEdit = (emp) => setModal({ mode: "edit", emp });

  const handleSave = async (formData) => {
    // The form determines the category; the open tab only supplies defaults.
    // Keep wage fields intact so payroll continues to use the existing rates.
    const data = {
      ...formData,
      isPieceWorker: formData.employeeType === "daily" && !!formData.isPieceWorker,
    };
    if (modal.mode === "add") await addEmployee(data);
    else await updateEmployee(modal.emp.id, data);
    setTab(data.employeeType === "monthly" ? "monthly" : data.isPieceWorker ? "piece" : "daily");
  };

  const getInitial = () => {
    if (modal?.mode === "edit") return modal.emp;
    return { employeeType: tabEmpType, isPieceWorker: tabIsPiece };
  };

  const dataError = employeesError;
  if (dataError) return <p className="analysis-error">{dataError}</p>;
  if (employeesLoading) return <p>กำลังโหลดข้อมูล…</p>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">พนักงาน</h2>
          <p className="page-subtitle">จัดการข้อมูลพนักงานทั้งหมด {employees.length} คน</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          เพิ่มพนักงาน
        </button>
      </div>

      {/* Tabs */}
      <div className="emp-tabs">
        {tabDef.map((t) => (
          <button
            key={t.key}
            className={`emp-tab ${tab === t.key ? "active" : ""}`}
            style={{ "--tab-color": t.color }}
            onClick={() => setTab(t.key)}
          >
            <span className="emp-tab-label">{t.label}</span>
            <span className="emp-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <EmpTable employees={currentTab.data} onEdit={openEdit} onDelete={setDeleteTarget} />
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
