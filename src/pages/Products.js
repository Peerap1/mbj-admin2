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
    { value: "product",  label: "ผลิตภัณฑ์" },
    { value: "material", label: "วัตถุดิบ" },
  ];

  const columns = [
    { key: "name", label: "ชื่อสินค้า" },
    {
      key: "productType", label: "ประเภท",
      render: (v) => (
        <span className={`badge ${v === "material" ? "badge-warning" : "badge-primary"}`}>
          {v === "material" ? "วัตถุดิบ" : "ผลิตภัณฑ์"}
        </span>
      ),
    },
    { key: "price", label: "ราคา", render: (v) => <strong style={{ color:"var(--primary)" }}>{Number(v||0).toLocaleString()}</strong> },
    { key: "description", label: "รายละเอียด" },
  ];

  const fields = [
    { key: "name",        label: "ชื่อสินค้า",    required: true, placeholder: "กรอกชื่อสินค้า" },
    { key: "productType", label: "ประเภทสินค้า", type: "select", required: true, options: productTypeOptions },
    { key: "price",       label: "ราคา (บาท)",   type: "number", required: true, placeholder: "0.00" },
    { key: "description", label: "รายละเอียด",   type: "textarea", placeholder: "รายละเอียดสินค้า" },
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
