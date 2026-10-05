import React from "react";

export default function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (!total) return null;
  return (
    <nav
      aria-label="แบ่งหน้ารายการ"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 16,
      }}
    >
      <span
        style={{ fontSize: "var(--text-control)", color: "var(--text-muted)" }}
        aria-live="polite"
      >
        แสดง {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} จาก {total} รายการ
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ก่อนหน้า
        </button>
        <span style={{ fontSize: "var(--text-control)" }}>
          หน้า {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ถัดไป
        </button>
      </div>
    </nav>
  );
}
