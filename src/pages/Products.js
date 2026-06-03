// src/pages/Products.js
import React, { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../firebase/database";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsub = getProducts(setProducts);
    return unsub;
  }, []);

  const columns = [
    { key: "name", label: "ชื่อสินค้า" },
    { key: "price", label: "ราคา", render: (v) => <strong style={{ color:"var(--primary)" }}>฿{Number(v||0).toLocaleString()}</strong> },
    { key: "unit", label: "หน่วย" },
    { key: "category", label: "หมวดหมู่" },
  ];

  const fields = [
    { key: "name", label: "ชื่อสินค้า", required: true, placeholder: "กรอกชื่อสินค้า" },
    { key: "price", label: "ราคา (บาท)", type: "number", required: true, placeholder: "0.00" },
    { key: "unit", label: "หน่วย", placeholder: "เช่น ชิ้น, กล่อง, กก." },
    { key: "category", label: "หมวดหมู่", placeholder: "เช่น อาหาร, เครื่องดื่ม" },
    { key: "description", label: "รายละเอียด", type: "textarea", placeholder: "รายละเอียดสินค้า" },
  ];

  return (
    <CrudPage
      title="สินค้า"
      subtitle="จัดการข้อมูลสินค้า"
      items={products}
      columns={columns}
      fields={fields}
      onAdd={addProduct}
      onEdit={updateProduct}
      onDelete={deleteProduct}
    />
  );
}
