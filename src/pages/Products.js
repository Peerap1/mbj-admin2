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

  const productTypeOptions = [
    { value: "product", label: "ผลิตภัณฑ์" },
    { value: "material", label: "วัตถุดิบ" },
  ];

  const columns = [
    { key: "name", label: "ชื่อสินค้า" },
    { key: "sku", label: "SKU" },
    { key: "unit", label: "หน่วย" },
    {
      key: "productType",
      label: "ประเภท",
      render: (v) => (
        <span className={`badge ${v === "material" ? "badge-warning" : "badge-primary"}`}>
          {v === "material" ? "วัตถุดิบ" : "ผลิตภัณฑ์"}
        </span>
      ),
    },
    {
      key: "price",
      label: "ราคา",
      render: (v) => (
        <strong style={{ color: "var(--primary)" }}>{Number(v || 0).toLocaleString()}</strong>
      ),
    },
    { key: "description", label: "รายละเอียด" },
  ];

  const fields = [
    { key: "name", label: "ชื่อสินค้า", required: true, placeholder: "กรอกชื่อสินค้า" },
    { key: "sku", label: "SKU", required: true, placeholder: "เช่น SKU01 (ไม่ซ้ำกับสินค้าอื่น)" },
    {
      key: "unit",
      label: "หน่วย",
      type: "select",
      required: true,
      options: ["ถุง", "แพ็ก", "ชิ้น", "กิโลกรัม", "ลัง", "กล่อง"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "productType",
      label: "ประเภทสินค้า",
      type: "select",
      required: true,
      options: productTypeOptions,
    },
    { key: "price", label: "ราคา (บาท)", type: "number", required: true, placeholder: "0.00" },
    { key: "description", label: "รายละเอียด", type: "textarea", placeholder: "รายละเอียดสินค้า" },
  ];

  return (
    <CrudPage
      title="สินค้า"
      subtitle="จัดการข้อมูลสินค้า"
      items={products}
      columns={columns}
      fields={fields}
      onAdd={(data) => saveProduct(null, data)}
      onEdit={saveProduct}
      onDelete={deleteProduct}
    />
  );

  function saveProduct(id, data) {
    const sku = data.sku?.trim();
    if (
      !sku ||
      products.some((p) => p.id !== id && p.sku?.trim().toLowerCase() === sku.toLowerCase())
    ) {
      alert("กรุณาระบุ SKU ที่ไม่ซ้ำกับสินค้าอื่น");
      throw new Error("Duplicate or empty SKU");
    }
    if (!Number.isFinite(Number(data.price)) || Number(data.price) < 0)
      throw new Error("Invalid price");
    const { id: ignored, ...payload } = data;
    return id ? updateProduct(id, { ...payload, sku }) : addProduct({ ...payload, sku });
  }
}
