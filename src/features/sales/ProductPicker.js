import React from "react";

export default function ProductPicker({ tab, setTab, visibleProducts, quickAdd }) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ fontSize: 15, color: "var(--gray-800)" }}>เลือกสินค้า</h3>
        <div className="product-tab-bar">
          {[
            ["all", "ทั้งหมด"],
            ["product", "ผลิตภัณฑ์"],
            ["material", "วัตถุดิบ"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={`product-tab ${tab === k ? "active" : ""}`}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {visibleProducts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <p>ยังไม่มีสินค้า</p>
        </div>
      ) : (
        <div className="product-list">
          {visibleProducts.map((p) => (
            <div key={p.id} className="product-list-item" onClick={() => quickAdd(p)}>
              <div className="pli-left">
                <span
                  className={`badge ${(p.productType || "product") === "material" ? "badge-warning" : "badge-primary"}`}
                  style={{ fontSize: 10, padding: "2px 7px", flexShrink: 0 }}
                >
                  {(p.productType || "product") === "material" ? "วัตถุดิบ" : "ผลิตภัณฑ์"}
                </span>
                <span
                  className="pli-name"
                  title={p.name && p.name.length > 18 ? p.name : undefined}
                >
                  {p.name}
                </span>
                {p.description && (
                  <span className="pli-desc" title={p.description}>
                    {p.description}
                  </span>
                )}
              </div>
              <div className="pli-right">
                <span className="pli-price">{Number(p.price || 0).toLocaleString()}</span>
                <span className="pli-add">+ เพิ่ม</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
