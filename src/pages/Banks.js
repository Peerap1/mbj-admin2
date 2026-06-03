// src/pages/Banks.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { getBanks, addBank, updateBank, deleteBank } from "../firebase/database";

export default function Banks() {
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    const unsub = getBanks(setBanks);
    return unsub;
  }, []);

  const bankOptions = [
    { value: "ธนาคารกสิกรไทย", label: "ธนาคารกสิกรไทย (KBANK)" },
    { value: "ธนาคารไทยพาณิชย์", label: "ธนาคารไทยพาณิชย์ (SCB)" },
    { value: "ธนาคารกรุงเทพ", label: "ธนาคารกรุงเทพ (BBL)" },
    { value: "ธนาคารกรุงไทย", label: "ธนาคารกรุงไทย (KTB)" },
    { value: "ธนาคารกรุงศรี", label: "ธนาคารกรุงศรีอยุธยา (BAY)" },
    { value: "ธนาคารทหารไทยธนชาต", label: "ธนาคารทหารไทยธนชาต (TTB)" },
    { value: "ธนาคารออมสิน", label: "ธนาคารออมสิน" },
    { value: "ธนาคาร ธ.ก.ส.", label: "ธ.ก.ส." },
    { value: "อื่นๆ", label: "อื่นๆ" },
  ];

  const columns = [
    { key: "name", label: "ธนาคาร" },
    { key: "accountName", label: "ชื่อบัญชี" },
    { key: "accountNo", label: "เลขบัญชี" },
    { key: "branch", label: "สาขา" },
  ];

  const fields = [
    { key: "name", label: "ธนาคาร", type: "select", required: true, options: bankOptions },
    { key: "accountName", label: "ชื่อบัญชี", required: true, placeholder: "ชื่อเจ้าของบัญชี" },
    { key: "accountNo", label: "เลขบัญชี", required: true, placeholder: "xxx-x-xxxxx-x" },
    { key: "branch", label: "สาขา", placeholder: "ชื่อสาขา" },
    { key: "note", label: "หมายเหตุ", placeholder: "หมายเหตุ (ถ้ามี)" },
  ];

  return (
    <CrudPage
      title="รายการธนาคาร"
      subtitle="จัดการบัญชีธนาคาร"
      items={banks}
      columns={columns}
      fields={fields}
      onAdd={addBank}
      onEdit={updateBank}
      onDelete={deleteBank}
    />
  );
}
