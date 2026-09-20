import useCollection from "../hooks/useCollection";
import PaymentModal from "../features/sales/PaymentModal";
// src/pages/History.js
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getSales, deleteSale, updateSale, getBanks } from "../firebase/database";
import SlipModal from "../features/sales/SlipModal";

// ─── Payment modal ──────────────────────────────────────────────

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrder = searchParams.get("order");
  const { data: sales, loading: salesLoading, error: salesError } = useCollection(getSales);
  const { data: banks, loading: banksLoading, error: banksError } = useCollection(getBanks);
  const [search, setSearch] = useState("");
  const [slipSale, setSlipSale] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [payModal, setPayModal] = useState(null);

  useEffect(() => {
    if (requestedOrder) {
      const sale = sales.find((item) => item.id === requestedOrder);
      if (sale) setSlipSale(sale);
    }
  }, [requestedOrder, sales]);
  const closeSlip = () => {
    setSlipSale(null);
    if (requestedOrder) setSearchParams({}, { replace: true });
  };

  const filtered = sales
    .filter(
      (s) =>
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
        s.createdBy?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const formatDate = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteSale(id);
      setDeleteConfirm(null);
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
    setDeleting(false);
  };

  const confirmPay = async (saleId, paymentData) => {
    try {
      await updateSale(saleId, { status: "paid", payment: paymentData, paidAt: Date.now() });
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const revertPay = async (saleId) => {
    try {
      await updateSale(saleId, { status: "pending", payment: null, paidAt: null });
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const dataError = salesError || banksError;
  if (dataError) return <p className="analysis-error">{dataError}</p>;
  if (salesLoading || banksLoading) return <p>กำลังโหลดข้อมูล…</p>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">ประวัติการขาย</h2>
          <p className="page-subtitle">รายการขายทั้งหมด {filtered.length} รายการ</p>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 ค้นหาลูกค้า, ผู้ขาย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>ลูกค้า</th>
                <th style={{ width: 110 }}>ยอดรวม</th>
                <th style={{ width: 90 }}>ผู้ขาย</th>
                <th style={{ width: 110 }}>วันที่</th>
                <th style={{ width: 110 }}>สถานะ</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--gray-400)",
                      maxWidth: "none",
                    }}
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filtered.map((sale, i) => (
                  <tr key={sale.id}>
                    <td style={{ color: "var(--gray-400)", fontSize: 12, maxWidth: "none" }}>
                      {i + 1}
                    </td>
                    <td title={sale.customerName}>
                      {sale.customerId ? (
                        <Link className="analysis-link" to={`/customers/${sale.customerId}`}>
                          {sale.customerName || "-"}
                        </Link>
                      ) : (
                        <strong>{sale.customerName || "-"}</strong>
                      )}
                    </td>
                    <td style={{ maxWidth: "none" }}>
                      <strong style={{ color: "var(--primary)" }}>
                        {Number(sale.total || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td title={sale.createdBy}>{sale.createdBy || "-"}</td>
                    <td style={{ fontSize: 12, color: "var(--gray-500)", maxWidth: "none" }}>
                      {formatDate(sale.createdAt)}
                    </td>
                    <td style={{ maxWidth: "none" }}>
                      {sale.status === "paid" ? (
                        <button
                          className="status-toggle paid"
                          onClick={() => revertPay(sale.id)}
                          title="คลิกเพื่อยกเลิกการชำระ"
                        >
                          ✓ ชำระแล้ว
                        </button>
                      ) : (
                        <button
                          className="status-toggle pending"
                          onClick={() => setPayModal(sale)}
                          title="บันทึกการชำระเงิน"
                        >
                          ⏳ รอชำระ
                        </button>
                      )}
                    </td>
                    <td style={{ maxWidth: "none" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon-only"
                          title="ใบส่งของ/ใบเสร็จ"
                          onClick={() => setSlipSale(sale)}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path
                              fillRule="evenodd"
                              d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v-2h8v2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon-only"
                          title="ลบ"
                          onClick={() => setDeleteConfirm(sale)}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slip Modal ── */}
      {slipSale && <SlipModal sale={slipSale} createdBy={slipSale.createdBy} onClose={closeSlip} />}

      {/* ── Payment Modal ── */}
      {payModal && (
        <PaymentModal
          sale={payModal}
          banks={banks}
          onConfirm={confirmPay}
          onClose={() => setPayModal(null)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ยืนยันการลบ</h3>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <p>
                ต้องการลบรายการขายของ <strong>{deleteConfirm.customerName}</strong>?
              </p>
              <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 6 }}>
                ยอด {Number(deleteConfirm.total || 0).toLocaleString()} ·{" "}
                {formatDate(deleteConfirm.createdAt)}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  "ลบรายการ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
