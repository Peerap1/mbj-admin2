// src/pages/Employees.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "../firebase/database";

export default function Employees() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const unsub = getEmployees(setEmployees);
    return unsub;
  }, []);

  const typeOptions = [
    { value: "monthly", label: "พนักงานรายเดือน" },
    { value: "daily",   label: "พนักงานรายวัน" },
    { value: "piece",   label: "พนักงานรายวันกดแผ่น" },
  ];

  const typeLabel = { monthly:"รายเดือน", daily:"รายวัน", piece:"กดแผ่น" };
  const typeBadge = { monthly:"badge-primary", daily:"badge-success", piece:"badge-warning" };

  const columns = [
    { key: "name",  label: "ชื่อพนักงาน" },
    { key: "department", label: "แผนก" },
    {
      key: "employeeType", label: "ประเภท",
      render: (v) => (
        <span className={`badge ${typeBadge[v] || "badge-gray"}`}>
          {typeLabel[v] || v || "-"}
        </span>
      ),
    },
    {
      key: "hourlyRate", label: "ราคาต่อชั่วโมง",
      render: (v) => v ? <strong style={{ color:"var(--primary)" }}>฿{Number(v).toLocaleString()}</strong> : "-",
    },
  ];

  const fields = [
    { key: "name",         label: "ชื่อพนักงาน",          required: true,  placeholder: "กรอกชื่อพนักงาน" },
    { key: "department",   label: "แผนก",                 required: false, placeholder: "เช่น ผลิต, บรรจุ, ขนส่ง" },
    { key: "employeeType", label: "ประเภทพนักงาน",        required: true,  type: "select", options: typeOptions },
    { key: "hourlyRate",   label: "ราคาต่อชั่วโมง (บาท)", required: false, type: "number", placeholder: "0.00" },
    { key: "note",         label: "หมายเหตุ",              placeholder: "หมายเหตุ (ถ้ามี)" },
  ];

  return (
    <CrudPage
      title="พนักงาน"
      subtitle="จัดการข้อมูลพนักงาน"
      items={employees}
      columns={columns}
      fields={fields}
      onAdd={addEmployee}
      onEdit={updateEmployee}
      onDelete={deleteEmployee}
    />
  );
}
