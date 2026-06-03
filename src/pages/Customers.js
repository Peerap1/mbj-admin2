// src/pages/Customers.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../firebase/database";

export default function Customers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const unsub = getCustomers(setCustomers);
    return unsub;
  }, []);

  const columns = [
    { key: "name", label: "ชื่อลูกค้า" },
    { key: "phone", label: "เบอร์โทร" },
    { key: "address", label: "ที่อยู่" },
  ];

  const fields = [
    { key: "name", label: "ชื่อลูกค้า", required: true, placeholder: "กรอกชื่อลูกค้า" },
    { key: "phone", label: "เบอร์โทรศัพท์", type: "tel", placeholder: "0xx-xxx-xxxx" },
    { key: "address", label: "ที่อยู่", type: "textarea", placeholder: "กรอกที่อยู่" },
    { key: "note", label: "หมายเหตุ", placeholder: "หมายเหตุ (ถ้ามี)" },
  ];

  return (
    <CrudPage
      title="ลูกค้า"
      subtitle="จัดการข้อมูลลูกค้า"
      items={customers}
      columns={columns}
      fields={fields}
      onAdd={addCustomer}
      onEdit={updateCustomer}
      onDelete={deleteCustomer}
    />
  );
}
