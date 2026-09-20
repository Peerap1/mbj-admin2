import useCollection from "../hooks/useCollection";
import useSaleCart from "../features/sales/useSaleCart";
import SaleBoxes from "../features/sales/SaleBoxes";
import SaleSummary from "../features/sales/SaleSummary";
import ProductPicker from "../features/sales/ProductPicker";
import SaleCustomerForm from "../features/sales/SaleCustomerForm";
// src/pages/Sales.js
import React, { useState } from "react";
import { getCustomers, getProducts, getBanks, addSale } from "../firebase/database";
import SlipModal from "../features/sales/SlipModal";
import { useAuth } from "../context/AuthContext";

// ─── Searchable customer dropdown ──────────────────────────────

import { calculateSaleTotals, validateSale, buildSaleData, newBox } from "../features/sales/sales";
export default function Sales() {
  const { user } = useAuth();
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCollection(getCustomers);
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
  } = useCollection(getProducts);
  const { data: banks, loading: banksLoading, error: banksError } = useCollection(getBanks);
  const {
    boxes,
    setBoxes,
    addBox,
    removeBox,
    updateBoxQty,
    addRowToBox,
    updateRow,
    removeRow,
    quickAdd,
  } = useSaleCart(products);
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState({
    customerId: "",
    bankId: "",
    note: "",
    shippingType: "",
    shippingCustom: "",
  });
  const [loading, setLoading] = useState(false);
  const [lastSavedSale, setLastSavedSale] = useState(null); // ใบส่งของเฉพาะหลัง save
  const [showSlip, setShowSlip] = useState(false);

  // ─── Totals ────────────────────────────────────────────────────
  const { subtotal, numBoxes, shippingCost, grandTotal } = calculateSaleTotals(boxes, form);

  const visibleProducts = products.filter(
    (p) => tab === "all" || (p.productType || "product") === tab,
  );
  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const selectedBank = banks.find((b) => b.id === form.bankId);

  // ─── Save ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationError = validateSale({ form, boxes, selectedCustomer });
    if (validationError) {
      alert(validationError);
      return;
    }
    setLoading(true);
    try {
      const saleData = buildSaleData({ form, boxes, selectedCustomer, selectedBank, user });
      const savedSale = await addSale(saleData);
      // เก็บ snapshot ไว้แสดงใบส่งของ แล้ว reset form
      setLastSavedSale(savedSale);
      setBoxes([newBox()]);
      setForm({ customerId: "", bankId: "", note: "", shippingType: "", shippingCustom: "" });
      setShowSlip(true); // เปิดใบส่งของทันที
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  // ─── Print ─────────────────────────────────────────────────────

  const dataError = customersError || productsError || banksError;
  if (dataError) return <p className="analysis-error">{dataError}</p>;
  if (customersLoading || productsLoading || banksLoading) return <p>กำลังโหลดข้อมูล…</p>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">การขาย</h2>
          <p className="page-subtitle">สร้างรายการขายใหม่</p>
        </div>
        {lastSavedSale && (
          <button className="btn btn-secondary" onClick={() => setShowSlip(true)}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z"
                clipRule="evenodd"
              />
            </svg>
            ใบส่งของล่าสุด
          </button>
        )}
      </div>

      <div className="sales-grid">
        {/* ════ LEFT ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Sale info */}
          <SaleCustomerForm
            customers={customers}
            form={form}
            setForm={setForm}
            selectedCustomer={selectedCustomer}
          />

          {/* Product list */}
          <ProductPicker
            tab={tab}
            setTab={setTab}
            visibleProducts={visibleProducts}
            quickAdd={quickAdd}
          />
        </div>

        {/* ════ RIGHT: Boxes + summary ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SaleBoxes
            boxes={boxes}
            products={products}
            updateBoxQty={updateBoxQty}
            addRowToBox={addRowToBox}
            removeBox={removeBox}
            updateRow={updateRow}
            removeRow={removeRow}
          />

          <button className="add-box-btn" onClick={addBox}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            เพิ่มรายการที่ {boxes.length + 1}
          </button>

          {/* Summary */}
          <SaleSummary
            form={form}
            setForm={setForm}
            numBoxes={numBoxes}
            shippingCost={shippingCost}
            subtotal={subtotal}
            grandTotal={grandTotal}
            handleSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>

      {/* ════ Delivery Slip Modal (only from lastSavedSale) ════ */}
      {showSlip && lastSavedSale && (
        <SlipModal
          sale={lastSavedSale}
          createdBy={user?.username}
          onClose={() => setShowSlip(false)}
        />
      )}
    </div>
  );
}
